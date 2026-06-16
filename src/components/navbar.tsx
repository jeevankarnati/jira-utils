import { Container, Group, Title } from "@mantine/core";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b border-[var(--mantine-color-default-border)]">
      <Container size="lg" h={56}>
        <Group h="100%" align="center">
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Title order={4}>Jira Utils</Title>
          </Link>
        </Group>
      </Container>
    </header>
  );
}
