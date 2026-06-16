import type { DefaultJiraClientType } from "@narthia/jira-client";
import type { ProgressReporter, ResetResult } from "./types";

export const resetScreens = async (
  jiraClient: DefaultJiraClientType,
  progress: ProgressReporter
): Promise<ResetResult> => {
  const maxResults = 100;

  const firstPage = await jiraClient.screens.getScreens({
    maxResults,
    startAt: 0,
  });

  if (!firstPage.success) {
    return { deleted: 0, failed: 0, error: JSON.stringify(firstPage.error) };
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allScreens = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pages = await Promise.all(
      pageIndexes.map((pageIndex) =>
        jiraClient.screens.getScreens({
          maxResults,
          startAt: pageIndex * maxResults,
        })
      )
    );
    for (const page of pages) {
      if (!page.success) {
        return { deleted: 0, failed: 0, error: JSON.stringify(page.error) };
      }
      allScreens = allScreens.concat(page.data?.values ?? []);
    }
  }

  progress.discovered(allScreens.length);

  let deleted = 0;
  let failed = 0;

  for (const screen of allScreens) {
    const id = screen.id!;
    const name = screen.name ?? String(id);
    const deleteScreen = await jiraClient.screens.deleteScreen({
      screenId: id,
    });
    if (deleteScreen.success) {
      deleted++;
      progress.item({ id: String(id), name, status: "deleted" });
    } else {
      failed++;
      progress.item({
        id: String(id),
        name,
        status: "failed",
        error: JSON.stringify(deleteScreen.error),
      });
    }
  }

  return { deleted, failed };
};
