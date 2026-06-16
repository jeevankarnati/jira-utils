import type { DefaultJiraClientType } from "@narthia/jira-client";
import type { ResetResult } from "./types";

export const resetCustomFields = async (
  jiraClient: DefaultJiraClientType
): Promise<ResetResult> => {
  const maxResults = 50;

  const firstPage = await jiraClient.issueFields.getFieldsPaginated({
    type: ["custom"],
    maxResults,
    startAt: 0,
  });

  if (!firstPage.success) {
    return { deleted: 0, failed: 0, error: JSON.stringify(firstPage.error) };
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allCustomFields = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pages = await Promise.all(
      pageIndexes.map((pageIndex) =>
        jiraClient.issueFields.getFieldsPaginated({
          type: ["custom"],
          maxResults,
          startAt: pageIndex * maxResults,
        })
      )
    );
    for (const page of pages) {
      if (!page.success) {
        return { deleted: 0, failed: 0, error: JSON.stringify(page.error) };
      }
      allCustomFields = allCustomFields.concat(page.data?.values ?? []);
    }
  }

  let deleted = 0;
  let failed = 0;

  for (const customField of allCustomFields) {
    const deleteCustomField = await jiraClient.issueFields.deleteCustomField({
      id: customField.id!,
    });
    if (deleteCustomField.success) {
      deleted++;
    } else {
      failed++;
    }
  }

  return { deleted, failed };
};
