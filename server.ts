import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const ALLOWED_CATEGORIES = [
  '디자인·이미지',
  '문서·PDF·오피스',
  '개발·IT',
  '생산성·협업',
  '학습·레퍼런스',
  '영상·오디오',
  '마케팅·비즈니스',
  '데이터·유틸리티',
] as const;

const ALLOWED_PRICING = ['무료', '부분 무료', '유료'] as const;

interface RawDiscoveredSite {
  name?: unknown;
  url?: unknown;
  category?: unknown;
  pricing?: unknown;
  koreanSupport?: unknown;
  summary?: unknown;
  useCase?: unknown;
  keywords?: unknown;
}

interface CachedDiscoveryPayload {
  expiresAt: number;
  data: {
    query: string;
    answerSummary: string;
    sites: unknown[];
    sources: { title: string; url: string }[];
  };
}

const discoveryCache = new Map<string, CachedDiscoveryPayload>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiErrorInfo(error: unknown): { status: number; code: string; message: string } {
  const errObj = error as { status?: number; message?: string };
  const rawMessage = errObj?.message ?? String(error ?? '');

  let status = typeof errObj?.status === 'number' ? errObj.status : 500;
  let code = '';

  const jsonMatch = rawMessage.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        error?: { code?: number; status?: string; message?: string };
      };
      if (typeof parsed.error?.code === 'number') {
        status = parsed.error.code;
      }
      if (typeof parsed.error?.status === 'string') {
        code = parsed.error.status;
      }
    } catch {
      // Ignore parse errors on error string
    }
  }

  if (rawMessage.includes('429') || code === 'RESOURCE_EXHAUSTED') {
    status = 429;
    code = 'RESOURCE_EXHAUSTED';
  } else if (rawMessage.includes('403') || code === 'PERMISSION_DENIED') {
    status = 403;
    code = 'PERMISSION_DENIED';
  } else if (rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('400')) {
    if (rawMessage.includes('API_KEY_INVALID')) {
      status = 400;
      code = 'API_KEY_INVALID';
    }
  }

  return { status, code, message: rawMessage };
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractJsonObject(rawText: string): {
  answerSummary?: string;
  sites?: RawDiscoveredSite[];
} {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx > startIdx) {
      const slice = cleaned.slice(startIdx, endIdx + 1);
      return JSON.parse(slice);
    }
    throw new Error('AI 응답을 JSON으로 해석하지 못했습니다.');
  }
}

