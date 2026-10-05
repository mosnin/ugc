"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Palette,
  Mic,
  Sparkles,
  Captions,
  Send,
} from "lucide-react";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function FitScale({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(Math.min(1, w / width));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div
      ref={ref}
      className="relative flex w-full justify-center overflow-hidden"
      style={{ height: (scale || 1) * height, visibility: scale ? "visible" : "hidden" }}
    >
      <div
        className="relative shrink-0"
        style={{ width: width * scale, height: height * scale }}
      >
        <div
          className="absolute top-0 left-0"
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

type Action = {
  label: string;
  hint: string;
  Icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  color?: string;
};

const ACTIONS: Action[] = [
  { label: "Style: Bold captions + b-roll", hint: "S", Icon: Palette },
  { label: "Voiceover: Ava, calm", hint: "V", Icon: Mic },
  { label: "Write 5 hooks with AI", hint: "H", Icon: Sparkles, color: "#dc2626" },
  { label: "Auto-caption every clip", hint: "C", Icon: Captions },
  { label: "Post to all channels", hint: "P", Icon: Send },
];

const QuickActions = () => {
  return (
    <FitScale width={380} height={290}>
      <div className="relative h-full w-full">
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2.5">
          {ACTIONS.map((a) => (
            <div
              key={a.label}
              className="flex h-11 w-75 items-center gap-3 rounded-xl bg-black/3 px-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] dark:bg-white/5 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
            >
              <a.Icon
                className="size-5 shrink-0 text-neutral-800 dark:text-neutral-100"
                style={a.color ? { color: a.color } : undefined}
              />
              <span className="text-[14px] text-neutral-700 dark:text-neutral-200">
                {a.label}
              </span>
              <span className="ml-auto grid size-5 place-items-center rounded-md bg-black/5 text-[11px] font-medium text-neutral-500 dark:bg-white/8 dark:text-neutral-400">
                {a.hint}
              </span>
            </div>
          ))}
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-[linear-gradient(to_bottom,var(--color-white),transparent)] dark:bg-[linear-gradient(to_bottom,var(--color-black),transparent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-[linear-gradient(to_top,var(--color-white),transparent)] dark:bg-[linear-gradient(to_top,var(--color-black),transparent)]"
        />
      </div>
    </FitScale>
  );
};

export default QuickActions;
