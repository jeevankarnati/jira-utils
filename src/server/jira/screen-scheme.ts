import type { DefaultJiraClientType } from "@narthia/jira-client";
import type { ResetResult } from "./types";

export const resetScreenSchemes = async (
  jiraClient: DefaultJiraClientType
): Promise<ResetResult> => {
  const maxResults = 100;

  const firstPage = await jiraClient.screenSchemes.getScreenSchemes({
    maxResults,
    startAt: 0,
  });

  if (!firstPage.success) {
    return { deleted: 0, failed: 0, error: JSON.stringify(firstPage.error) };
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allScreenSchemes = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pages = await Promise.all(
      pageIndexes.map((pageIndex) =>
        jiraClient.screenSchemes.getScreenSchemes({
          maxResults,
          startAt: pageIndex * maxResults,
        })
      )
    );
    for (const page of pages) {
      if (!page.success) {
        return { deleted: 0, failed: 0, error: JSON.stringify(page.error) };
      }
      allScreenSchemes = allScreenSchemes.concat(page.data?.values ?? []);
    }
  }

  let deleted = 0;
  let failed = 0;

  for (const screenScheme of allScreenSchemes) {
    const deleteScreenScheme = await jiraClient.screenSchemes.deleteScreenScheme({
      screenSchemeId: String(screenScheme.id),
    });
    if (deleteScreenScheme.success) {
      deleted++;
    } else {
      failed++;
    }
  }

  return { deleted, failed };
};
