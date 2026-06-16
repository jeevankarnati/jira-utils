/**
 * Jira entity categories in their required deletion order. Order matters
 * because of dependencies between entities (e.g. projects must be deleted
 * before the schemes/workflows they reference). Shared by the reset page UI
 * and the server route handler — never reorder.
 */
export const RESET_CATEGORIES = [
  { key: "projects", label: "Projects" },
  { key: "workflowSchemes", label: "Workflow Schemes" },
  { key: "workflows", label: "Workflows" },
  { key: "issueTypeSchemes", label: "Issue Type Schemes" },
  { key: "issueTypeScreenSchemes", label: "Issue Type Screen Schemes" },
  { key: "screenSchemes", label: "Screen Schemes" },
  { key: "screens", label: "Screens" },
  { key: "customFields", label: "Custom Fields" },
  { key: "statuses", label: "Statuses" },
  { key: "issueTypes", label: "Issue Types" },
  { key: "fieldConfigurationSchemes", label: "Field Configuration Schemes" },
  { key: "fieldConfigurations", label: "Field Configurations" },
  { key: "issueResolutions", label: "Issue Resolutions" },
] as const;

export type ResetCategoryKey = (typeof RESET_CATEGORIES)[number]["key"];
