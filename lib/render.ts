import { renderToSvg } from '@json-render/image/render';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Theme } from './theme.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadFontFile(weight: number): ArrayBuffer {
  const filenames: Record<number, string> = {
    400: 'inter-latin-400-normal.woff',
    700: 'inter-latin-700-normal.woff',
  };

  const filename = filenames[weight];
  if (!filename) return new ArrayBuffer(0);

  const paths = [
    resolve(__dirname, '../node_modules/@fontsource/inter/files', filename),
    resolve(__dirname, '../../@fontsource/inter/files', filename),
  ];

  for (const p of paths) {
    try {
      const buffer = readFileSync(p);
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    } catch {}
  }

  return new ArrayBuffer(0);
}

export interface RenderOptions {
  width?: number;
  height?: number;
}

export async function renderSpec(spec: any, _theme: Theme, renderOptions?: RenderOptions): Promise<string> {
  const font400 = loadFontFile(400);
  const font700 = loadFontFile(700);

  const svg = await renderToSvg(spec, {
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
