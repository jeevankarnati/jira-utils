"use client";

import {
  Alert,
  Button,
  Checkbox,
  Group,
  List,
  Modal,
  PasswordInput,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { RESET_CATEGORIES, type ResetCategoryKey } from "@/lib/reset-categories";

interface ResetResult {
  deleted: number;
  failed: number;
  error?: string;
}

export default function ResetJiraInstancePage() {
  const [email, setEmail] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [selected, setSelected] = useState<ResetCategoryKey[]>([]);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, ResetResult> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpened, confirm] = useDisclosure(false);

  const canSubmit =
    email.trim() !== "" && baseUrl.trim() !== "" && apiToken.trim() !== "" && selected.length > 0;

  const selectedLabels = RESET_CATEGORIES.filter((c) => selected.includes(c.key)).map(
    (c) => c.label
  );

  const runReset = async () => {
    confirm.close();
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/reset-jira-instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, baseUrl, apiToken, categories: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Request failed");
      } else {
        setResults(data.results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Stack gap="lg">
        <div>
          <Title order={2}>Reset Jira Instance</Title>
          <Text size="sm" c="dimmed">
            Enter your Jira credentials and choose what to delete.
          </Text>
          <Text size="sm" c="dimmed">
            Nothing is stored - credentials are only used for this request.
          </Text>
        </div>

        <TextInput
          label="Email"
          placeholder="you@example.com"
          w="30%"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          required
        />
        <TextInput
          label="Instance URL"
          placeholder="https://your-domain.atlassian.net"
          w="30%"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.currentTarget.value)}
          required
        />
        <PasswordInput
          label="API Token"
          placeholder="Your Jira API token"
          w="30%"
          value={apiToken}
          onChange={(e) => setApiToken(e.currentTarget.value)}
          required
        />

        <Checkbox.Group
          label="What to delete"
          value={selected}
          onChange={(value) => setSelected(value as ResetCategoryKey[])}
        >
          <Stack gap="xs" mt="xs">
            {RESET_CATEGORIES.map((category) => (
              <Checkbox key={category.key} value={category.key} label={category.label} />
            ))}
          </Stack>
        </Checkbox.Group>

        <Group>
          <Button color="red" disabled={!canSubmit} loading={loading} onClick={confirm.open}>
            Reset selected
          </Button>
        </Group>

        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {results && (
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Category</Table.Th>
                <Table.Th>Deleted</Table.Th>
                <Table.Th>Failed</Table.Th>
                <Table.Th>Error</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {RESET_CATEGORIES.filter((c) => results[c.key]).map((c) => {
                const r = results[c.key];
                return (
                  <Table.Tr key={c.key}>
                    <Table.Td>{c.label}</Table.Td>
                    <Table.Td>{r.deleted}</Table.Td>
                    <Table.Td>{r.failed}</Table.Td>
                    <Table.Td>{r.error ?? "—"}</Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Stack>

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
