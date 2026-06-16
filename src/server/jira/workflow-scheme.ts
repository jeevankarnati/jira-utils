import type { DefaultJiraClientType } from "@narthia/jira-client";
import type { ProgressReporter, ResetResult } from "./types";

export const resetWorkflowSchemes = async (
  jiraClient: DefaultJiraClientType,
  progress: ProgressReporter
): Promise<ResetResult> => {
  const maxResults = 100;

  const firstPage = await jiraClient.workflowSchemes.getAllWorkflowSchemes({
    maxResults,
    startAt: 0,
  });

  if (!firstPage.success) {
    return { deleted: 0, failed: 0, error: JSON.stringify(firstPage.error) };
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allWorkflowSchemes = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pages = await Promise.all(
      pageIndexes.map((pageIndex) =>
        jiraClient.workflowSchemes.getAllWorkflowSchemes({
          maxResults,
          startAt: pageIndex * maxResults,
        })
      )
    );
    for (const page of pages) {
      if (!page.success) {
        return { deleted: 0, failed: 0, error: JSON.stringify(page.error) };
      }
      allWorkflowSchemes = allWorkflowSchemes.concat(page.data?.values ?? []);
    }
  }

  progress.discovered(allWorkflowSchemes.length);

  let deleted = 0;
  let failed = 0;

  for (const workflowScheme of allWorkflowSchemes) {
    const id = String(workflowScheme.id!);
    const name = workflowScheme.name ?? id;
    const deleteWorkflowScheme = await jiraClient.workflowSchemes.deleteWorkflowScheme({
      id: workflowScheme.id!,
    });
    if (deleteWorkflowScheme.success) {
      deleted++;
      progress.item({ id, name, status: "deleted" });
    } else {
      failed++;
      progress.item({
        id,
        name,
        status: "failed",
        error: JSON.stringify(deleteWorkflowScheme.error),
      });
    }
  }

  return { deleted, failed };
};
