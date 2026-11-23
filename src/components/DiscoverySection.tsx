import { AlertCircle, ExternalLink, RefreshCw, X } from 'lucide-react';
import { DownloadMenu } from './DownloadMenu';
import { SiteCard } from './SiteCard';
import type { DiscoveryResponse, UsefulSite } from '../types/site';

interface DiscoverySectionProps {
  isLoading: boolean;
  error: string | null;
  activeQuery: string;
  result: DiscoveryResponse | null;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (site: UsefulSite) => void;
  onSelectSite: (site: UsefulSite) => void;
  onRetry: () => void;
  onDismiss: () => void;
}

export function DiscoverySection({
  isLoading,
  error,
  activeQuery,
  result,
  bookmarkedIds,
  onToggleBookmark,
  onSelectSite,
  onRetry,
  onDismiss,
}: DiscoverySectionProps) {
  if (!isLoading && !error && !result) {
    return null;
  }

  return (
    <section
      id="discovery-results"
      aria-live="polite"
      className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-blue-600">
            실시간 웹 탐색 결과
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
            {isLoading
              ? `"${activeQuery}" 조건에 맞는 사이트를 찾고 있습니다`
              : error
              ? '웹 탐색 중 문제가 발생했습니다'
              : `"${result?.query}" 맞춤 추천 사이트`}
          </h2>
          {result?.answerSummary && !isLoading && !error && (
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              {result.answerSummary}
            </p>
          )}
        </div>

        {!isLoading && (
          <div className="flex items-center gap-2 shrink-0">
            {result && !error && result.sites.length > 0 && (
              <DownloadMenu
                sites={result.sites}
                label="결과 다운로드"
                filePrefix="webatlas-search"
                title={`WebAtlas 검색 결과 - ${result.query}`}
              />
            )}
            <button
              type="button"
              onClick={onDismiss}
              aria-label="실시간 탐색 결과 닫기"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              닫기
            </button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-xl p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded w-2/3" />
              <div className="space-y-2">
                <div className="h-3.5 bg-slate-200 rounded w-full" />
                <div className="h-3.5 bg-slate-200 rounded w-5/6" />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <div className="h-7 bg-slate-100 rounded-lg w-20" />
                <div className="h-7 bg-slate-200 rounded-lg w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-red-900">{error}</p>
              <p className="text-xs text-red-700 mt-1">
                잠시 후 다시 시도하거나 아래 추천 디렉터리에서 키워드로 직접 찾아보실 수 있습니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            다시 시도
          </button>
        </div>
      )}

      {result && !isLoading && !error && (
        <>
          {result.sites.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-sm font-medium text-slate-800">
                검색 조건에 해당하는 사이트를 찾지 못했습니다.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                조금 더 구체적인 기능이나 영문 키워드를 함께 입력해 보세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {result.sites.map((site) => (
                <SiteCard
                  key={site.id}
                  site={site}
                  isBookmarked={bookmarkedIds.has(site.domain)}
                  onToggleBookmark={onToggleBookmark}
                  onSelectSite={onSelectSite}
                />
              ))}
            </div>
          )}

          {result.sources.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-2">
                웹 검색 검증 출처
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {result.sources.map((src) => (
                  <a
                    key={src.url}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 underline decoration-slate-300 underline-offset-4 transition-colors max-w-[260px] truncate"
                  >
                    <span className="truncate">{src.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
