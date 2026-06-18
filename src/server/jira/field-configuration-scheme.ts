import type { DefaultJiraClientType } from "@narthia/jira-client";
import type { ProgressReporter, ResetResult } from "./types";

export const resetFieldConfigurationSchemes = async (
  jiraClient: DefaultJiraClientType,
  progress: ProgressReporter
): Promise<ResetResult> => {
  const maxResults = 50;

  const firstPage = await jiraClient.issueFieldConfigurations.getAllFieldConfigurationSchemes({
    maxResults,
    startAt: 0,
  });

  if (!firstPage.success) {
    return { deleted: 0, failed: 0, error: JSON.stringify(firstPage.error) };
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allFieldConfigurationSchemes = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pages = await Promise.all(
      pageIndexes.map((pageIndex) =>
        jiraClient.issueFieldConfigurations.getAllFieldConfigurationSchemes({
          maxResults,
          startAt: pageIndex * maxResults,
        })
      )
    );
    for (const page of pages) {
      if (!page.success) {
        return { deleted: 0, failed: 0, error: JSON.stringify(page.error) };
      }
      allFieldConfigurationSchemes = allFieldConfigurationSchemes.concat(page.data?.values ?? []);
    }
  }

  progress.discovered(allFieldConfigurationSchemes.length);

  let deleted = 0;
  let failed = 0;

  for (const fieldConfigurationScheme of allFieldConfigurationSchemes) {
    const id = String(fieldConfigurationScheme.id!);
    const name = fieldConfigurationScheme.name ?? id;
    const deleteFieldConfigurationScheme =
      await jiraClient.issueFieldConfigurations.deleteFieldConfigurationScheme({
        id: parseInt(fieldConfigurationScheme.id!, 10),
      });
    if (deleteFieldConfigurationScheme.success) {
      deleted++;
      progress.item({ id, name, status: "deleted" });
    } else {
      failed++;
      progress.item({
        id,
        name,
        status: "failed",
        error: JSON.stringify(deleteFieldConfigurationScheme.error),
      });
    }
  }

  return { deleted, failed };
};
