import type { DefaultJiraClientType } from "@narthia/jira-client";
import type { ProgressReporter, ResetResult } from "./types";

export const resetFieldConfigurations = async (
  jiraClient: DefaultJiraClientType,
  progress: ProgressReporter
): Promise<ResetResult> => {
  const maxResults = 50;

  const firstPage = await jiraClient.issueFieldConfigurations.getAllFieldConfigurations({
    maxResults,
    startAt: 0,
  });

  if (!firstPage.success) {
    return { deleted: 0, failed: 0, error: JSON.stringify(firstPage.error) };
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allFieldConfigurations = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pages = await Promise.all(
      pageIndexes.map((pageIndex) =>
        jiraClient.issueFieldConfigurations.getAllFieldConfigurations({
          maxResults,
          startAt: pageIndex * maxResults,
        })
      )
    );
    for (const page of pages) {
      if (!page.success) {
        return { deleted: 0, failed: 0, error: JSON.stringify(page.error) };
      }
      allFieldConfigurations = allFieldConfigurations.concat(page.data?.values ?? []);
    }
  }

  progress.discovered(allFieldConfigurations.length);

  let deleted = 0;
  let failed = 0;

  for (const fieldConfiguration of allFieldConfigurations) {
    const { id, name } = fieldConfiguration as unknown as { id: string; name?: string };
    const deleteFieldConfiguration =
      await jiraClient.issueFieldConfigurations.deleteFieldConfiguration({
        id: parseInt(id, 10),
      });
    if (deleteFieldConfiguration.success) {
      deleted++;
      progress.item({ id, name: name ?? id, status: "deleted" });
    } else {
      failed++;
      progress.item({
        id,
        name: name ?? id,
        status: "failed",
        error: JSON.stringify(deleteFieldConfiguration.error),
      });
    }
  }

  return { deleted, failed };
};
