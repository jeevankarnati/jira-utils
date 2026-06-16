import type { DefaultJiraClientType } from "@narthia/jira-client";
import type { ResetResult } from "./types";

export const resetIssueTypes = async (jiraClient: DefaultJiraClientType): Promise<ResetResult> => {
  const firstPage = await jiraClient.issueTypes.getIssueAllTypes({});

  if (!firstPage.success) {
    return { deleted: 0, failed: 0, error: JSON.stringify(firstPage.error) };
  }

  const allIssueTypes = firstPage.data ?? [];

  let deleted = 0;
  let failed = 0;

  for (const issueType of allIssueTypes) {
    const deleteIssueType = await jiraClient.issueTypes.deleteIssueType({
      id: issueType.id!,
    });
    if (deleteIssueType.success) {
      deleted++;
    } else {
      failed++;
    }
  }

  return { deleted, failed };
};
