import type { DefaultJiraClientType } from "@narthia/jira-client";
import type { ProgressReporter, ResetResult } from "./types";

export const resetScreenSchemes = async (
  jiraClient: DefaultJiraClientType,
  progress: ProgressReporter
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

  progress.discovered(allScreenSchemes.length);

  let deleted = 0;
  let failed = 0;

  for (const screenScheme of allScreenSchemes) {
    const id = String(screenScheme.id);
    const name = screenScheme.name ?? id;
    const deleteScreenScheme = await jiraClient.screenSchemes.deleteScreenScheme({
      screenSchemeId: id,
    });
    if (deleteScreenScheme.success) {
      deleted++;
      progress.item({ id, name, status: "deleted" });
    } else {
      failed++;
      progress.item({
        id,
        name,
        status: "failed",
        error: JSON.stringify(deleteScreenScheme.error),
      });
    }
  }

  return { deleted, failed };
};
