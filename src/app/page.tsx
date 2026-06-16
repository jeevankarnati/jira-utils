import { Button, Card } from "@heroui/react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <Card className="w-80" variant="default">
          <Card.Header>
            <Card.Title>Reset Jira Instance</Card.Title>
            <Card.Description>
              Delete projects, workflows, screens and other configuration from a Jira Cloud
              instance.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <Link href="/reset-jira-instance" className="mt-2 block no-underline">
              <Button fullWidth>Open</Button>
            </Link>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
