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
  type: 'repository_not_found' | 'workflow_not_found' | 'rate_limited' | 'fetch_failed';
  message: string;
};

export type FetchResult =
  | { ok: true; runs: WorkflowRun[] }
  | { ok: false; error: FetchError };

function mapWorkflowRun(run: any): WorkflowRun {
  return {
    id: run.id,
    name: run.name,
    status: run.status,
    conclusion: run.conclusion,
    branch: run.head_branch,
    headBranch: run.head_branch,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    runStartedAt: run.run_started_at ?? null,
    displayTitle: run.display_title,
    workflowId: run.workflow_id,
  };
}

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function handleError(status: number): FetchResult {
  if (status === 404) {
    return { ok: false, error: { type: 'repository_not_found', message: 'Repository not found' } };
  }
  if (status === 403 || status === 429) {
    return { ok: false, error: { type: 'rate_limited', message: 'API rate limit exceeded' } };
  }
  return { ok: false, error: { type: 'fetch_failed', message: 'Failed to fetch data' } };
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
      if (options?.branch) {
        params.set('branch', options.branch);
      }
      const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?${params.toString()}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        return handleError(response.status);
      }

      const data: any = await response.json();
      const runs: WorkflowRun[] = data.workflow_runs.map(mapWorkflowRun);
      return { ok: true, runs };
    }

    const workflowsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows`;
    const workflowsResponse = await fetch(workflowsUrl, { headers });

    if (!workflowsResponse.ok) {
      return handleError(workflowsResponse.status);
    }

    const workflowsData: any = await workflowsResponse.json();
    const targetPath = `.github/workflows/${workflow}`;
    const matched = workflowsData.workflows.find((w: any) => w.path === targetPath);

    if (!matched) {
      return { ok: false, error: { type: 'workflow_not_found', message: 'Workflow not found' } };
    }

    const params = new URLSearchParams({ per_page: String(limit) });
    if (options?.branch) {
      params.set('branch', options.branch);
    }
    const runsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${matched.id}/runs?${params.toString()}`;
    const runsResponse = await fetch(runsUrl, { headers });

    if (!runsResponse.ok) {
      return handleError(runsResponse.status);
    }

    const runsData: any = await runsResponse.json();
    const runs: WorkflowRun[] = runsData.workflow_runs.map(mapWorkflowRun);
    return { ok: true, runs };
  } catch {
    return { ok: false, error: { type: 'fetch_failed', message: 'Failed to fetch data' } };
  }
}
