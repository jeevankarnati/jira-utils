import { JiraClient } from "@narthia/jira-client";
import type { ResetEvent } from "@/lib/reset-events";
import { isBlockedInstanceUrl } from "@/lib/is-blocked-instance-url";
import { RESET_CATEGORIES, type ResetCategoryKey } from "@/lib/reset-categories";
import { RESET_FUNCTIONS } from "@/server/jira";

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

  if (isBlockedInstanceUrl(baseUrl)) {
    return Response.json(
      { error: 'Resetting instances with "trundl" in the URL is not allowed.' },
      { status: 403 }
    );
  }

  const selected = new Set(categories);
  const jiraClient = new JiraClient({
    type: "default",
    auth: { email, apiToken, baseUrl },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ResetEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      // Iterate in the canonical dependency order, running only selected
      // categories. Each reset function reports progress as it deletes, which
      // we relay to the client one event at a time.
      for (const { key } of RESET_CATEGORIES) {
        if (!selected.has(key)) continue;

        send({ type: "category-start", key });
        try {
          const result = await RESET_FUNCTIONS[key as ResetCategoryKey](jiraClient, {
            discovered: (total) => send({ type: "category-discovered", key, total }),
            item: (item) => send({ type: "item-result", key, ...item }),
          });
          send({ type: "category-done", key, ...result });
        } catch (err) {
          send({
            type: "category-done",
            key,
            deleted: 0,
            failed: 0,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
