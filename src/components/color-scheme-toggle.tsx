"use client";

import { Button } from "@heroui/react";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";

export function ColorSchemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggle = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  // Render both icons and let CSS (the `dark` class on <html>) decide which is
  // visible, so the server and client markup match — branching on the resolved
  // theme during render causes a hydration mismatch.
  return (
    <Button isIconOnly variant="ghost" aria-label="Toggle color scheme" onPress={toggle}>
      <IconMoon size={18} className="dark:hidden" />
      <IconSun size={18} className="hidden dark:block" />
    </Button>
  );
}
