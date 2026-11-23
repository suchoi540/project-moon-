import { useEffect, useState } from 'react';
import { Check, Copy, Download, ExternalLink, Trash2, X } from 'lucide-react';
import { downloadSitesFile, type ExportFormat } from '../utils/exportSites';
import { SiteFavicon } from './SiteFavicon';
import type { UsefulSite } from '../types/site';

interface BookmarkDrawerProps {
  isOpen: boolean;
  bookmarks: UsefulSite[];
  onClose: () => void;
  onRemoveBookmark: (site: UsefulSite) => void;
  onSelectSite: (site: UsefulSite) => void;
}

const DOWNLOAD_FORMATS: readonly { format: ExportFormat; label: string }[] = [
  { format: 'html', label: '북마크 HTML' },
  { format: 'csv', label: '엑셀 CSV' },
  { format: 'md', label: 'Markdown' },
  { format: 'json', label: 'JSON' },
];

export function BookmarkDrawer({
  isOpen,
  bookmarks,
  onClose,
  onRemoveBookmark,
  onSelectSite,
}: BookmarkDrawerProps) {
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyList = async () => {
    const markdown = bookmarks
      .map((b) => `- [${b.name}](${b.url}) — ${b.summary}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch {
      setCopiedMarkdown(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bookmark-drawer-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full overflow-y-auto border-l border-slate-200 p-6 flex flex-col justify-between gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2
                id="bookmark-drawer-title"
                className="font-display text-xl font-bold text-slate-900 tabular-nums"
              >
                저장된 사이트 ({bookmarks.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                자주 쓰는 사이트를 모아두고 파일로 다운로드하거나 한 번에 복사할 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="저장목록 닫기"
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {bookmarks.length === 0 ? (
            <div className="py-16 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
              <p className="text-sm font-medium text-slate-700">
                아직 저장한 사이트가 없습니다.
              </p>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                사이트 카드 오른쪽 위 북마크 아이콘을 눌러 나만의 유용한 사이트 모음을 만들어 보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((site) => (
                <div
                  key={site.domain}
                  className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSite(site);
                      onClose();
                    }}
                    className="flex items-start gap-3 min-w-0 text-left cursor-pointer group"
                  >
                    <SiteFavicon domain={site.domain} name={site.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {site.name}
                      </p>
                      <p className="font-mono text-xs text-slate-500 truncate">
                        {site.domain}
                      </p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {site.summary}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${site.name} 새 창에서 열기`}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onRemoveBookmark(site)}
                      aria-label={`${site.name} 저장 목록에서 삭제`}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {bookmarks.length > 0 && (
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">파일로 다운로드</p>
              <div className="grid grid-cols-2 gap-2">
                {DOWNLOAD_FORMATS.map((item) => (
                  <button
                    key={item.format}
                    type="button"
                    onClick={() =>
                      downloadSitesFile(bookmarks, item.format, {
                        filePrefix: 'webatlas-bookmarks',
                        title: 'WebAtlas 저장된 사이트 모음',
                      })
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyList}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {copiedMarkdown ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span>Markdown 목록 복사 완료</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  <span>저장 목록 전체 복사 (Markdown)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
