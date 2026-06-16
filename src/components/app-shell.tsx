import { Typography } from "@heroui/react";
import Link from "next/link";
import { ColorSchemeToggle } from "@/components/color-scheme-toggle";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-separator px-4">
        <Link href="/" className="text-inherit no-underline">
          <Typography type="h4">Jira Utils</Typography>
        </Link>
        <ColorSchemeToggle />
      </header>

      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
