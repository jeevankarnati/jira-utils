"use client";

import {
  Accordion,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Checkbox,
  Flex,
  Group,
  List,
  Loader,
  Modal,
  PasswordInput,
  Progress,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCheck, IconClock, IconListCheck, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import type { ResetEvent } from "@/lib/reset-events";
import { RESET_CATEGORIES, type ResetCategoryKey } from "@/lib/reset-categories";
import classes from "./page.module.css";

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
  const [confirmOpened, confirm] = useDisclosure(false);

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
    confirm.close();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const selectAll = () => setSelected(RESET_CATEGORIES.map((c) => c.key));
  const clearAll = () => setSelected([]);

  return (
    <div className={classes.page}>
      <div>
        <Title order={2}>Reset Jira Instance</Title>
        <Text size="sm" c="dimmed">
          Enter your Jira credentials and choose what to delete. Nothing is stored - credentials are
          only used for this request.
        </Text>
      </div>

      <Flex className={classes.cols} direction={{ base: "column", md: "row" }} gap="lg">
        <Box w={{ base: "100%", md: "40%" }} style={{ flexShrink: 0 }}>
          <Card withBorder radius="md" padding="lg" className={classes.card}>
            <Box className={classes.cardScroll}>
              <Stack gap="md">
                <TextInput
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  required
                />
                <TextInput
                  label="Instance URL"
                  placeholder="https://your-domain.atlassian.net"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.currentTarget.value)}
                  required
                />
                <PasswordInput
                  label="API Token"
                  placeholder="Your Jira API token"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.currentTarget.value)}
                  required
                />

                <Checkbox.Group
                  label={
                    <Group justify="space-between" wrap="nowrap">
                      <Text component="span" fw={500} size="sm">
                        What to delete
                      </Text>
                      <Group gap={4}>
                        <Button variant="subtle" size="compact-xs" onClick={selectAll}>
                          All
                        </Button>
                        <Button
                          variant="subtle"
                          size="compact-xs"
                          color="gray"
                          onClick={clearAll}
                          disabled={selected.length === 0}
                        >
                          Clear
                        </Button>
                      </Group>
                    </Group>
                  }
                  value={selected}
                  onChange={(value) => setSelected(value as ResetCategoryKey[])}
                >
                  <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="xs" mt="xs">
                    {RESET_CATEGORIES.map((category) => (
                      <Checkbox key={category.key} value={category.key} label={category.label} />
                    ))}
                  </SimpleGrid>
                </Checkbox.Group>

                <Button
                  color="red"
                  fullWidth
                  disabled={!canSubmit}
                  loading={loading}
                  onClick={confirm.open}
                >
                  {selected.length > 0 ? `Reset ${selected.length} selected` : "Reset selected"}
                </Button>

                {error && (
                  <Alert color="red" title="Error">
                    {error}
                  </Alert>
                )}
              </Stack>
            </Box>
          </Card>
        </Box>

        <Box flex={1} miw={0}>
          <Card withBorder radius="md" padding="lg" className={classes.card}>
            {progress ? (
              <ProgressPanel
                ordered={orderedSelected}
                progress={progress}
                openPanels={openPanels}
                onOpenChange={setOpenPanels}
                running={loading}
              />
            ) : (
              <EmptyState />
            )}
          </Card>
        </Box>
      </Flex>

      <Modal opened={confirmOpened} onClose={confirm.close} title="Confirm deletion" centered>
        <Stack gap="md">
          <Text size="sm">
            This will permanently delete the following from{" "}
            <Text span fw={600}>
              {baseUrl || "the instance"}
            </Text>
            . This cannot be undone.
          </Text>
          <List size="sm">
            {selectedLabels.map((label) => (
              <List.Item key={label}>{label}</List.Item>
            ))}
          </List>
          <Group justify="flex-end">
            <Button variant="default" onClick={confirm.close}>
              Cancel
            </Button>
            <Button color="red" onClick={runReset}>
              Delete permanently
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}

function EmptyState() {
  return (
    <Center style={{ flex: 1 }} mih={280}>
      <Stack align="center" gap="sm" maw={320} ta="center">
        <ThemeIcon color="gray" variant="light" radius="xl" size={56}>
          <IconListCheck size={28} />
        </ThemeIcon>
        <Text fw={600}>No reset running yet</Text>
        <Text size="sm" c="dimmed">
          Select what to delete and start a reset. Live progress and per-item results will appear
          here.
        </Text>
      </Stack>
    </Center>
  );
}

