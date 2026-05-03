import type { WorkflowRun, FetchError } from './github';
import type { Theme } from './theme';

export interface SpecOptions {
  owner: string;
  repo: string;
  workflow: string;
  theme: Theme;
  width?: number;
  height?: number;
}

const HEADER_HEIGHT = 60;
const FOOTER_HEIGHT = 40;
const ROW_HEIGHT = 36;
const CARD_PADDING = 0;

function formatDuration(createdAt: string, updatedAt: string): string {
  const start = new Date(createdAt).getTime();
  const end = new Date(updatedAt).getTime();
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return 'just now';
}

function getStatusColor(conclusion: string | null, theme: Theme): string {
  if (conclusion === 'success') return theme.success;
  if (conclusion === 'failure') return theme.failure;
  return theme.pending;
}

export function calcMaxRuns(height: number | undefined, limit: number): number {
  if (!height) return limit;
  const available = height - HEADER_HEIGHT - FOOTER_HEIGHT - CARD_PADDING;
  const maxRuns = Math.floor(available / ROW_HEIGHT);
  return Math.max(1, Math.min(maxRuns, limit));
}

export function calcAutoHeight(runCount: number): number {
  return HEADER_HEIGHT + FOOTER_HEIGHT + CARD_PADDING + runCount * ROW_HEIGHT;
}

