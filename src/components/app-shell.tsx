"use client";

import { AppShell, Group, Title } from "@mantine/core";
import Link from "next/link";
import { ColorSchemeToggle } from "@/components/color-scheme-toggle";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Title order={4}>Jira Utils</Title>
          </Link>
          <ColorSchemeToggle />
        </Group>
      </AppShell.Header>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
