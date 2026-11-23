import { RotateCcw } from 'lucide-react';
import { SITE_CATEGORIES } from '../data/curatedSites';
import type { PricingTier, SiteCategory, UsefulSite } from '../types/site';
import { DownloadMenu } from './DownloadMenu';

interface FilterBarProps {
  selectedCategory: '전체' | SiteCategory;
  onSelectCategory: (category: '전체' | SiteCategory) => void;
  selectedPricing: '전체' | PricingTier;
  onSelectPricing: (pricing: '전체' | PricingTier) => void;
  koreanOnly: boolean;
  onToggleKoreanOnly: () => void;
  filteredSites: UsefulSite[];
  totalCount: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

const PRICING_OPTIONS: readonly ('전체' | PricingTier)[] = ['전체', '무료', '부분 무료'];

export function FilterBar({
  selectedCategory,
  onSelectCategory,
  selectedPricing,
  onSelectPricing,
  koreanOnly,
  onToggleKoreanOnly,
  filteredSites,
  totalCount,
  hasActiveFilters,
  onResetFilters,
}: FilterBarProps) {
  return (
    <div id="directory-filters" className="space-y-4">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {SITE_CATEGORIES.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200"
            role="group"
            aria-label="요금 조건 필터"
          >
            {PRICING_OPTIONS.map((option) => {
              const isActive = selectedPricing === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onSelectPricing(option)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {option === '전체' ? '모든 요금' : option}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onToggleKoreanOnly}
            aria-pressed={koreanOnly}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              koreanOnly
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            한국어 지원만
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              필터 초기화
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <p className="text-xs font-medium text-slate-500 tabular-nums">
            표시 중 <span className="text-slate-900 font-semibold">{filteredSites.length}</span>개
            <span className="mx-1.5 text-slate-300">/</span>
            전체 {totalCount}개
          </p>
          <DownloadMenu
            sites={filteredSites}
            label="목록 다운로드"
            filePrefix="webatlas-directory"
            title={`WebAtlas 추천 디렉터리 (${selectedCategory})`}
          />
        </div>
      </div>
    </div>
  );
}