export function buildWorkflowSpec(runs: WorkflowRun[], options: SpecOptions) {
  const { owner, repo, workflow, theme, width = 800, height } = options;
  const elements: Record<string, Record<string, unknown>> = {};

  const subtitle = workflow === 'all' ? 'All Workflows' : workflow;
  const showWorkflowName = workflow === 'all';

  const autoHeight = calcAutoHeight(runs.length);
  const frameHeight = height ?? autoHeight;

  elements['frame'] = {
    type: 'Frame',
    props: {
      width,
      height: frameHeight,
      backgroundColor: theme.background,
      padding: 0,
      display: null,
      flexDirection: null,
      alignItems: null,
      justifyContent: null,
    },
    children: ['card'],
  };

  elements['card'] = {
    type: 'Box',
    props: {
      padding: 0,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      flex: null,
      width: null,
      height: null,
      alignItems: null,
      justifyContent: null,
      flexDirection: 'column',
      position: null,
      top: null,
      left: null,
      right: null,
      bottom: null,
      overflow: 'hidden',
      paddingTop: null,
      paddingBottom: null,
      paddingLeft: null,
      paddingRight: null,
      margin: null,
    },
    children: ['header', 'runs-col', 'footer'],
  };

  elements['header'] = {
    type: 'Box',
    props: {
      padding: null,
      backgroundColor: theme.cardHeaderBg,
      borderWidth: null,
      borderColor: null,
      borderRadius: null,
      flex: null,
      width: null,
      height: null,
      alignItems: null,
      justifyContent: null,
      flexDirection: 'column',
      position: null,
      top: null,
      left: null,
      right: null,
      bottom: null,
      overflow: null,
      paddingTop: 12,
      paddingBottom: 12,
      paddingLeft: 20,
      paddingRight: 20,
      margin: null,
    },
    children: ['title', 'subtitle-text'],
  };

  elements['title'] = {
    type: 'Heading',
    props: {
      text: `${owner}/${repo}`,
      level: 'h3',
      color: theme.foreground,
      align: 'left',
      letterSpacing: null,
      lineHeight: null,
    },
    children: [],
  };

  elements['subtitle-text'] = {
    type: 'Text',
    props: {
      text: subtitle,
      fontSize: 12,
      color: theme.muted,
      align: 'left',
      fontWeight: 'normal',
      fontStyle: null,
      lineHeight: null,
      letterSpacing: null,
      textDecoration: null,
    },
    children: [],
  };

  const runChildIds: string[] = [];
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const statusColor = getStatusColor(run.conclusion, theme);
    const duration = formatDuration(run.createdAt, run.updatedAt);
    const relativeTime = formatRelativeTime(run.createdAt);
    const rowBg = i % 2 === 0 ? theme.rowEvenBg : theme.rowOddBg;

    const rowId = `run-row-${i}`;
    const dotId = `status-dot-${i}`;
    const leftGroupId = `left-group-${i}`;
    const rightGroupId = `right-group-${i}`;
    const nameTextId = `name-${i}`;
    const branchTextId = `branch-${i}`;
    const durationTextId = `duration-${i}`;
    const timeTextId = `time-${i}`;

    elements[rowId] = {
      type: 'Box',
      props: {
        padding: null,
        backgroundColor: rowBg,
        borderWidth: null,
        borderColor: null,
        borderRadius: null,
        flex: null,
        width: null,
        height: null,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        position: null,
        top: null,
        left: null,
        right: null,
        bottom: null,
        overflow: null,
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 20,
        paddingRight: 20,
        margin: null,
      },
      children: [leftGroupId, rightGroupId],
    };

    const leftChildren = [dotId];
    if (showWorkflowName) {
      leftChildren.push(nameTextId);
    }
    leftChildren.push(branchTextId);

    elements[leftGroupId] = {
      type: 'Row',
      props: {
        gap: 8,
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 0,
        flex: null,
        wrap: null,
      },
      children: leftChildren,
    };

    elements[dotId] = {
      type: 'Box',
      props: {
        padding: 0,
        backgroundColor: statusColor,
        borderWidth: null,
        borderColor: null,
        borderRadius: 4,
        flex: null,
        width: 8,
        height: 8,
        alignItems: null,
        justifyContent: null,
        flexDirection: null,
        position: null,
        top: null,
        left: null,
        right: null,
        bottom: null,
        overflow: null,
        paddingTop: null,
        paddingBottom: null,
        paddingLeft: null,
        paddingRight: null,
        margin: null,
      },
      children: [],
    };

    if (showWorkflowName) {
      elements[nameTextId] = {
        type: 'Text',
        props: {
          text: run.name,
          fontSize: 13,
          color: theme.foreground,
          align: 'left',
          fontWeight: 'bold',
          fontStyle: null,
          lineHeight: null,
          letterSpacing: null,
          textDecoration: null,
        },
        children: [],
      };
    }

    elements[branchTextId] = {
      type: 'Text',
      props: {
        text: run.branch,
        fontSize: 13,
        color: theme.muted,
        align: 'left',
        fontWeight: null,
        fontStyle: null,
        lineHeight: null,
        letterSpacing: null,
        textDecoration: null,
      },
      children: [],
    };

    elements[rightGroupId] = {
      type: 'Row',
      props: {
        gap: 12,
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: 0,
        flex: null,
        wrap: null,
      },
      children: [durationTextId, timeTextId],
    };

    elements[durationTextId] = {
      type: 'Text',
      props: {
        text: duration,
        fontSize: 13,
        color: theme.muted,
        align: 'right',
        fontWeight: null,
        fontStyle: null,
        lineHeight: null,
        letterSpacing: null,
        textDecoration: null,
      },
      children: [],
    };

    elements[timeTextId] = {
      type: 'Text',
      props: {
        text: relativeTime,
        fontSize: 13,
        color: theme.muted,
        align: 'right',
        fontWeight: null,
        fontStyle: null,
        lineHeight: null,
        letterSpacing: null,
        textDecoration: null,
      },
      children: [],
    };

    runChildIds.push(rowId);
  }

  if (runChildIds.length === 0) {
    elements['runs-col'] = {
      type: 'Box',
      props: {
        padding: null,
        backgroundColor: theme.background,
        borderWidth: null,
        borderColor: null,
        borderRadius: null,
        flex: null,
        width: null,
        height: null,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: null,
        position: null,
        top: null,
        left: null,
        right: null,
        bottom: null,
        overflow: null,
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: 20,
        paddingRight: 20,
        margin: null,
      },
      children: ['no-runs'],
    };
    elements['no-runs'] = {
      type: 'Text',
      props: {
        text: 'No runs found',
        fontSize: 14,
        color: theme.muted,
        align: 'center',
        fontWeight: 'normal',
        fontStyle: null,
        lineHeight: null,
        letterSpacing: null,
        textDecoration: null,
      },
      children: [],
    };
  } else {
    elements['runs-col'] = {
      type: 'Column',
      props: {
        gap: 0,
        alignItems: 'stretch',
        justifyContent: null,
        padding: 0,
        flex: null,
      },
      children: runChildIds,
    };
  }

  const successCount = runs.filter((r) => r.conclusion === 'success').length;
  const successRate = runs.length > 0 ? Math.round((successCount / runs.length) * 100) : 0;
  const rateColor =
    successRate >= 80 ? theme.success : successRate >= 50 ? theme.pending : theme.failure;

  elements['footer'] = {
    type: 'Box',
    props: {
      padding: null,
      backgroundColor: theme.cardHeaderBg,
      borderWidth: null,
      borderColor: null,
      borderRadius: null,
      flex: null,
      width: null,
      height: null,
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexDirection: 'row',
      position: null,
      top: null,
      left: null,
      right: null,
      bottom: null,
      overflow: null,
      paddingTop: 10,
      paddingBottom: 16,
      paddingLeft: 20,
      paddingRight: 20,
      margin: null,
    },
    children: ['success-rate-label', 'success-rate-value'],
  };

  elements['success-rate-label'] = {
    type: 'Text',
    props: {
      text: 'Success rate: ',
      fontSize: 12,
      color: theme.muted,
      align: 'left',
      fontWeight: 'normal',
      fontStyle: null,
      lineHeight: null,
      letterSpacing: null,
      textDecoration: null,
    },
    children: [],
  };

  elements['success-rate-value'] = {
    type: 'Text',
    props: {
      text: `${successRate}%`,
      fontSize: 12,
      color: rateColor,
      align: 'left',
      fontWeight: 'bold',
      fontStyle: null,
      lineHeight: null,
      letterSpacing: null,
      textDecoration: null,
    },
    children: [],
  };

  return {
    root: 'frame',
    elements,
  };
}

