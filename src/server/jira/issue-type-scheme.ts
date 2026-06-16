import type { DefaultJiraClientType } from "@narthia/jira-client";
import type { ProgressReporter, ResetResult } from "./types";

export const resetIssueTypeSchemes = async (
  jiraClient: DefaultJiraClientType,
  progress: ProgressReporter
): Promise<ResetResult> => {
  const maxResults = 100;

  const firstPage = await jiraClient.issueTypeSchemes.getAllIssueTypeSchemes({
    maxResults,
    startAt: 0,
  });

  if (!firstPage.success) {
    return { deleted: 0, failed: 0, error: JSON.stringify(firstPage.error) };
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allIssueTypeSchemes = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pages = await Promise.all(
      pageIndexes.map((pageIndex) =>
        jiraClient.issueTypeSchemes.getAllIssueTypeSchemes({
          maxResults,
          startAt: pageIndex * maxResults,
        })
      )
    );
    for (const page of pages) {
      if (!page.success) {
        return { deleted: 0, failed: 0, error: JSON.stringify(page.error) };
      }
      allIssueTypeSchemes = allIssueTypeSchemes.concat(page.data?.values ?? []);
    }
  }

  progress.discovered(allIssueTypeSchemes.length);

  let deleted = 0;
  let failed = 0;

  for (const issueTypeScheme of allIssueTypeSchemes) {
    const id = issueTypeScheme.id!;
    const name = issueTypeScheme.name ?? id;
    const deleteIssueTypeScheme = await jiraClient.issueTypeSchemes.deleteIssueTypeScheme({
      issueTypeSchemeId: Number(id),
    });
    if (deleteIssueTypeScheme.success) {
      deleted++;
      progress.item({ id, name, status: "deleted" });
    } else {
      failed++;
      progress.item({
        id,
        name,
        status: "failed",
        error: JSON.stringify(deleteIssueTypeScheme.error),
      });
    }
  }

  return { deleted, failed };
};
