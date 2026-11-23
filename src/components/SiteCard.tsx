import { Bookmark, ExternalLink } from 'lucide-react';
import { SiteFavicon } from './SiteFavicon';
import type { UsefulSite } from '../types/site';

interface SiteCardProps {
  site: UsefulSite;
  isBookmarked: boolean;
  onToggleBookmark: (site: UsefulSite) => void;
  onSelectSite: (site: UsefulSite) => void;
}

export function SiteCard({
  site,
  isBookmarked,
  onToggleBookmark,
  onSelectSite,
}: SiteCardProps) {
  return (
    <article className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <SiteFavicon domain={site.domain} name={site.name} size="md" />
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 truncate">
                {site.name}
              </h3>
              <p className="font-mono text-xs text-slate-500 truncate">{site.domain}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleBookmark(site)}
            aria-label={isBookmarked ? `${site.name} 북마크 해제` : `${site.name} 북마크 저장`}
            aria-pressed={isBookmarked}
            className={`p-2 rounded-lg border transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              isBookmarked
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Bookmark
              className="w-4 h-4"
              fill={isBookmarked ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{site.category}</span>
          <span aria-hidden="true">·</span>
          <span>{site.pricing}</span>
          <span aria-hidden="true">·</span>
          <span>{site.koreanSupport}</span>
          {site.source === 'discovered' && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-blue-600 font-medium">실시간 탐색</span>
            </>
          )}
        </div>

        <p className="mt-3 text-sm text-slate-700 leading-relaxed line-clamp-3">
          {site.summary}
        </p>

        <p className="mt-2.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
          <span className="font-medium text-slate-700">추천 상황:</span> {site.useCase}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400 truncate min-w-0">
          {site.keywords.slice(0, 3).join(' · ')}
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSelectSite(site)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            상세 정보
          </button>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <span>방문하기</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
