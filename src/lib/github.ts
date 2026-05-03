export interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  branch: string;
  headBranch: string;
  createdAt: string;
  updatedAt: string;
  runStartedAt: string | null;
  displayTitle: string;
  workflowId: number;
}

export interface FetchOptions {
  branch?: string;
  limit?: number;
  token?: string;
}

export type FetchError = {
  type: 'repository_not_found' | 'workflow_not_found' | 'rate_limited' | 'fetch_failed' | 'render_failed';
  message: string;
};

export type FetchResult =
  | { ok: true; runs: WorkflowRun[] }
  | { ok: false; error: FetchError };

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function mapWorkflowRun(raw: Record<string, unknown>): WorkflowRun {
  return {
    id: raw.id as number,
    name: raw.name as string,
    status: raw.status as string,
    conclusion: (raw.conclusion as string) ?? null,
    branch: (raw.head_branch as string) ?? '',
    headBranch: (raw.head_branch as string) ?? '',
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
    runStartedAt: (raw.run_started_at as string) ?? null,
    displayTitle: raw.display_title as string,
    workflowId: raw.workflow_id as number,
  };
}

export async function fetchWorkflowRuns(
  owner: string,
  repo: string,
  workflow: string,
  options?: FetchOptions,
): Promise<FetchResult> {
  const limit = Math.min(Math.max(options?.limit ?? 10, 1), 20);
  const headers = buildHeaders(options?.token);

  try {
    if (workflow === 'all') {
      const params = new URLSearchParams({ per_page: String(limit) });
      if (options?.branch) params.set('branch', options.branch);
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs?${params}`,
        { headers },
      );
      if (response.status === 404) {
        return { ok: false, error: { type: 'repository_not_found', message: 'Repository not found' } };
      }
      if (response.status === 403 || response.status === 429) {
        return { ok: false, error: { type: 'rate_limited', message: 'API rate limit exceeded' } };
      }
      if (!response.ok) {
        return { ok: false, error: { type: 'fetch_failed', message: 'Failed to fetch data' } };
      }
      const data: Record<string, unknown> = await response.json();
      const runs = (data.workflow_runs as Record<string, unknown>[]).map(mapWorkflowRun);
      return { ok: true, runs };
    }

    const workflowsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows`,
      { headers },
    );
    if (workflowsResponse.status === 404) {
      return { ok: false, error: { type: 'repository_not_found', message: 'Repository not found' } };
    }
    if (workflowsResponse.status === 403 || workflowsResponse.status === 429) {
      return { ok: false, error: { type: 'rate_limited', message: 'API rate limit exceeded' } };
    }
    if (!workflowsResponse.ok) {
      return { ok: false, error: { type: 'fetch_failed', message: 'Failed to fetch data' } };
    }
    const workflowsData: Record<string, unknown> = await workflowsResponse.json();
    const workflows = workflowsData.workflows as Record<string, unknown>[];
    const matched = workflows.find((w) => w.path === `.github/workflows/${workflow}`);
    if (!matched) {
      return { ok: false, error: { type: 'workflow_not_found', message: 'Workflow not found' } };
    }

    const params = new URLSearchParams({ per_page: String(limit) });
    if (options?.branch) params.set('branch', options.branch);
    const runsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${matched.id}/runs?${params}`,
      { headers },
    );
    if (!runsResponse.ok) {
      return { ok: false, error: { type: 'fetch_failed', message: 'Failed to fetch data' } };
    }
    const runsData: Record<string, unknown> = await runsResponse.json();
    const runs = (runsData.workflow_runs as Record<string, unknown>[]).map(mapWorkflowRun);
    return { ok: true, runs };
  } catch {
    return { ok: false, error: { type: 'fetch_failed', message: 'Failed to fetch data' } };
  }
}