export function buildErrorSpec(error: FetchError, options: SpecOptions) {
  const { owner, repo, theme, width = 800 } = options;

  const elements: Record<string, Record<string, unknown>> = {};

  elements['frame'] = {
    type: 'Frame',
    props: {
      width,
      height: 120,
      backgroundColor: theme.background,
      padding: 0,
      display: null,
      flexDirection: null,
      alignItems: null,
      justifyContent: null,
    },
    children: ['card'],
  };

  elements['card'] = {
    type: 'Box',
    props: {
      padding: 0,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      flex: null,
      width: null,
      height: null,
      alignItems: null,
      justifyContent: null,
      flexDirection: 'column',
      position: null,
      top: null,
      left: null,
      right: null,
      bottom: null,
      overflow: null,
      paddingTop: null,
      paddingBottom: null,
      paddingLeft: null,
      paddingRight: null,
      margin: null,
    },
    children: ['error-header', 'error-body'],
  };

  elements['error-header'] = {
    type: 'Box',
    props: {
      padding: null,
      backgroundColor: theme.cardHeaderBg,
      borderWidth: null,
      borderColor: null,
      borderRadius: null,
      flex: null,
      width: null,
      height: null,
      alignItems: null,
      justifyContent: null,
      flexDirection: 'column',
      position: null,
      top: null,
      left: null,
      right: null,
      bottom: null,
      overflow: null,
      paddingTop: 12,
      paddingBottom: 12,
      paddingLeft: 20,
      paddingRight: 20,
      margin: null,
    },
    children: ['error-title'],
  };

  elements['error-title'] = {
    type: 'Heading',
    props: {
      text: `${owner}/${repo}`,
      level: 'h3',
      color: theme.foreground,
      align: 'left',
      letterSpacing: null,
      lineHeight: null,
    },
    children: [],
  };

  elements['error-body'] = {
    type: 'Box',
    props: {
      padding: null,
      backgroundColor: theme.background,
      borderWidth: null,
      borderColor: null,
      borderRadius: null,
      flex: null,
      width: null,
      height: null,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: null,
      position: null,
      top: null,
      left: null,
      right: null,
      bottom: null,
      overflow: null,
      paddingTop: 12,
      paddingBottom: 12,
      paddingLeft: 20,
      paddingRight: 20,
      margin: null,
    },
    children: ['error-message'],
  };

  elements['error-message'] = {
    type: 'Text',
    props: {
      text: error.message,
      fontSize: 14,
      color: theme.failure,
      align: 'center',
      fontWeight: 'normal',
      fontStyle: null,
      lineHeight: null,
      letterSpacing: null,
      textDecoration: null,
    },
    children: [],
  };

  return {
    root: 'frame',
    elements,
  };
}