interface ProgressPanelProps {
  ordered: readonly { key: ResetCategoryKey; label: string }[];
  progress: ProgressMap;
  openPanels: string[];
  onOpenChange: (value: string[]) => void;
  running: boolean;
}

function ProgressPanel({
  ordered,
  progress,
  openPanels,
  onOpenChange,
  running,
}: ProgressPanelProps) {
  const runningKey = ordered.find(({ key }) => progress[key]?.status === "running")?.key ?? null;
  const runningRef = useRef<HTMLDivElement>(null);

  // Bring the category currently being processed into view as the run advances.
  useEffect(() => {
    runningRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [runningKey]);

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
    <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
      <Group justify="space-between">
        <Text fw={600}>{running ? "Deleting…" : "Reset complete"}</Text>
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            {totals.doneCategories} / {ordered.length} categories
          </Text>
          <Badge color="green" variant="light">
            {totals.deleted} deleted
          </Badge>
          {totals.failed > 0 && (
            <Badge color="red" variant="light">
              {totals.failed} failed
            </Badge>
          )}
        </Group>
      </Group>

      <Box className={classes.cardScroll}>
        <Accordion multiple value={openPanels} onChange={onOpenChange} variant="separated">
          {ordered.map(({ key, label }) => {
            const p = progress[key];
            if (!p) return null;
            return (
              <Accordion.Item
                key={key}
                value={key}
                ref={key === runningKey ? runningRef : undefined}
              >
                <Accordion.Control icon={<StatusIcon p={p} />}>
                  <CategoryHeader label={label} p={p} />
                </Accordion.Control>
                <Accordion.Panel>
                  <CategoryDetail p={p} />
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </Box>
    </Stack>
  );
}

function StatusIcon({ p }: { p: CategoryProgress }) {
  if (p.status === "queued") {
    return (
      <ThemeIcon color="gray" variant="light" radius="xl" size="md">
        <IconClock size={16} />
      </ThemeIcon>
    );
  }
  if (p.status === "running") {
    return <Loader size="sm" />;
  }
  if (p.error || p.failed > 0) {
    return (
      <ThemeIcon color="red" variant="light" radius="xl" size="md">
        <IconX size={16} />
      </ThemeIcon>
    );
  }
  return (
    <ThemeIcon color="green" variant="light" radius="xl" size="md">
      <IconCheck size={16} />
    </ThemeIcon>
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
    <Stack gap={4} style={{ flex: 1 }}>
      <Group justify="space-between" wrap="nowrap">
        <Text fw={500}>{label}</Text>
        <Text size="xs" c="dimmed">
          {statusLabel}
        </Text>
      </Group>
      <Progress
        value={percent}
        size="sm"
        radius="xl"
        striped={p.status === "running"}
        animated={p.status === "running"}
        color={p.error || p.failed > 0 ? "red" : "green"}
      />
    </Stack>
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
      <Alert color="red" variant="light" title="Category failed">
        {p.error}
      </Alert>
    );
  }

  if (p.status !== "queued" && p.total === 0) {
    return (
      <Text size="sm" c="dimmed">
        Nothing to delete.
      </Text>
    );
  }

  if (p.items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {p.status === "queued" ? "Waiting to start…" : "Finding items…"}
      </Text>
    );
  }

  return (
    <ScrollArea.Autosize viewportRef={viewportRef} mah={260} type="auto">
      <Stack gap={6}>
        {p.items.map((item, index) => (
          <Group key={`${item.id}-${index}`} gap="xs" wrap="nowrap" align="flex-start">
            {item.status === "deleted" ? (
              <IconCheck
                size={16}
                color="var(--mantine-color-green-6)"
                style={{ flexShrink: 0, marginTop: 2 }}
              />
            ) : (
              <IconX
                size={16}
                color="var(--mantine-color-red-6)"
                style={{ flexShrink: 0, marginTop: 2 }}
              />
            )}
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text size="sm" truncate>
                {item.name}
              </Text>
              <Text size="xs" c="dimmed" ff="monospace">
                {item.id}
              </Text>
              {item.status === "failed" && item.error && (
                <Text size="xs" c="red">
                  {item.error}
                </Text>
              )}
            </Stack>
          </Group>
        ))}
      </Stack>
    </ScrollArea.Autosize>
  );
}
