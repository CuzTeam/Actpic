import { renderToSvg } from '@json-render/image/render';
import type { Theme } from './theme';

let cachedFont400: ArrayBuffer | null = null;
let cachedFont700: ArrayBuffer | null = null;

const FONT_FILES: Record<number, string> = {
  400: 'inter-latin-400-normal.woff',
  700: 'inter-latin-700-normal.woff',
};

const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/',
  'https://unpkg.com/@fontsource/inter@5/files/',
];

async function loadFontFromCdn(weight: number): Promise<ArrayBuffer | null> {
  const filename = FONT_FILES[weight];
  if (!filename) return null;

  for (const baseUrl of CDN_URLS) {
    const url = `${baseUrl}${filename}`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (response.ok) {
        const data = await response.arrayBuffer();
        console.log(`[ActPic] Font loaded from CDN: ${url} (${data.byteLength} bytes)`);
        return data;
      }
    } catch (e) {
      console.warn(`[ActPic] CDN font load failed for ${url}:`, e instanceof Error ? e.message : e);
    }
  }

  return null;
}

async function loadFont(weight: number): Promise<ArrayBuffer> {
  if (weight === 400 && cachedFont400) return cachedFont400;
  if (weight === 700 && cachedFont700) return cachedFont700;

  const data = await loadFontFromCdn(weight);

  if (!data || data.byteLength === 0) {
    throw new Error(
      `[ActPic] Failed to load font weight ${weight} from CDN. ` +
      `Tried: ${CDN_URLS.map((u) => `${u}${FONT_FILES[weight]}`).join(', ')}`,
    );
  }

  if (weight === 400) cachedFont400 = data;
  if (weight === 700) cachedFont700 = data;
  return data;
}

export interface RenderOptions {
  width?: number;
  height?: number;
}

export async function renderSpec(spec: unknown, _theme: Theme, renderOptions?: RenderOptions): Promise<string> {
  const [font400, font700] = await Promise.all([loadFont(400), loadFont(700)]);

  const svg = await renderToSvg(spec as Parameters<typeof renderToSvg>[0], {
    includeStandard: true,
    width: renderOptions?.width,
    height: renderOptions?.height,
    fonts: [
      { name: 'Inter', data: font400, weight: 400, style: 'normal' as const },
      { name: 'Inter', data: font700, weight: 700, style: 'normal' as const },
    ],
  });

  return svg;
}
