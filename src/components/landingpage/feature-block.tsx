import React from "react";
import { cn } from "@/lib/utils";
import IntegrationWall from "./features/integration-wall";
import QuickActions from "./features/quick-actions";
import Timeline from "./features/timeline";

type Row = {
  title: string;
  description: string;
  href: string;
  visual: React.ReactNode;
};

const rows: Row[] = [
  {
    title: "Every channel, one autopilot.",
    description:
      "Connect TikTok, Instagram, YouTube, and the rest of your accounts. UGC posts each video in the right format at the right time, so one workflow feeds every channel you run.",
    href: "#posting",
    visual: <IntegrationWall />,
  },
  {
    title: "Your style, locked in.",
    description:
      "Pick a content style and a channel theme, then let UGC handle the rest: scripts, hooks, AI voiceover, b-roll, and captions. Every video looks like your channel, without you ever showing your face.",
    href: "#styles",
    visual: <QuickActions />,
  },
  {
    title: "Posts while you sleep. Metrics when you wake.",
    description:
      "Series land on your calendar and go out at peak times automatically. Advanced metrics track views, watch time, and hook performance, so the next batch learns from the last.",
    href: "#metrics",
    visual: <Timeline />,
  },
];

const FeaturesBlock = () => {
  return (
    <section id="product" className="w-full bg-white dark:bg-black">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="flex flex-col gap-16 md:gap-28">
          {rows.map((row, i) => {
            const imageLeft = i % 2 === 1;
            return (
              <div
                key={row.title}
                className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-14"
              >
                <div className={cn("min-w-0 md:pt-6", imageLeft && "md:order-2")}>
                  <h3 className="text-2xl font-medium tracking-tight text-balance text-neutral-900 sm:text-3xl dark:text-white">
                    {row.title}
                  </h3>
                  <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {row.description}
                  </p>
                  <a
                    href={row.href}
                    className="group mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-500"
                  >
                    <span className="underline-offset-4 group-hover:underline">
                      Learn more
                    </span>
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </a>
                </div>

                <div className={cn("min-w-0", imageLeft && "md:order-1")}>
                  <div className="flex items-center justify-center overflow-hidden rounded-2xl bg-white px-6 py-8 ring-1 ring-neutral-200 dark:bg-black dark:ring-neutral-800/70 dark:shadow-[0_20px_50px_-30px_rgba(0,0,0,0.8)]">
                    {row.visual}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesBlock;
