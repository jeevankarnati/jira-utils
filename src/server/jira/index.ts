import type { ResetCategoryKey } from "@/lib/reset-categories";
import type { ResetFn } from "./types";
import { resetCustomFields } from "./custom-field";
import { resetIssueTypeSchemes } from "./issue-type-scheme";
import { resetIssueTypeScreenSchemes } from "./issue-type-screen-scheme";
import { resetAllProjects } from "./project";
import { resetScreens } from "./screen";
import { resetScreenSchemes } from "./screen-scheme";
import { resetWorkflows } from "./workflow";
import { resetWorkflowSchemes } from "./workflow-scheme";

export type { ResetFn, ResetResult } from "./types";

/** Maps each category key to its reset function (run in dependency order). */
export const RESET_FUNCTIONS: Record<ResetCategoryKey, ResetFn> = {
  projects: resetAllProjects,
  workflowSchemes: resetWorkflowSchemes,
  workflows: resetWorkflows,
  issueTypeSchemes: resetIssueTypeSchemes,
  issueTypeScreenSchemes: resetIssueTypeScreenSchemes,
  screenSchemes: resetScreenSchemes,
  screens: resetScreens,
  customFields: resetCustomFields,
  // statuses: resetStatuses,
  // issueTypes: resetIssueTypes,
  // fieldConfigurationSchemes: resetFieldConfigurationSchemes,
  // fieldConfigurations: resetFieldConfigurations,
  // issueResolutions: resetIssueResolutions,
};
