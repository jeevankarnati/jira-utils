import { Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";

export default function Home() {
  return (
    <Stack gap="lg">
      <Group>
        <Card withBorder radius="md" padding="lg" w={320}>
          <Stack gap="sm">
            <Title order={4}>Reset Jira Instance</Title>
            <Text size="sm" c="dimmed">
              Delete projects, workflows, screens and other configuration from a Jira Cloud
              instance.
            </Text>
            <Link href="/reset-jira-instance" style={{ textDecoration: "none" }}>
              <Button mt="sm" fullWidth>
                Open
              </Button>
            </Link>
          </Stack>
        </Card>
      </Group>
    </Stack>
  );
}
