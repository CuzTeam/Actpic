import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchWorkflowRuns } from '../../../lib/github.js';
import { buildWorkflowSpec, buildErrorSpec, calcMaxRuns } from '../../../lib/spec.js';
import { getTheme } from '../../../lib/theme.js';
import { renderSpec } from '../../../lib/render.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { owner, repo, workflow } = req.query as { owner?: string; repo?: string; workflow?: string };

  if (!owner || !repo || !workflow) {
    res.status(400).send('Missing required path parameters: owner, repo, workflow');
    return;
  }

  const branch = req.query.branch as string | undefined;
  const limitParam = req.query.limit as string | undefined;
  const themeParam = req.query.theme as string | undefined;
  const token = req.query.token as string | undefined;
  const widthParam = req.query.width as string | undefined;
  const heightParam = req.query.height as string | undefined;

  const width = widthParam ? Math.min(Math.max(parseInt(widthParam, 10) || 800, 400), 1200) : 800;
  const height = heightParam ? Math.min(parseInt(heightParam, 10) || 800, 800) : undefined;
  const userLimit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 20) : 10;
  const limit = calcMaxRuns(height, userLimit);
  const theme = getTheme(themeParam ?? 'light');

  const result = await fetchWorkflowRuns(owner, repo, workflow, { branch, limit, token });

  let spec: any;
  if (result.ok) {
    spec = buildWorkflowSpec(result.runs, { owner, repo, workflow, theme, width, height });
  } else {
    spec = buildErrorSpec(result.error, { owner, repo, workflow, theme, width, height });
  }

  try {
    const svg = await renderSpec(spec, theme, { width, height });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(200).send(svg);
  } catch (err) {
    const errorSpec = buildErrorSpec(
      { type: 'fetch_failed', message: 'Failed to render SVG' },
      { owner, repo, workflow, theme, width, height },
    );

    try {
      const errorSvg = await renderSpec(errorSpec, theme, { width });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      res.status(200).send(errorSvg);
    } catch {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(200).send(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="200"><rect width="${width}" height="200" fill="${theme.background}" rx="8"/><text x="${width / 2}" y="100" text-anchor="middle" fill="${theme.failure}" font-size="16">Failed to render SVG</text></svg>`);
    }
  }
}
