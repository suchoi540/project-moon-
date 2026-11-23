import { useEffect, useRef } from 'react';
import { Search, X, ArrowRight, History } from 'lucide-react';
import { QUICK_SEARCH_PROMPTS } from '../data/curatedSites';

interface SearchHeroProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitDiscovery: (overrideQuery?: string) => void;
  isDiscovering: boolean;
  recentQueries: string[];
  onClearHistory: () => void;
  totalCuratedCount: number;
}

export function SearchHero({
  query,
  onQueryChange,
  onSubmitDiscovery,
  isDiscovering,
  recentQueries,
  onClearHistory,
  totalCuratedCount,
}: SearchHeroProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      onSubmitDiscovery();
    }
  };

  return (
    <section
      id="search-workbench"
      className="pt-12 pb-10 sm:pt-16 sm:pb-12 border-b border-slate-200 bg-white"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-blue-600 mb-3 tabular-nums">
            검증된 큐레이션 {totalCuratedCount}선 · 실시간 웹 탐색
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 text-balance leading-[1.18]">
            지금 필요한 사이트,
            <br className="hidden sm:inline" /> 키워드나 문장으로 바로 찾으세요.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            작업 목적이나 찾고 싶은 기능을 그대로 입력해 보세요. 입력 즉시 추천 목록을 필터링하고,
            웹에서 찾기 버튼을 누르면 실시간 검색으로 딱 맞는 사이트를 더 찾아드립니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-slate-50 border border-slate-300 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10 rounded-xl transition-all">
            <div className="flex items-center flex-1 min-w-0 px-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="예: PDF 용량 줄이기, 배경 지우기, 무료 상업용 사진, 발표 PPT 만들기"
                aria-label="찾고 있는 사이트 키워드 또는 설명 입력"
                className="w-full py-2.5 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => onQueryChange('')}
                  aria-label="검색어 지우기"
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isDiscovering || query.trim().length < 2}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <span>{isDiscovering ? '웹 탐색 중...' : '웹에서 찾기'}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 px-1">
            <span>입력만 해도 아래 목록이 즉시 필터링되며, Enter 또는 웹에서 찾기로 확장 검색이 실행됩니다.</span>
            <span className="hidden sm:inline font-mono text-slate-400">단축키 /</span>
          </div>
        </form>

        <div className="mt-7 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-medium text-slate-500 mr-1">추천 검색어</span>
            {QUICK_SEARCH_PROMPTS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  onQueryChange(item.query);
                  onSubmitDiscovery(item.query);
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {item.label}
              </button>
            ))}
          </div>

          {recentQueries.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 text-slate-400">
                <History className="w-3.5 h-3.5" aria-hidden="true" />
                최근 검색
              </span>
              {recentQueries.map((recent) => (
                <button
                  key={recent}
                  type="button"
                  onClick={() => {
                    onQueryChange(recent);
                    onSubmitDiscovery(recent);
                  }}
                  className="hover:text-slate-900 underline decoration-slate-300 underline-offset-4 transition-colors cursor-pointer truncate max-w-[200px]"
                >
                  {recent}
                </button>
              ))}
              <button
                type="button"
                onClick={onClearHistory}
                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                기록 삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
