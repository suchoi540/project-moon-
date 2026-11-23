import type { UsefulSite } from '../types/site';

export type ExportFormat = 'html' | 'csv' | 'md' | 'json';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeCsvCell(text: string): string {
  const safe = text.replace(/\r?\n/g, ' ');
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function buildBookmarksHtml(sites: UsefulSite[], title: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const grouped = new Map<string, UsefulSite[]>();
  for (const site of sites) {
    const list = grouped.get(site.category) ?? [];
    list.push(site);
    grouped.set(site.category, list);
  }

  const folderBlocks = Array.from(grouped.entries())
    .map(([category, items]) => {
      const links = items
        .map(
          (s) =>
            `        <DT><A HREF="${escapeHtml(s.url)}" ADD_DATE="${timestamp}">${escapeHtml(s.name)} — ${escapeHtml(s.summary)}</A>`
        )
        .join('\n');
      return `    <DT><H3 ADD_DATE="${timestamp}">${escapeHtml(category)}</H3>\n    <DL><p>\n${links}\n    </DL><p>`;
    })
    .join('\n');

  return [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<!-- This is an automatically generated file.',
    '     It will be read and overwritten.',
    '     DO NOT EDIT! -->',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    `<TITLE>${escapeHtml(title)}</TITLE>`,
    `<H1>${escapeHtml(title)}</H1>`,
    '<DL><p>',
    `  <DT><H3 ADD_DATE="${timestamp}">${escapeHtml(title)}</H3>`,
    '  <DL><p>',
    folderBlocks,
    '  </DL><p>',
    '</DL><p>',
  ].join('\n');
}

function buildCsv(sites: UsefulSite[]): string {
  const header = ['이름', '도메인', 'URL', '분류', '요금', '언어지원', '소개', '추천 상황', '키워드'];
  const rows = sites.map((s) =>
    [
      s.name,
      s.domain,
      s.url,
      s.category,
      s.pricing,
      s.koreanSupport,
      s.summary,
      s.useCase,
      s.keywords.join(' / '),
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  // UTF-8 BOM ensures Korean characters render cleanly in Microsoft Excel
  return '\uFEFF' + [header.join(','), ...rows].join('\r\n');
}

function buildMarkdown(sites: UsefulSite[], title: string): string {
  const lines = [
    `# ${title}`,
    '',
    `총 ${sites.length}개 사이트`,
    '',
    ...sites.flatMap((s) => [
      `## [${s.name}](${s.url})`,
      `- **분류:** ${s.category} · ${s.pricing} · ${s.koreanSupport}`,
      `- **설명:** ${s.summary}`,
      `- **추천 상황:** ${s.useCase}`,
      s.keywords.length > 0 ? `- **키워드:** ${s.keywords.join(', ')}` : '',
      '',
    ]),
  ];
  return lines.filter((line, idx, arr) => !(line === '' && arr[idx - 1] === '')).join('\n');
}

function buildJson(sites: UsefulSite[], title: string): string {
  return JSON.stringify(
    {
      title,
      exportedAt: new Date().toISOString(),
      count: sites.length,
      sites: sites.map(({ name, url, domain, category, pricing, koreanSupport, summary, useCase, keywords }) => ({
        name,
        url,
        domain,
        category,
        pricing,
        koreanSupport,
        summary,
        useCase,
        keywords,
      })),
    },
    null,
    2
  );
}

export function downloadSitesFile(
  sites: UsefulSite[],
  format: ExportFormat,
  options?: { filePrefix?: string; title?: string }
): void {
  if (sites.length === 0) return;

  const prefix = options?.filePrefix || 'webatlas-sites';
  const title = options?.title || 'WebAtlas 유용한 사이트 모음';
  const dateStamp = new Date().toISOString().slice(0, 10);

  let content = '';
  let mimeType = 'text/plain;charset=utf-8';
  let extension = 'txt';

  switch (format) {
    case 'html':
      content = buildBookmarksHtml(sites, title);
      mimeType = 'text/html;charset=utf-8';
      extension = 'html';
      break;
    case 'csv':
      content = buildCsv(sites);
      mimeType = 'text/csv;charset=utf-8';
      extension = 'csv';
      break;
    case 'md':
      content = buildMarkdown(sites, title);
      mimeType = 'text/markdown;charset=utf-8';
      extension = 'md';
      break;
    case 'json':
      content = buildJson(sites, title);
      mimeType = 'application/json;charset=utf-8';
      extension = 'json';
      break;
  }

  const blob = new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `${prefix}-${dateStamp}.${extension}`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
