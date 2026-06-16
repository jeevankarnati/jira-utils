import type { ResetCategoryKey } from "./reset-categories";

/**
 * Events streamed (as NDJSON) from the reset route to the UI so the client can
 * render full, real-time progress — which category is running, what was just
 * deleted, and what is queued next. Shared by the route handler and the page.
 */
export type ResetEvent =
  | { type: "category-start"; key: ResetCategoryKey }
  | { type: "category-discovered"; key: ResetCategoryKey; total: number }
  | {
      type: "item-result";
      key: ResetCategoryKey;
      id: string;
      name: string;
      status: "deleted" | "failed";
      error?: string;
    }
  | {
      type: "category-done";
      key: ResetCategoryKey;
      deleted: number;
      failed: number;
      error?: string;
    }
  | { type: "done" };
