import type { DefaultJiraClientType } from "@narthia/jira-client";

export interface ResetResult {
  deleted: number;
  failed: number;
  error?: string;
}

export type ResetFn = (jiraClient: DefaultJiraClientType) => Promise<ResetResult>;
