import { NextRequest, NextResponse } from 'next/server';
import { fetchWorkflowRuns } from '@/lib/github';
import { buildWorkflowSpec, buildErrorSpec, calcMaxRuns } from '@/lib/spec';
import { getTheme } from '@/lib/theme';
import { renderSpec } from '@/lib/render';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; workflow: string }> },
) {
  const { owner, repo, workflow } = await params;

  const searchParams = request.nextUrl.searchParams;
  const branch = searchParams.get('branch') ?? undefined;
  const limitParam = searchParams.get('limit');
  const themeParam = searchParams.get('theme') ?? 'light';
  const token = searchParams.get('token') ?? undefined;
  const widthParam = searchParams.get('width');
  const heightParam = searchParams.get('height');

  const width = widthParam ? Math.min(Math.max(parseInt(widthParam, 10) || 800, 400), 1200) : 800;
  const height = heightParam ? Math.min(parseInt(heightParam, 10) || 800, 800) : undefined;
  const userLimit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 20) : 10;
  const limit = calcMaxRuns(height, userLimit);
  const theme = getTheme(themeParam);

  const result = await fetchWorkflowRuns(owner, repo, workflow, { branch, limit, token });

  let spec;
  if (result.ok) {
    spec = buildWorkflowSpec(result.runs, { owner, repo, workflow, theme, width, height });
  } else {
    spec = buildErrorSpec(result.error, { owner, repo, workflow, theme, width, height });
  }

  try {
    const svg = await renderSpec(spec, theme, { width, height });

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch {
    const errorSpec = buildErrorSpec(
      { type: 'fetch_failed', message: 'Failed to render SVG' },
      { owner, repo, workflow, theme, width, height },
    );

    try {
      const errorSvg = await renderSpec(errorSpec, theme, { width });
      return new NextResponse(errorSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    } catch {
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="200"><rect width="${width}" height="200" fill="${theme.background}" rx="8"/><text x="${width / 2}" y="100" text-anchor="middle" fill="${theme.failure}" font-size="16">Failed to render SVG</text></svg>`;
      return new NextResponse(fallbackSvg, {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml' },
      });
    }
  }
}
