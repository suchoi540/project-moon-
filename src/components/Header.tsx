interface HeaderProps {
  bookmarkCount: number;
  onOpenBookmarks: () => void;
  onResetAll: () => void;
}

export function Header({ bookmarkCount, onOpenBookmarks, onResetAll }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onResetAll();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          WebAtlas
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a
            href="#search-workbench"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            사이트 탐색
          </a>
          <a
            href="#directory-filters"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            분야별 분류
          </a>
          <a
            href="#curated-directory"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            추천 디렉터리
          </a>
          <a
            href="#usage-guide"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            검색 팁
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenBookmarks}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            저장목록 ({bookmarkCount})
          </button>
        </div>
      </div>
    </header>
  );
}
