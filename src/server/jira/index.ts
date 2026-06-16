import { RESET_CATEGORIES, type ResetCategoryKey } from "@/lib/reset-categories";
import type { ResetFn } from "./types";
import { resetCustomFields } from "./custom-field";
import { resetFieldConfigurations } from "./field-configuration";
import { resetFieldConfigurationSchemes } from "./field-configuration-scheme";
import { resetIssueResolutions } from "./issue-resolution";
import { resetIssueTypes } from "./issue-type";
import { resetIssueTypeSchemes } from "./issue-type-scheme";
import { resetIssueTypeScreenSchemes } from "./issue-type-screen-scheme";
import { resetAllProjects } from "./project";
import { resetScreens } from "./screen";
import { resetScreenSchemes } from "./screen-scheme";
import { resetStatuses } from "./status";
import { resetWorkflows } from "./workflow";
import { resetWorkflowSchemes } from "./workflow-scheme";
export type { ResetFn, ResetResult } from "./types";

/**
 * Registry of every implemented reset function. This is a superset — which
 * categories are actually enabled (and in what order) is decided solely by
 * RESET_CATEGORIES. Comment a category out there and it disappears from
 * RESET_FUNCTIONS below automatically; no edit is needed in this file.
 *
 * To enable a brand-new category: uncomment it in RESET_CATEGORIES and add its
 * function here — TypeScript will flag the missing entry until you do.
 */
const RESET_FUNCTION_REGISTRY = {
  projects: resetAllProjects,
  workflowSchemes: resetWorkflowSchemes,
  workflows: resetWorkflows,
  issueTypeSchemes: resetIssueTypeSchemes,
  issueTypeScreenSchemes: resetIssueTypeScreenSchemes,
  screenSchemes: resetScreenSchemes,
  screens: resetScreens,
  customFields: resetCustomFields,
  statuses: resetStatuses,
  issueTypes: resetIssueTypes,
  fieldConfigurationSchemes: resetFieldConfigurationSchemes,
  fieldConfigurations: resetFieldConfigurations,
  issueResolutions: resetIssueResolutions,
} satisfies Record<string, ResetFn>;

/**
 * Active reset functions in dependency order, derived from RESET_CATEGORIES
 * (the single source of truth for enablement and ordering).
 */
export const RESET_FUNCTIONS: Record<ResetCategoryKey, ResetFn> = Object.fromEntries(
  RESET_CATEGORIES.map(({ key }) => [key, RESET_FUNCTION_REGISTRY[key]])
) as Record<ResetCategoryKey, ResetFn>;
