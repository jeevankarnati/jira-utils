import type { DefaultJiraClientType } from "@narthia/jira-client";
import type { ResetResult } from "./types";

export const resetFieldConfigurations = async (
  jiraClient: DefaultJiraClientType
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

  let deleted = 0;
  let failed = 0;

  for (const fieldConfiguration of allFieldConfigurations) {
    const deleteFieldConfiguration =
      await jiraClient.issueFieldConfigurations.deleteFieldConfiguration({
        id: parseInt((fieldConfiguration as unknown as { id: string }).id, 10),
      });
    if (deleteFieldConfiguration.success) {
      deleted++;
    } else {
      failed++;
    }
  }

  return { deleted, failed };
};
