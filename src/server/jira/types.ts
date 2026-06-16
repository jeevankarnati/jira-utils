import type { DefaultJiraClientType } from "@narthia/jira-client";

export interface ResetResult {
  deleted: number;
  failed: number;
  error?: string;
}

export interface ResetItemEvent {
  id: string;
  name: string;
  status: "deleted" | "failed";
  error?: string;
}

/**
 * Lets a reset function report fine-grained progress as it works: how many
 * items it found, and the outcome of each individual deletion. The route
 * handler turns these calls into a stream of events for the UI.
 */
export interface ProgressReporter {
  discovered: (total: number) => void;
  item: (event: ResetItemEvent) => void;
}

export type ResetFn = (
  jiraClient: DefaultJiraClientType,
  progress: ProgressReporter
) => Promise<ResetResult>;
