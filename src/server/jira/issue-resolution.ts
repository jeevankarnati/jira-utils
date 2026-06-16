import type { DefaultJiraClientType } from "@narthia/jira-client";
import type { ResetResult } from "./types";

export const resetIssueResolutions = async (
  jiraClient: DefaultJiraClientType
): Promise<ResetResult> => {
  const maxResults = 100;

  const firstPage = await jiraClient.issueResolutions.searchResolutions({
    maxResults: maxResults.toString(),
    startAt: "0",
  });

  if (!firstPage.success) {
    return { deleted: 0, failed: 0, error: JSON.stringify(firstPage.error) };
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allResolutions = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pages = await Promise.all(
      pageIndexes.map((pageIndex) =>
        jiraClient.issueResolutions.searchResolutions({
          maxResults: maxResults.toString(),
          startAt: (pageIndex * maxResults).toString(),
        })
      )
    );
    for (const page of pages) {
      if (!page.success) {
        return { deleted: 0, failed: 0, error: JSON.stringify(page.error) };
      }
      allResolutions = allResolutions.concat(page.data?.values ?? []);
    }
  }

  // Deleting a resolution requires a replacement to reassign existing issues to.
  const doneResolution = allResolutions.find((res) => res.name === "Done");
  const replaceWithId = doneResolution?.id || "";

  let deleted = 0;
  let failed = 0;

  for (const resolution of allResolutions) {
    const deleteResolution = await jiraClient.issueResolutions.deleteResolution({
      id: resolution.id!,
      replaceWith: replaceWithId,
    });
    if (deleteResolution.success) {
      deleted++;
    } else {
      failed++;
    }
  }

  return { deleted, failed };
};
