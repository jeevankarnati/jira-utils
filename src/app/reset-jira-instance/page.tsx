"use client";

import {
  Accordion,
  Alert,
  Button,
  Checkbox,
  CheckboxGroup,
  Chip,
  Input,
  Label,
  Modal,
  ProgressBar,
  Spinner,
  TextField,
  Typography,
} from "@heroui/react";
import { IconCheck, IconClock, IconListCheck, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import type { ResetEvent } from "@/lib/reset-events";
import { isBlockedInstanceUrl } from "@/lib/is-blocked-instance-url";
import { RESET_CATEGORIES, type ResetCategoryKey } from "@/lib/reset-categories";

type CategoryStatus = "queued" | "running" | "done";

interface ItemProgress {
  id: string;
  name: string;
  status: "deleted" | "failed";
  error?: string;
}

interface CategoryProgress {
  status: CategoryStatus;
  total: number | null;
  deleted: number;
  failed: number;
  error?: string;
  items: ItemProgress[];
}

type ProgressMap = Partial<Record<ResetCategoryKey, CategoryProgress>>;

export default function ResetJiraInstancePage() {
  const [email, setEmail] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [selected, setSelected] = useState<ResetCategoryKey[]>([]);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressMap | null>(null);
  const [openPanels, setOpenPanels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);

  const canSubmit =
    email.trim() !== "" && baseUrl.trim() !== "" && apiToken.trim() !== "" && selected.length > 0;

  const selectedLabels = RESET_CATEGORIES.filter((c) => selected.includes(c.key)).map(
    (c) => c.label
  );

  // Categories that will run, in canonical dependency order.
  const orderedSelected = RESET_CATEGORIES.filter((c) => selected.includes(c.key));

  const applyEvent = (event: ResetEvent) => {
    if (event.type === "done") return;
    setProgress((prev) => {
      const next: ProgressMap = { ...prev };
      const current = next[event.key] ?? {
        status: "queued",
        total: null,
        deleted: 0,
        failed: 0,
        items: [],
      };

      switch (event.type) {
        case "category-start":
          next[event.key] = { ...current, status: "running" };
          break;
        case "category-discovered":
          next[event.key] = { ...current, total: event.total };
          break;
        case "item-result":
          next[event.key] = {
            ...current,
            deleted: current.deleted + (event.status === "deleted" ? 1 : 0),
            failed: current.failed + (event.status === "failed" ? 1 : 0),
            items: [
              ...current.items,
              { id: event.id, name: event.name, status: event.status, error: event.error },
            ],
          };
          break;
        case "category-done":
          next[event.key] = {
            ...current,
            status: "done",
            deleted: event.deleted,
            failed: event.failed,
            error: event.error,
            total: current.total ?? event.deleted + event.failed,
          };
          break;
      }
      return next;
    });

    if (event.type === "category-start") {
      // Follow the active category so the user sees deletions as they happen.
      setOpenPanels([event.key]);
    }
  };

  const runReset = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setError(null);
    setOpenPanels([]);
    // Seed every selected category as "queued" so the full plan is visible up front.
    setProgress(
      Object.fromEntries(
        orderedSelected.map((c) => [
          c.key,
          { status: "queued", total: null, deleted: 0, failed: 0, items: [] },
        ])
      ) as ProgressMap
    );

    try {
      const res = await fetch("/api/reset-jira-instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, baseUrl, apiToken, categories: selected }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Request failed");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newline: number;
        while ((newline = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (line) applyEvent(JSON.parse(line) as ResetEvent);
        }
      }

      // Everything finished - collapse all categories so the summary is clean.
      setOpenPanels([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const selectAll = () => setSelected(RESET_CATEGORIES.map((c) => c.key));
  const clearAll = () => setSelected([]);

  const clearProgress = () => {
    setProgress(null);
    setOpenPanels([]);
    setError(null);
  };

  const handleResetPress = () => {
    if (isBlockedInstanceUrl(baseUrl)) {
      setBlockedOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 md:h-[calc(100dvh-56px-2rem)] md:overflow-hidden">
      <div>
        <Typography type="h2">Reset Jira Instance</Typography>
        <Typography type="body-sm" color="muted">
          Enter your Jira credentials and choose what to delete. Nothing is stored - credentials are
          only used for this request.
        </Typography>
      </div>

      <div className="flex flex-col gap-6 md:min-h-0 md:flex-1 md:flex-row">
        <div className="w-full shrink-0 md:w-2/5">
          <div className="flex flex-col overflow-hidden rounded-xl border border-border md:h-full">
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="flex flex-col gap-4">
                <TextField value={email} onChange={setEmail} isRequired>
                  <Label>Email</Label>
                  <Input type="email" placeholder="you@example.com" />
                </TextField>
                <TextField value={baseUrl} onChange={setBaseUrl} isRequired>
                  <Label>Instance URL</Label>
                  <Input type="url" placeholder="https://your-domain.atlassian.net" />
                </TextField>
                <TextField value={apiToken} onChange={setApiToken} isRequired>
                  <Label>API Token</Label>
                  <Input type="password" placeholder="Your Jira API token" />
                </TextField>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Typography type="body-sm" weight="medium">
                      What to delete
                    </Typography>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onPress={selectAll}>
                        All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={clearAll}
                        isDisabled={selected.length === 0}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <CheckboxGroup
                    aria-label="What to delete"
                    value={selected}
                    onChange={(value) => setSelected(value as ResetCategoryKey[])}
                  >
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {RESET_CATEGORIES.map((category) => (
                        <Checkbox key={category.key} value={category.key}>
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            {category.label}
                          </Checkbox.Content>
                        </Checkbox>
                      ))}
                    </div>
                  </CheckboxGroup>
                </div>

                <Button
                  variant="danger"
                  fullWidth
                  isDisabled={!canSubmit}
                  isPending={loading}
                  onPress={handleResetPress}
                >
                  {({ isPending }) => (
                    <>
                      {isPending ? <Spinner color="current" size="sm" /> : null}
                      {selected.length > 0 ? `Reset ${selected.length} selected` : "Reset selected"}
                    </>
                  )}
                </Button>

                {error && (
                  <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>Error</Alert.Title>
                      <Alert.Description>{error}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col overflow-hidden rounded-xl border border-border md:h-full">
            {progress ? (
              <ProgressPanel
                ordered={orderedSelected}
                progress={progress}
                openPanels={openPanels}
                onOpenChange={setOpenPanels}
                running={loading}
                onClear={clearProgress}
              />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>

      <Modal.Backdrop isOpen={blockedOpen} onOpenChange={setBlockedOpen}>
        <Modal.Container placement="center">
          <Modal.Dialog className="sm:max-w-[420px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Reset not allowed</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <Typography type="body-sm">
                Resetting Jira instances with &quot;trundl&quot; in the URL is not allowed.
              </Typography>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" slot="close">
                OK
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop isOpen={confirmOpen} onOpenChange={setConfirmOpen}>
        <Modal.Container placement="center">
          <Modal.Dialog className="sm:max-w-[420px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Confirm deletion</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <Typography type="body-sm">
                This will permanently delete the following from{" "}
                <span className="font-semibold text-foreground">{baseUrl || "the instance"}</span>.
                This cannot be undone.
              </Typography>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {selectedLabels.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" slot="close">
                Cancel
              </Button>
              <Button variant="danger" onPress={runReset}>
                Delete permanently
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[280px] flex-1 items-center justify-center">
      <div className="flex max-w-80 flex-col items-center gap-2 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-default text-muted">
          <IconListCheck size={28} />
        </div>
        <Typography weight="semibold" align="center">
          No reset running yet
        </Typography>
        <Typography type="body-sm" color="muted" align="center">
          Select what to delete and start a reset. Live progress and per-item results will appear
          here.
        </Typography>
      </div>
    </div>
  );
}

interface ProgressPanelProps {
  ordered: readonly { key: ResetCategoryKey; label: string }[];
  progress: ProgressMap;
  openPanels: string[];
  onOpenChange: (value: string[]) => void;
  running: boolean;
  onClear: () => void;
}

function ProgressPanel({
  ordered,
  progress,
  openPanels,
  onOpenChange,
  running,
  onClear,
}: ProgressPanelProps) {
  const runningKey = ordered.find(({ key }) => progress[key]?.status === "running")?.key ?? null;
  const runningRef = useRef<HTMLDivElement>(null);
  // Re-scroll as the active category grows, not just when it changes - the last
  // category has no content below it, so "start" alignment can't pull it up.
  const runningCount = runningKey ? (progress[runningKey]?.items.length ?? 0) : 0;

  // Keep the category currently being processed in view as the run advances.
  useEffect(() => {
    runningRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [runningKey, runningCount]);

  const totals = ordered.reduce(
    (acc, { key }) => {
      const p = progress[key];
      if (!p) return acc;
      acc.deleted += p.deleted;
      acc.failed += p.failed;
      if (p.status === "done") acc.doneCategories += 1;
      return acc;
    },
    { deleted: 0, failed: 0, doneCategories: 0 }
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-5">
      <div className="flex items-center justify-between gap-2">
        <Typography weight="semibold">{running ? "Deleting…" : "Reset complete"}</Typography>
        <div className="flex items-center gap-2">
          <Typography type="body-sm" color="muted">
            {totals.doneCategories} / {ordered.length} categories
          </Typography>
          <Chip color="success" variant="soft" size="sm">
            {totals.deleted} deleted
          </Chip>
          {totals.failed > 0 && (
            <Chip color="danger" variant="soft" size="sm">
              {totals.failed} failed
            </Chip>
          )}
          <Button variant="ghost" size="sm" onPress={onClear} isDisabled={running}>
            Clear
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Accordion
          allowsMultipleExpanded
          expandedKeys={openPanels}
          onExpandedChange={(keys) => onOpenChange([...keys].map(String))}
          variant="surface"
        >
          {ordered.map(({ key, label }) => {
            const p = progress[key];
            if (!p) return null;
            return (
              <Accordion.Item key={key} id={key} ref={key === runningKey ? runningRef : undefined}>
                <Accordion.Heading>
                  <Accordion.Trigger className="flex w-full items-center gap-3">
                    <StatusIcon p={p} />
                    <CategoryHeader label={label} p={p} />
                    <Accordion.Indicator />
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body>
                    <CategoryDetail p={p} />
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}

function StatusIcon({ p }: { p: CategoryProgress }) {
  if (p.status === "queued") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-default text-muted">
        <IconClock size={16} />
      </span>
    );
  }
  if (p.status === "running") {
    return <Spinner size="sm" />;
  }
  if (p.error || p.failed > 0) {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger-soft-foreground">
        <IconX size={16} />
      </span>
    );
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success-soft text-success-soft-foreground">
      <IconCheck size={16} />
    </span>
  );
}

function CategoryHeader({ label, p }: { label: string; p: CategoryProgress }) {
  const processed = p.deleted + p.failed;
  const percent =
    p.total && p.total > 0 ? (processed / p.total) * 100 : p.status === "done" ? 100 : 0;

  const statusLabel =
    p.status === "queued"
      ? "Queued"
      : p.status === "running"
        ? p.total === null
          ? "Finding…"
          : `Deleting ${processed} / ${p.total}`
        : p.error
          ? "Failed"
          : p.failed > 0
            ? `Done · ${p.failed} failed`
            : "Done";

  return (
    <div className="flex flex-1 flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <Typography type="body-sm" weight="medium">
          {label}
        </Typography>
        <Typography type="body-xs" color="muted">
          {statusLabel}
        </Typography>
      </div>
      <ProgressBar
        aria-label={label}
        className="w-full"
        value={percent}
        size="sm"
        color={p.error || p.failed > 0 ? "danger" : "success"}
      >
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  );
}

function CategoryDetail({ p }: { p: CategoryProgress }) {
  const viewportRef = useRef<HTMLDivElement>(null);

  // Keep the latest deleted item in view as the list grows.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [p.items.length]);

  if (p.error) {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Category failed</Alert.Title>
          <Alert.Description>{p.error}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  if (p.status !== "queued" && p.total === 0) {
    return (
      <Typography type="body-sm" color="muted">
        Nothing to delete.
      </Typography>
    );
  }

  if (p.items.length === 0) {
    return (
      <Typography type="body-sm" color="muted">
        {p.status === "queued" ? "Waiting to start…" : "Finding items…"}
      </Typography>
    );
  }

  return (
    <div ref={viewportRef} className="max-h-[260px] scrollbar overflow-y-auto">
      <div className="flex flex-col gap-1.5">
        {p.items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="flex items-start gap-2">
            {item.status === "deleted" ? (
              <IconCheck size={16} className="mt-0.5 shrink-0 text-success" />
            ) : (
              <IconX size={16} className="mt-0.5 shrink-0 text-danger" />
            )}
            <div className="flex min-w-0 flex-col">
              <Typography type="body-sm" truncate>
                {item.name}
              </Typography>
              <Typography type="body-xs" color="muted" className="font-mono">
                {item.id}
              </Typography>
              {item.status === "failed" && item.error && (
                <Typography type="body-xs" className="text-danger">
                  {item.error}
                </Typography>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
