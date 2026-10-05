"use client";

import * as React from "react";
import { PiCircleHalfFill } from "react-icons/pi";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function Themetoggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  const toggle = React.useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "d") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      )
        return;
      toggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return (
    <button
      aria-label="Toggle theme"
      title="Toggle theme (D)"
      onClick={toggle}
      className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
    >
      <PiCircleHalfFill
        className={cn(
          "size-4.5 transition-transform duration-300",
          isDark ? "rotate-180" : "",
        )}
      />
    </button>
  );
}
