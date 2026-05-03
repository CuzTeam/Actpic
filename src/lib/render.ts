import { renderToSvg } from '@json-render/image/render';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import type { Theme } from './theme';

let cachedFont400: ArrayBuffer | null = null;
let cachedFont700: ArrayBuffer | null = null;

function loadFontFile(weight: number): ArrayBuffer {
  if (weight === 400 && cachedFont400) return cachedFont400;
  if (weight === 700 && cachedFont700) return cachedFont700;

  const filenames: Record<number, string> = {
    400: 'inter-latin-400-normal.woff',
    700: 'inter-latin-700-normal.woff',
  };

  const filename = filenames[weight];
  if (!filename) return new ArrayBuffer(0);

  const searchPaths = [
    resolve(/*turbopackIgnore: true*/ process.cwd(), 'node_modules/@fontsource/inter/files', filename),
    resolve(/*turbopackIgnore: true*/ process.cwd(), 'node_modules/.pnpm/@fontsource+inter*/node_modules/@fontsource/inter/files', filename),
  ];

  for (const p of searchPaths) {
    try {
      const buffer = readFileSync(p);
      const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
      if (weight === 400) cachedFont400 = ab;
      if (weight === 700) cachedFont700 = ab;
      return ab;
    } catch {
      continue;
    }
  }

  return new ArrayBuffer(0);
}

export interface RenderOptions {
  width?: number;
  height?: number;
}

export async function renderSpec(spec: unknown, _theme: Theme, renderOptions?: RenderOptions): Promise<string> {
  const font400 = loadFontFile(400);
  const font700 = loadFontFile(700);

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
