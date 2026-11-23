import { useEffect, useState } from 'react';
import { Bookmark, Check, Copy, ExternalLink, X } from 'lucide-react';
import { SiteFavicon } from './SiteFavicon';
import type { UsefulSite } from '../types/site';

interface SiteDetailDrawerProps {
  site: UsefulSite | null;
  relatedSites: UsefulSite[];
  isBookmarked: boolean;
  onClose: () => void;
  onToggleBookmark: (site: UsefulSite) => void;
  onSelectSite: (site: UsefulSite) => void;
  onSearchKeyword: (keyword: string) => void;
}

export function SiteDetailDrawer({
  site,
  relatedSites,
  isBookmarked,
  onClose,
  onToggleBookmark,
  onSelectSite,
  onSearchKeyword,
}: SiteDetailDrawerProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [site?.id]);

  useEffect(() => {
    if (!site) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [site, onClose]);

  if (!site) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(site.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-drawer-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white h-full overflow-y-auto border-l border-slate-200 p-6 sm:p-8 flex flex-col justify-between gap-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <SiteFavicon domain={site.domain} name={site.name} size="lg" />
              <div className="min-w-0">
                <h2
                  id="detail-drawer-title"
                  className="font-display text-xl font-bold text-slate-900 truncate"
                >
                  {site.name}
                </h2>
                <p className="font-mono text-xs text-slate-500 truncate">{site.domain}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="상세 정보 닫기"
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-600 pb-5 border-b border-slate-100">
            <span className="font-medium text-slate-900">{site.category}</span>
            <span aria-hidden="true">·</span>
            <span>{site.pricing}</span>
            <span aria-hidden="true">·</span>
            <span>{site.koreanSupport}</span>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-1.5">사이트 소개</h3>
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed">
                {site.summary}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 className="text-xs font-semibold text-slate-700 mb-1">추천 활용 상황</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{site.useCase}</p>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-2">공식 주소</h3>
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-mono text-xs text-slate-700 truncate flex-1">
                  {site.url}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      <span className="text-emerald-700">복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>URL 복사</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {site.keywords.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-2">
                  클릭하여 관련 키워드로 다시 찾기
                </h3>
                <div className="flex flex-wrap gap-2">
                  {site.keywords.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        onSearchKeyword(kw);
                        onClose();
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {relatedSites.length > 0 && (
            <div className="pt-5 border-t border-slate-200 space-y-3">
              <h3 className="text-xs font-semibold text-slate-500">
                같은 분야의 추천 사이트
              </h3>
              <div className="space-y-2">
                {relatedSites.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => onSelectSite(rel)}
                    className="w-full flex items-center justify-between gap-3 p-3 text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <SiteFavicon domain={rel.domain} name={rel.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {rel.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{rel.summary}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleBookmark(site)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isBookmarked
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <Bookmark
              className="w-4 h-4"
              fill={isBookmarked ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
            <span>{isBookmarked ? '저장됨' : '저장하기'}</span>
          </button>

          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>사이트 바로 열기</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