function normalizeUrl(rawUrl: string): { url: string; domain: string } | null {
  try {
    const trimmed = rawUrl.trim();
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    const domain = parsed.hostname.replace(/^www\./i, '');
    if (!domain || !domain.includes('.')) {
      return null;
    }
    return { url: parsed.toString(), domain };
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/discover', async (req, res) => {
    const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    const categoryFilter =
      typeof req.body?.category === 'string' && req.body.category !== '전체'
        ? req.body.category
        : '';
    const pricingFilter =
      typeof req.body?.pricing === 'string' && req.body.pricing !== '전체'
        ? req.body.pricing
        : '';

    if (!query || query.length < 2) {
      res.status(400).json({ error: '찾고자 하는 키워드나 설명을 2글자 이상 입력해 주세요.' });
      return;
    }

    const cacheKey = `${query.toLowerCase()}|${categoryFilter}|${pricingFilter}`;
    const cached = discoveryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.json(cached.data);
      return;
    }

    try {
      const ai = getGeminiClient();

      const constraints: string[] = [];
      if (categoryFilter) {
        constraints.push(`가능한 경우 '${categoryFilter}' 분야 중심으로 추천해 주세요.`);
      }
      if (pricingFilter) {
        constraints.push(`요금 조건은 '${pricingFilter}' 위주로 우선 선별해 주세요.`);
      }

      const systemInstruction = [
        '당신은 사용자의 목적과 키워드에 딱 맞는 실제 유용한 웹사이트를 찾아주는 큐레이션 전문가입니다.',
        '반드시 현재 실제로 접속 가능한 공식 웹사이트 URL(https://...)만 추천하세요.',
        '존재하지 않거나 추측한 URL은 절대 작성하지 마세요.',
        '응답은 오직 순수 JSON 객체 하나만 출력하세요. 마크다운 코드블록(```)이나 추가 설명 문장을 붙이지 마세요.',
        'JSON 형식:',
        '{',
        '  "answerSummary": "검색 의도에 맞춘 1~2문장의 한국어 요약 가이드",',
        '  "sites": [',
        '    {',
        '      "name": "사이트 이름",',
        '      "url": "https://공식도메인/경로",',
        '      "category": "디자인·이미지 | 문서·PDF·오피스 | 개발·IT | 생산성·협업 | 학습·레퍼런스 | 영상·오디오 | 마케팅·비즈니스 | 데이터·유틸리티 중 정확히 1개",',
        '      "pricing": "무료 | 부분 무료 | 유료 중 정확히 1개",',
        '      "koreanSupport": "한국어 지원 | 다국어/영어 중 정확히 1개",',
        '      "summary": "사이트의 핵심 기능과 장점을 설명하는 1~2문장 한국어 설명",',
        '      "useCase": "어떤 상황에서 쓰면 가장 유용한지 구체적인 1문장",',
        '      "keywords": ["관련키워드1", "관련키워드2", "관련키워드3"]',
        '    }',
        '  ]',
        '}',
      ].join('\n');

      const prompt = [
        `사용자 검색 요청: "${query}"`,
        ...constraints,
        `현재 실제로 운영 중이며 신뢰도가 높은 유용한 웹사이트 4~6개를 찾아 JSON으로 반환하세요.`,
      ].join('\n');

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction,
          },
        });
      } catch (primaryError) {
        const info = getApiErrorInfo(primaryError);
        if (info.status === 429 || info.status === 503) {
          await sleep(1000);
          try {
            response = await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: prompt,
              config: {
                thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
                responseMimeType: 'application/json',
                systemInstruction,
              },
            });
          } catch (fallbackError) {
            throw fallbackError;
          }
        } else {
          throw primaryError;
        }
      }

      const rawText = response.text ?? '';
      if (!rawText.trim()) {
        res.status(502).json({ error: '검색 결과를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
        return;
      }

      const parsed = extractJsonObject(rawText);
      const rawSites = Array.isArray(parsed.sites) ? parsed.sites : [];

      const seenDomains = new Set<string>();
      const sites = rawSites
        .map((item, idx) => {
          const urlInfo = typeof item.url === 'string' ? normalizeUrl(item.url) : null;
          if (!urlInfo || seenDomains.has(urlInfo.domain)) {
            return null;
          }
          seenDomains.add(urlInfo.domain);

          const rawCategory = typeof item.category === 'string' ? item.category : '';
          const category = (ALLOWED_CATEGORIES as readonly string[]).includes(rawCategory)
            ? rawCategory
            : '데이터·유틸리티';

          const rawPricing = typeof item.pricing === 'string' ? item.pricing : '';
          const pricing = (ALLOWED_PRICING as readonly string[]).includes(rawPricing)
            ? rawPricing
            : '부분 무료';

          const koreanSupport =
            item.koreanSupport === '한국어 지원' ? '한국어 지원' : '다국어/영어';

          const name =
            typeof item.name === 'string' && item.name.trim()
              ? item.name.trim()
              : urlInfo.domain;

          const summary =
            typeof item.summary === 'string' && item.summary.trim()
              ? item.summary.trim()
              : `${name} 공식 웹사이트입니다.`;

          const useCase =
            typeof item.useCase === 'string' && item.useCase.trim()
              ? item.useCase.trim()
              : `${query} 관련 작업 시 활용할 수 있습니다.`;

          const keywords = Array.isArray(item.keywords)
            ? item.keywords
                .filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
                .map((k) => k.trim())
                .slice(0, 5)
            : [];

          return {
            id: `ai-${Date.now()}-${idx}-${urlInfo.domain}`,
            name,
            url: urlInfo.url,
            domain: urlInfo.domain,
            category,
            pricing,
            koreanSupport,
            summary,
            useCase,
            keywords,
            source: 'discovered' as const,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const sourceSet = new Set<string>();
      const sources = groundingChunks
        .map((chunk) => {
          const web = chunk.web;
          if (!web?.uri) return null;
          if (sourceSet.has(web.uri)) return null;
          sourceSet.add(web.uri);
          return {
            title: web.title?.trim() || web.uri,
            url: web.uri,
          };
        })
        .filter((s): s is { title: string; url: string } => s !== null)
        .slice(0, 6);

      const payload = {
        query,
        answerSummary:
          typeof parsed.answerSummary === 'string' && parsed.answerSummary.trim()
            ? parsed.answerSummary.trim()
            : `"${query}" 조건에 맞춰 실시간 웹에서 선별한 유용한 사이트입니다.`,
        sites,
        sources,
      };

      discoveryCache.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        data: payload,
      });

      res.json(payload);
    } catch (error) {
      const info = getApiErrorInfo(error);
      console.warn(`Discover API error (${info.status} ${info.code}):`, info.message);

      if (info.status === 429 || info.code === 'RESOURCE_EXHAUSTED') {
        res.status(429).json({
          error:
            '현재 Gemini API 할당량 또는 분당 요청 한도(429)를 초과했습니다. 잠시 후 다시 시도하시거나, Settings > Secrets 패널에서 결제가 활성화된 API 키를 선택해 주세요.',
        });
        return;
      }

      if (
        info.status === 403 ||
        info.code === 'PERMISSION_DENIED' ||
        info.code === 'API_KEY_INVALID'
      ) {
        res.status(info.status === 400 ? 400 : 403).json({
          error:
            'Gemini API 키가 유효하지 않거나 권한이 없습니다. Settings > Secrets 패널에서 API 키 설정을 확인해 주세요.',
        });
        return;
      }

      res.status(500).json({
        error: '실시간 웹 탐색 요청을 처리하는 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
