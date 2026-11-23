import { useState } from 'react';
import { Globe } from 'lucide-react';

interface SiteFaviconProps {
  domain: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SiteFavicon({ domain, name, size = 'md' }: SiteFaviconProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs rounded-lg',
    md: 'w-10 h-10 text-sm rounded-lg',
    lg: 'w-12 h-12 text-base rounded-xl',
  }[size];

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  if (hasError || !domain) {
    return (
      <div
        className={`${sizeClasses} shrink-0 flex items-center justify-center bg-slate-100 border border-slate-200 text-slate-600 font-semibold select-none`}
        aria-hidden="true"
      >
        <Globe className={iconSize} />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} shrink-0 flex items-center justify-center bg-slate-50 border border-slate-200 overflow-hidden`}
    >
      <img
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
        alt={`${name} 아이콘`}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-6 h-6 object-contain"
      />
    </div>
  );
}
