import type { DefaultJiraClientType } from "@narthia/jira-client";
import type { ProgressReporter, ResetResult } from "./types";

export const resetAllProjects = async (
  jiraClient: DefaultJiraClientType,
  progress: ProgressReporter
): Promise<ResetResult> => {
  const getAllProjects = await jiraClient.projects.getAllProjects();

  if (!getAllProjects.success) {
    return {
      deleted: 0,
      failed: 0,
      error: JSON.stringify(getAllProjects.error ?? "Unknown error"),
    };
  }

  progress.discovered(getAllProjects.data.length);

  let deleted = 0;
  let failed = 0;

  for (const project of getAllProjects.data) {
    const id = project.id!;
    const name = project.name ?? id;
    const deleteProject = await jiraClient.projects.deleteProject({
      projectIdOrKey: id,
      enableUndo: false,
    });
    if (deleteProject.success) {
      deleted++;
      progress.item({ id, name, status: "deleted" });
    } else {
      failed++;
      progress.item({ id, name, status: "failed", error: JSON.stringify(deleteProject.error) });
    }
  }

  return { deleted, failed };
};
