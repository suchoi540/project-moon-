import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import { downloadSitesFile, type ExportFormat } from '../utils/exportSites';
import type { UsefulSite } from '../types/site';

interface DownloadMenuProps {
  sites: UsefulSite[];
  label?: string;
  filePrefix?: string;
  title?: string;
}

const FORMAT_OPTIONS: readonly { format: ExportFormat; name: string; desc: string }[] = [
  { format: 'html', name: '북마크 HTML (.html)', desc: '크롬·엣지·웨일 가져오기용' },
  { format: 'csv', name: '엑셀 CSV (.csv)', desc: '표·스프레드시트 정리용' },
  { format: 'md', name: '마크다운 (.md)', desc: '노션·문서 붙여넣기용' },
  { format: 'json', name: 'JSON (.json)', desc: '개발·백업용 데이터' },
];

export function DownloadMenu({
  sites,
  label = '목록 다운로드',
  filePrefix = 'webatlas-sites',
  title = 'WebAtlas 추천 사이트 목록',
}: DownloadMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (sites.length === 0) return null;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40"
        >
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.format}
              type="button"
              role="menuitem"
              onClick={() => {
                downloadSitesFile(sites, opt.format, { filePrefix, title });
                setIsOpen(false);
              }}
              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <p className="text-xs font-semibold text-slate-900">{opt.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
