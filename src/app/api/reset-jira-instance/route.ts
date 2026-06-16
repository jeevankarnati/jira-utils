import { JiraClient } from "@narthia/jira-client";
import { RESET_CATEGORIES, type ResetCategoryKey } from "@/lib/reset-categories";
import { RESET_FUNCTIONS, type ResetResult } from "@/server/jira";

interface ResetRequestBody {
  email?: string;
  baseUrl?: string;
  apiToken?: string;
  categories?: string[];
}

export async function POST(req: Request) {
  let body: ResetRequestBody;
  try {
    body = (await req.json()) as ResetRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, baseUrl, apiToken, categories } = body;

  if (!email || !baseUrl || !apiToken) {
    return Response.json({ error: "email, baseUrl and apiToken are required" }, { status: 400 });
  }

  if (!Array.isArray(categories) || categories.length === 0) {
    return Response.json({ error: "At least one category must be selected" }, { status: 400 });
  }

  const selected = new Set(categories);
  const jiraClient = new JiraClient({
    type: "default",
    auth: { email, apiToken, baseUrl },
  });

  const results: Record<string, ResetResult> = {};

  // Iterate in the canonical dependency order, running only selected categories.
  for (const { key } of RESET_CATEGORIES) {
    if (!selected.has(key)) continue;
    try {
      results[key] = await RESET_FUNCTIONS[key as ResetCategoryKey](jiraClient);
    } catch (err) {
      results[key] = {
        deleted: 0,
        failed: 0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return Response.json({ results });
}
