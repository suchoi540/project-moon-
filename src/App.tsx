import { useMemo, useState } from 'react';
import { ArrowRight, SearchX } from 'lucide-react';
import { BookmarkDrawer } from './components/BookmarkDrawer';
import { DiscoverySection } from './components/DiscoverySection';
import { FilterBar } from './components/FilterBar';
import { Header } from './components/Header';
import { SearchHero } from './components/SearchHero';
import { SiteCard } from './components/SiteCard';
import { SiteDetailDrawer } from './components/SiteDetailDrawer';
import { CURATED_SITES } from './data/curatedSites';
import type {
  DiscoveryResponse,
  PricingTier,
  SiteCategory,
  UsefulSite,
} from './types/site';

const BOOKMARKS_STORAGE_KEY = 'webatlas_bookmarks_v1';
const HISTORY_STORAGE_KEY = 'webatlas_recent_queries_v1';

function loadBookmarks(): UsefulSite[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function scoreSiteMatch(site: UsefulSite, tokens: string[]): number {
  if (tokens.length === 0) return 1;

  const nameLower = site.name.toLowerCase();
  const domainLower = site.domain.toLowerCase();
  const categoryLower = site.category.toLowerCase();
  const summaryLower = site.summary.toLowerCase();
  const useCaseLower = site.useCase.toLowerCase();
  const keywordsLower = site.keywords.map((k) => k.toLowerCase());

  let totalScore = 0;

  for (const token of tokens) {
    let tokenScore = 0;
    if (nameLower.includes(token)) tokenScore += 10;
    if (domainLower.includes(token)) tokenScore += 8;
    if (keywordsLower.some((k) => k === token)) tokenScore += 12;
    else if (keywordsLower.some((k) => k.includes(token) || token.includes(k))) tokenScore += 6;
    if (categoryLower.includes(token)) tokenScore += 5;
    if (summaryLower.includes(token)) tokenScore += 4;
    if (useCaseLower.includes(token)) tokenScore += 4;
    totalScore += tokenScore;
  }

  return totalScore;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'전체' | SiteCategory>('전체');
  const [selectedPricing, setSelectedPricing] = useState<'전체' | PricingTier>('전체');
  const [koreanOnly, setKoreanOnly] = useState(false);

  const [bookmarks, setBookmarks] = useState<UsefulSite[]>(() => loadBookmarks());
  const [recentQueries, setRecentQueries] = useState<string[]>(() => loadHistory());

  const [selectedSite, setSelectedSite] = useState<UsefulSite | null>(null);
  const [isBookmarkDrawerOpen, setIsBookmarkDrawerOpen] = useState(false);

  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [activeDiscoveryQuery, setActiveDiscoveryQuery] = useState('');
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResponse | null>(null);

  const bookmarkedDomains = useMemo(
    () => new Set(bookmarks.map((b) => b.domain)),
    [bookmarks]
  );

  const saveBookmarkList = (next: UsefulSite[]) => {
    setBookmarks(next);
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleToggleBookmark = (site: UsefulSite) => {
    const exists = bookmarks.some((b) => b.domain === site.domain);
    if (exists) {
      saveBookmarkList(bookmarks.filter((b) => b.domain !== site.domain));
    } else {
      saveBookmarkList([site, ...bookmarks]);
    }
  };

  const recordSearchHistory = (searchText: string) => {
    const normalized = searchText.trim();
    if (!normalized) return;
    const next = [normalized, ...recentQueries.filter((q) => q !== normalized)].slice(0, 6);
    setRecentQueries(next);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  };

  const handleClearHistory = () => {
    setRecentQueries([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  const [discoveryCache] = useState<Map<string, DiscoveryResponse>>(() => new Map());

  const runLiveDiscovery = async (overrideQuery?: string) => {
    const targetQuery = (overrideQuery ?? query).trim();
    if (targetQuery.length < 2 || isDiscovering) return;

    const cacheKey = `${targetQuery.toLowerCase()}|${selectedCategory}|${selectedPricing}`;
    const cached = discoveryCache.get(cacheKey);
    if (cached) {
      setActiveDiscoveryQuery(targetQuery);
      setDiscoveryError(null);
      setDiscoveryResult(cached);
      recordSearchHistory(targetQuery);
      return;
    }

    setActiveDiscoveryQuery(targetQuery);
    setIsDiscovering(true);
    setDiscoveryError(null);
    recordSearchHistory(targetQuery);

    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: targetQuery,
          category: selectedCategory,
          pricing: selectedPricing,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '사이트 탐색 요청에 실패했습니다.');
      }

      const resultData = data as DiscoveryResponse;
      discoveryCache.set(cacheKey, resultData);
      setDiscoveryResult(resultData);
    } catch (err) {
      setDiscoveryError(
        err instanceof Error ? err.message : '실시간 웹 탐색 중 오류가 발생했습니다.'
      );
    } finally {
      setIsDiscovering(false);
    }
  };

  const filteredCuratedSites = useMemo(() => {
    const normalizedTokens = query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);

    const matched = CURATED_SITES.filter((site) => {
      if (selectedCategory !== '전체' && site.category !== selectedCategory) return false;
      if (selectedPricing !== '전체' && site.pricing !== selectedPricing) return false;
      if (koreanOnly && site.koreanSupport !== '한국어 지원') return false;
      return true;
    })
      .map((site) => ({
        site,
        score: scoreSiteMatch(site, normalizedTokens),
      }))
      .filter((entry) => entry.score > 0);

    if (normalizedTokens.length > 0) {
      matched.sort((a, b) => b.score - a.score);
    }

    return matched.map((entry) => entry.site);
  }, [query, selectedCategory, selectedPricing, koreanOnly]);

  const relatedSites = useMemo(() => {
    if (!selectedSite) return [];
    return CURATED_SITES.filter(
      (item) => item.category === selectedSite.category && item.domain !== selectedSite.domain
    ).slice(0, 3);
  }, [selectedSite]);

  const hasActiveFilters =
    query.trim().length > 0 ||
    selectedCategory !== '전체' ||
    selectedPricing !== '전체' ||
    koreanOnly;

  const handleResetFilters = () => {
    setQuery('');
    setSelectedCategory('전체');
    setSelectedPricing('전체');
    setKoreanOnly(false);
  };

  const handleResetAll = () => {
    handleResetFilters();
    setDiscoveryResult(null);
    setDiscoveryError(null);
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        bookmarkCount={bookmarks.length}
        onOpenBookmarks={() => setIsBookmarkDrawerOpen(true)}
        onResetAll={handleResetAll}
      />

      <main className="flex-1">
        <SearchHero
          query={query}
          onQueryChange={setQuery}
          onSubmitDiscovery={runLiveDiscovery}
          isDiscovering={isDiscovering}
          recentQueries={recentQueries}
          onClearHistory={handleClearHistory}
          totalCuratedCount={CURATED_SITES.length}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          <DiscoverySection
            isLoading={isDiscovering}
            error={discoveryError}
            activeQuery={activeDiscoveryQuery}
            result={discoveryResult}
            bookmarkedIds={bookmarkedDomains}
            onToggleBookmark={handleToggleBookmark}
            onSelectSite={setSelectedSite}
            onRetry={() => runLiveDiscovery(activeDiscoveryQuery)}
            onDismiss={() => {
              setDiscoveryResult(null);
              setDiscoveryError(null);
            }}
          />

          <section id="curated-directory" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  추천 웹사이트 디렉터리
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  디자인, PDF 문서, 개발, AI, 학습까지 실무에서 자주 쓰이는 검증된 사이트를 분류별로 찾아보세요.
                </p>
              </div>
            </div>

            <FilterBar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedPricing={selectedPricing}
              onSelectPricing={setSelectedPricing}
              koreanOnly={koreanOnly}
              onToggleKoreanOnly={() => setKoreanOnly((prev) => !prev)}
              filteredSites={filteredCuratedSites}
              totalCount={CURATED_SITES.length}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleResetFilters}
            />

            {filteredCuratedSites.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <SearchX className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-base font-semibold text-slate-900">
                    기본 디렉터리에서 일치하는 사이트를 찾지 못했습니다
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {query.trim().length >= 2
                      ? `"${query.trim()}"에 맞는 사이트를 실시간 웹 검색으로 바로 찾아드릴 수 있습니다.`
                      : '선택한 분류나 요금 조건을 조금 넓혀서 다시 확인해 보세요.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {query.trim().length >= 2 && (
                    <button
                      type="button"
                      onClick={() => runLiveDiscovery()}
                      disabled={isDiscovering}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>실시간 웹에서 찾기</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    전체 목록 보기
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCuratedSites.map((site) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    isBookmarked={bookmarkedDomains.has(site.domain)}
                    onToggleBookmark={handleToggleBookmark}
                    onSelectSite={setSelectedSite}
                  />
                ))}
              </div>
            )}
          </section>

          <section
            id="usage-guide"
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8"
          >
            <h2 className="font-display text-lg font-bold text-slate-900 mb-5">
              더 정확하게 사이트를 찾는 3가지 방법
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-blue-600 tabular-nums">01</p>
                <h3 className="text-sm font-semibold text-slate-900">
                  단어가 생각나지 않을 땐 상황 문장으로 입력
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  &ldquo;발표 자료를 자동으로 만들어주는 사이트&rdquo;처럼 하고 싶은 작업을 그대로 입력하고 웹에서 찾기를 눌러보세요.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-blue-600 tabular-nums">02</p>
                <h3 className="text-sm font-semibold text-slate-900">
                  요금과 한국어 지원 여부로 빠르게 추리기
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  무료 도구만 찾거나 한국어 인터페이스가 꼭 필요하다면 상단 필터 버튼으로 조건에 맞는 사이트만 남길 수 있습니다.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-blue-600 tabular-nums">03</p>
                <h3 className="text-sm font-semibold text-slate-900">
                  북마크 저장 및 파일로 다운로드
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  저장목록이나 검색 결과를 브라우저 북마크 HTML, 엑셀 CSV, Markdown 파일로 바로 내려받아 팀이나 내 브라우저에 가져올 수 있습니다.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-display font-semibold text-slate-900 text-sm">
              WebAtlas
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">큐레이션 {CURATED_SITES.length}개 사이트 수록</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={handleResetAll}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              전체 초기화
            </button>
            <button
              type="button"
              onClick={() => setIsBookmarkDrawerOpen(true)}
              className="hover:text-slate-900 transition-colors cursor-pointer tabular-nums"
            >
              내 북마크 ({bookmarks.length})
            </button>
          </div>
        </div>
      </footer>

      <SiteDetailDrawer
        site={selectedSite}
        relatedSites={relatedSites}
        isBookmarked={selectedSite ? bookmarkedDomains.has(selectedSite.domain) : false}
        onClose={() => setSelectedSite(null)}
        onToggleBookmark={handleToggleBookmark}
        onSelectSite={setSelectedSite}
        onSearchKeyword={(kw) => {
          setQuery(kw);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <BookmarkDrawer
        isOpen={isBookmarkDrawerOpen}
        bookmarks={bookmarks}
        onClose={() => setIsBookmarkDrawerOpen(false)}
        onRemoveBookmark={handleToggleBookmark}
        onSelectSite={setSelectedSite}
      />
    </div>
  );
}
