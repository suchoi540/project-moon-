export type SiteCategory =
  | '디자인·이미지'
  | '문서·PDF·오피스'
  | '개발·IT'
  | '생산성·협업'
  | '학습·레퍼런스'
  | '영상·오디오'
  | '마케팅·비즈니스'
  | '데이터·유틸리티';

export type PricingTier = '무료' | '부분 무료' | '유료';

export type LanguageSupport = '한국어 지원' | '다국어/영어';

export interface UsefulSite {
  id: string;
  name: string;
  url: string;
  domain: string;
  category: SiteCategory;
  pricing: PricingTier;
  koreanSupport: LanguageSupport;
  summary: string;
  useCase: string;
  keywords: string[];
  featured?: boolean;
  source?: 'curated' | 'discovered';
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface DiscoveryResponse {
  query: string;
  answerSummary: string;
  sites: UsefulSite[];
  sources: GroundingSource[];
}
