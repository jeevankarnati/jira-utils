import type { DefaultJiraClientType } from "@narthia/jira-client";
import type { ResetResult } from "./types";

export const resetIssueTypeScreenSchemes = async (
  jiraClient: DefaultJiraClientType
): Promise<ResetResult> => {
  const maxResults = 100;

  const firstPage = await jiraClient.issueTypeScreenSchemes.getIssueTypeScreenSchemes({
    maxResults,
    startAt: 0,
  });

  if (!firstPage.success) {
    return { deleted: 0, failed: 0, error: JSON.stringify(firstPage.error) };
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allIssueTypeScreenSchemes = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pages = await Promise.all(
      pageIndexes.map((pageIndex) =>
        jiraClient.issueTypeScreenSchemes.getIssueTypeScreenSchemes({
          maxResults,
          startAt: pageIndex * maxResults,
        })
      )
    );
    for (const page of pages) {
      if (!page.success) {
        return { deleted: 0, failed: 0, error: JSON.stringify(page.error) };
      }
      allIssueTypeScreenSchemes = allIssueTypeScreenSchemes.concat(page.data?.values ?? []);
    }
  }

  let deleted = 0;
  let failed = 0;

  for (const issueTypeScreenScheme of allIssueTypeScreenSchemes) {
    const deleteIssueTypeScreenScheme =
      await jiraClient.issueTypeScreenSchemes.deleteIssueTypeScreenScheme({
        issueTypeScreenSchemeId: issueTypeScreenScheme.id!,
      });
    if (deleteIssueTypeScreenScheme.success) {
      deleted++;
    } else {
      failed++;
    }
  }

  return { deleted, failed };
};
