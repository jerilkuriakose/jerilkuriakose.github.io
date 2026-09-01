"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-12 rounded-full"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* Both icons are always rendered so server and client markup match,
          and CSS picks one via the `.dark` class. This avoids a hydration
          mismatch without a setState-in-effect mount gate, and removes the
          flash of the placeholder icon the previous version had. */}
      <Sun className="size-4 text-foreground hidden dark:block" />
      <Moon className="size-4 text-foreground block dark:hidden" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
