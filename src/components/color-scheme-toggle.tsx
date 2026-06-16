"use client";

import { ActionIcon, Box, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

export function ColorSchemeToggle() {
  const { toggleColorScheme } = useMantineColorScheme();

  // Render both icons and let Mantine hide one via CSS (data attributes) so the
  // server and client markup match — branching on the computed scheme during
  // render causes a hydration mismatch.
  return (
    <ActionIcon
      variant="default"
      size="lg"
      aria-label="Toggle color scheme"
      onClick={toggleColorScheme}
    >
      <Box darkHidden>
        <IconMoon size={18} />
      </Box>
      <Box lightHidden>
        <IconSun size={18} />
      </Box>
    </ActionIcon>
  );
}
