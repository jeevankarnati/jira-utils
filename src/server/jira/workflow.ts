import type { DefaultJiraClientType } from "@narthia/jira-client";
import type { ProgressReporter, ResetResult } from "./types";

export const resetWorkflows = async (
  jiraClient: DefaultJiraClientType,
  progress: ProgressReporter
): Promise<ResetResult> => {
  const maxResults = 100;

  const firstPage = await jiraClient.workflows.getWorkflowsPaginated({
    maxResults,
    startAt: 0,
  });

  if (!firstPage.success) {
    return { deleted: 0, failed: 0, error: JSON.stringify(firstPage.error) };
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allWorkflows = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pages = await Promise.all(
      pageIndexes.map((pageIndex) =>
        jiraClient.workflows.getWorkflowsPaginated({
          maxResults,
          startAt: pageIndex * maxResults,
        })
      )
    );
    for (const page of pages) {
      if (!page.success) {
        return { deleted: 0, failed: 0, error: JSON.stringify(page.error) };
      }
      allWorkflows = allWorkflows.concat(page.data?.values ?? []);
    }
  }

  progress.discovered(allWorkflows.length);

  let deleted = 0;
  let failed = 0;

  // Only inactive workflows can be deleted; active ones report as failed.
  for (const workflow of allWorkflows) {
    const id = workflow.id.entityId!;
    const name = workflow.id.name ?? id;
    const deleteWorkflow = await jiraClient.workflows.deleteInactiveWorkflow({
      entityId: id,
    });
    if (deleteWorkflow.success) {
      deleted++;
      progress.item({ id, name, status: "deleted" });
    } else {
      failed++;
      progress.item({ id, name, status: "failed", error: JSON.stringify(deleteWorkflow.error) });
    }
  }

  return { deleted, failed };
};
