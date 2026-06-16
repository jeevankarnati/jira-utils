import type { DefaultJiraClientType } from "@narthia/jira-client";
import type { ResetResult } from "./types";

export const resetAllProjects = async (jiraClient: DefaultJiraClientType): Promise<ResetResult> => {
  const getAllProjects = await jiraClient.projects.getAllProjects();

  if (!getAllProjects.success) {
    return {
      deleted: 0,
      failed: 0,
      error: JSON.stringify(getAllProjects.error ?? "Unknown error"),
    };
  }

  let deleted = 0;
  let failed = 0;

  for (const project of getAllProjects.data) {
    const deleteProject = await jiraClient.projects.deleteProject({
      projectIdOrKey: project.id!,
      enableUndo: false,
    });
    if (deleteProject.success) {
      deleted++;
    } else {
      failed++;
    }
  }

  return { deleted, failed };
};
