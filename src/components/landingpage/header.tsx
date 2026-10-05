"use client";

import Link from "next/link";
import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Themetoggle } from "./theme-toggle";
import {
  Palette,
  Sparkles,
  Mic,
  Captions,
  Clapperboard,
  CalendarClock,
  Send,
  ChartColumn,
  Users,
  Briefcase,
  PenLine,
  Heart,
  Mail,
  Handshake,
  MessagesSquare,
  FileText,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

type IconType = React.ComponentType<{ className?: string }>;
type MegaLink = {
  title: string;
  href: string;
  description: string;
  icon: IconType;
};
type HighlightArt = "blocks" | "showcase" | "docs" | "figma";
type Highlight = {
  title: string;
  description: string;
  href: string;
  art: HighlightArt;
};
type NavItem = {
  id: number;
  title: string;
  href: string;
  columns?: MegaLink[][];
  highlights?: Highlight[];
};

const navigationItems: NavItem[] = [
  {
    id: 1,
    title: "Product",
    href: "#product",
    columns: [
      [
        {
          title: "Content styles",
          href: "#styles",
          description: "Pick a look your channel owns.",
          icon: Palette,
        },
        {
          title: "AI scripts & hooks",
          href: "#scripts",
          description: "Hooks written to stop the scroll.",
          icon: Sparkles,
        },
        {
          title: "AI voiceovers",
          href: "#voiceovers",
          description: "Natural voices, no mic needed.",
          icon: Mic,
        },
        {
          title: "Auto-captions",
          href: "#captions",
          description: "Animated captions on every clip.",
          icon: Captions,
        },
      ],
      [
        {
          title: "B-roll & visuals",
          href: "#visuals",
          description: "Faceless footage, generated to fit.",
          icon: Clapperboard,
        },
        {
          title: "Content calendar",
          href: "#calendar",
          description: "A schedule that fills itself.",
          icon: CalendarClock,
        },
        {
          title: "Auto-posting",
          href: "#posting",
          description: "Published while you sleep.",
          icon: Send,
        },
        {
          title: "Advanced metrics",
          href: "#metrics",
          description: "Know which videos win, and why.",
          icon: ChartColumn,
        },
      ],
    ],
    highlights: [
      {
        title: "Changelog",
        description: "See what shipped this week.",
        href: "#changelog",
        art: "docs",
      },
      {
        title: "Style library",
        description: "Proven faceless formats to start from.",
        href: "#styles",
        art: "showcase",
      },
    ],
  },
  {
    id: 2,
    title: "Company",
    href: "#company",
    columns: [
      [
        {
          title: "About",
          href: "#about",
          description: "The team automating content.",
          icon: Users,
        },
        {
          title: "Careers",
          href: "#careers",
          description: "Help us build the content engine.",
          icon: Briefcase,
        },
        {
          title: "Blog",
          href: "#blog",
          description: "Notes on faceless growth.",
          icon: PenLine,
        },
        {
          title: "Creators",
          href: "#creators",
          description: "Channels that run on UGC.",
          icon: Heart,
        },
      ],
      [
        {
          title: "Contact",
          href: "#contact",
          description: "Talk to the team.",
          icon: Mail,
        },
        {
          title: "Affiliates",
          href: "#affiliates",
          description: "Earn by sharing UGC.",
          icon: Handshake,
        },
        {
          title: "Community",
          href: "#community",
          description: "Trade formats with other creators.",
          icon: MessagesSquare,
        },
        {
          title: "Press",
          href: "#press",
          description: "Logos, brand, and coverage.",
          icon: FileText,
        },
      ],
    ],
    highlights: [
      {
        title: "Templates",
        description: "Channel themes ready to automate.",
        href: "#templates",
        art: "figma",
      },
      {
        title: "Status",
        description: "Live rendering and posting uptime.",
        href: "#status",
        art: "blocks",
      },
    ],
  },
  { id: 3, title: "Pricing", href: "#pricing" },
  { id: 4, title: "FAQ", href: "#faq" },
];

const Header = () => {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);

  const setActive = (val: number | null) => {
    if (typeof activeId === "number" && typeof val === "number") {
      setDirection(activeId > val ? "right" : "left");
    } else {
      setDirection(null);
    }
    setActiveId(val);
  };

  const activeItem = navigationItems.find(
    (item) => item.id === activeId && item.columns,
  );

  return (
    <div
      className="sticky top-0 z-50 w-full"
      onMouseLeave={() => setActive(null)}
    >
      <div
        className={cn(
          "relative w-full border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
          (activeItem || isOpen) && "border-b-0",
        )}
      >
        <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center px-4">
          <Logo />

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
            {navigationItems.map((item) => {
              const hasMega = !!item.columns;
              if (!hasMega) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onMouseEnter={() => setActive(null)}
                    className="rounded-md px-3 py-2 text-[13.5px] font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                  >
                    {item.title}
                  </a>
                );
              }
              return (
                <button
                  key={item.id}
                  onMouseEnter={() => setActive(item.id)}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors",
                    activeId === item.id
                      ? "text-neutral-900 dark:text-neutral-50"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50",
                  )}
                >
                  {item.title}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      activeId === item.id && "rotate-180",
                    )}
                  />
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1 text-sm font-medium">
            <Themetoggle />
            <Link
              href="/sign-up"
              className="cursor-pointer rounded-full bg-linear-to-b from-red-500 to-red-600 px-4 py-2 text-[13px] whitespace-nowrap text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_3px_10px_-6px_rgba(220,38,38,0.35)] transition-all duration-150 hover:brightness-110"
            >
              Get started
            </Link>

            <div className="flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                aria-label="Toggle Menu"
              >
                {isOpen ? (
                  <X className="size-4.5" />
                ) : (
                  <Menu className="size-4.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {activeItem && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: "auto",
                opacity: 1,
                transition: {
                  height: { duration: 0.32, ease: [0.33, 1, 0.68, 1] },
                  opacity: { duration: 0.2, ease: "easeOut" },
                },
              }}
              exit={{
                height: 0,
                opacity: 0,
                transition: {
                  height: { duration: 0.3, ease: [0.65, 0, 0.35, 1] },
                  opacity: { duration: 0.2, ease: "easeInOut" },
                },
              }}
              className="absolute inset-x-0 top-full hidden w-full overflow-hidden border-b border-neutral-200 bg-white md:block dark:border-neutral-800 dark:bg-neutral-950"
            >
              <motion.div
                key={activeItem.id}
                initial={{
                  opacity: 0,
                  x: direction === "left" ? 50 : direction === "right" ? -50 : 0,
                }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.26,
                  ease: "easeOut",
                  delay: direction ? 0.04 : 0.06,
                }}
                className="mx-auto grid w-full max-w-6xl grid-cols-12 gap-x-8 gap-y-8 px-4 pt-5 pb-8"
              >
                {activeItem.columns!.map((column, ci) => (
                  <div
                    key={ci}
                    className="col-span-6 flex flex-col gap-1 lg:col-span-3"
                  >
                    {column.map((link) => {
                      const Icon = link.icon;
                      return (
                        <a
                          key={link.href}
                          href={link.href}
                          className="group flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900"
                        >
                          <div className="flex min-h-9 min-w-9 items-center justify-center rounded-sm bg-linear-to-b from-white to-neutral-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15),0_3px_10px_-6px_rgba(0,0,0,0.22)] dark:from-neutral-900 dark:to-neutral-950 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_0_rgba(255,255,255,0.08),0_6px_18px_-12px_rgba(0,0,0,0.5)]">
                            <Icon className="size-4 text-neutral-500 group-hover:text-red-600 dark:text-neutral-300 dark:group-hover:text-red-500" />
                          </div>
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                              {link.title}
                            </div>
                            <div className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                              {link.description}
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                ))}

                {activeItem.highlights?.map((h) => (
                  <HighlightCard
                    key={h.href}
                    item={h}
                    className="col-span-6 lg:col-span-3"
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: { duration: 0.32, ease: [0.33, 1, 0.68, 1] },
                opacity: { duration: 0.2, ease: "easeOut" },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.3, ease: [0.65, 0, 0.35, 1] },
                opacity: { duration: 0.2, ease: "easeInOut" },
              },
            }}
            className="absolute inset-x-0 top-full z-40 overflow-hidden border-b border-neutral-200 bg-white md:hidden dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="flex flex-col px-4 pb-2">
              {navigationItems.map((item) => {
                const hasMega = !!item.columns;
                const isAccordionOpen = activeAccordion === item.id;
                const rowBorder =
                  "border-b border-neutral-200 dark:border-neutral-800";

                if (!hasMega) {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "block py-3.5 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50",
                        rowBorder,
                      )}
                    >
                      {item.title}
                    </a>
                  );
                }

                return (
                  <div key={item.id} className={rowBorder}>
                    <button
                      onClick={() =>
                        setActiveAccordion(isAccordionOpen ? null : item.id)
                      }
                      aria-expanded={isAccordionOpen}
                      className="flex w-full items-center justify-between py-3.5 pr-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                    >
                      {item.title}
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 transition-transform duration-300",
                          isAccordionOpen && "rotate-180",
                        )}
                      />
                    </button>
                    <AnimatePresence>
                      {isAccordionOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{
                            height: "auto",
                            opacity: 1,
                            transition: {
                              height: {
                                duration: 0.3,
                                ease: [0.33, 1, 0.68, 1],
                              },
                              opacity: { duration: 0.2, ease: "easeOut" },
                            },
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                            transition: {
                              height: {
                                duration: 0.26,
                                ease: [0.65, 0, 0.35, 1],
                              },
                              opacity: { duration: 0.16, ease: "easeInOut" },
                            },
                          }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-1 pb-3">
                            {item.columns!.flat().map((link) => {
                              const Icon = link.icon;
                              return (
                                <a
                                  key={link.href}
                                  href={link.href}
                                  onClick={() => setIsOpen(false)}
                                  className="group block rounded-lg p-2 transition-colors hover:bg-neutral-100 active:bg-neutral-100 dark:hover:bg-neutral-900 dark:active:bg-neutral-900"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-sm bg-linear-to-b from-white to-neutral-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15),0_3px_10px_-6px_rgba(0,0,0,0.22)] dark:from-neutral-900 dark:to-neutral-950 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_0_rgba(255,255,255,0.08),0_6px_18px_-12px_rgba(0,0,0,0.5)]">
                                      <Icon className="size-4 text-neutral-500 group-hover:text-red-600 dark:text-neutral-300 dark:group-hover:text-red-500" />
                                    </div>
                                    <div className="flex min-w-0 flex-col gap-0.5">
                                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                        {link.title}
                                      </div>
                                      <div className="truncate text-xs text-neutral-600 dark:text-neutral-400">
                                        {link.description}
                                      </div>
                                    </div>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Header;

const HighlightCard = ({
  item,
  className,
  onClick,
}: {
  item: Highlight;
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <a
      href={item.href}
      onClick={onClick}
      className={cn("group flex flex-col", className)}
    >
      <div className="flex min-h-32 flex-1 items-center justify-center overflow-hidden rounded-md bg-neutral-50 text-neutral-900 ring-1 ring-neutral-200/70 transition-colors group-hover:ring-neutral-300/60 dark:bg-neutral-950 dark:text-neutral-100 dark:ring-neutral-800/60 dark:group-hover:ring-neutral-800">
        <HighlightArtwork art={item.art} />
      </div>
      <div className="pt-3 pb-2">
        <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
          {item.title}
        </h4>
        <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
          {item.description}
        </p>
      </div>
    </a>
  );
};

const HighlightArtwork = ({ art }: { art: HighlightArt }) => {
  const box = "h-auto w-full";
  const fillBg = "fill-neutral-50 dark:fill-neutral-950";
  const FAINT = 0.13,
    SOFT = 0.26,
    STRUCT = 0.38,
    ANCHOR = 0.55;

  if (art === "blocks") {
    const bw = 150,
      bh = 20,
      gap = 12,
      x = (288 - bw) / 2;
    const ops = [ANCHOR, SOFT, FAINT];
    let y = (140 - (3 * bh + 2 * gap)) / 2;
    const rows = ops.map((op) => {
      const ry = y;
      y += bh + gap;
      return { op, ry };
    });
    return (
      <svg
        aria-hidden
        viewBox="0 0 288 140"
        className={box}
        fill="none"
        stroke="currentColor"
      >
        {rows.map((r, i) => (
          <g key={i}>
            <rect
              x={x + 4}
              y={r.ry + 3}
              width={bw}
              height={bh}
              rx={5}
              strokeOpacity={FAINT}
              strokeWidth={1.25}
            />
            <rect
              x={x}
              y={r.ry}
              width={bw}
              height={bh}
              rx={5}
              className={fillBg}
              strokeOpacity={r.op}
              strokeWidth={1.5}
            />
            <line
              x1={x + 11}
              y1={r.ry + bh / 2}
              x2={x + 40}
              y2={r.ry + bh / 2}
              strokeOpacity={r.op}
              strokeWidth={1.5}
            />
          </g>
        ))}
      </svg>
    );
  }

  if (art === "showcase") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 288 140"
        className={box}
        fill="none"
        stroke="currentColor"
      >
        <rect
          x={105}
          y={16}
          width={118}
          height={82}
          rx={9}
          className={fillBg}
          strokeOpacity={FAINT}
          strokeWidth={1.4}
        />
        <rect
          x={85}
          y={32}
          width={118}
          height={82}
          rx={9}
          className={fillBg}
          strokeOpacity={SOFT}
          strokeWidth={1.4}
        />
        <rect
          x={65}
          y={48}
          width={118}
          height={82}
          rx={9}
          className={fillBg}
          strokeOpacity={ANCHOR}
          strokeWidth={1.5}
        />
        <rect
          x={76}
          y={59}
          width={96}
          height={22}
          rx={4}
          strokeOpacity={STRUCT}
          strokeWidth={1.5}
        />
        <line
          x1={76}
          y1={94}
          x2={172}
          y2={94}
          strokeOpacity={FAINT}
          strokeWidth={1.5}
        />
        <line
          x1={76}
          y1={105}
          x2={149}
          y2={105}
          strokeOpacity={FAINT}
          strokeWidth={1.5}
        />
        <line
          x1={76}
          y1={116}
          x2={161}
          y2={116}
          strokeOpacity={FAINT}
          strokeWidth={1.5}
        />
      </svg>
    );
  }

  if (art === "docs") {
    const w = 56,
      h = 74,
      fold = 13;
    const docPath = (x: number, y: number) =>
      `M ${x + 5} ${y} H ${x + w - fold} L ${x + w} ${y + fold} V ${y + h - 5} Q ${x + w} ${y + h} ${x + w - 5} ${y + h} H ${x + 5} Q ${x} ${y + h} ${x} ${y + h - 5} V ${y + 5} Q ${x} ${y} ${x + 5} ${y} Z`;
    const foldPath = (x: number, y: number) =>
      `M ${x + w - fold} ${y} V ${y + fold} H ${x + w}`;
    const layers = [
      { x: 130, y: 30, op: FAINT, content: false },
      { x: 108, y: 36, op: SOFT, content: false },
      { x: 86, y: 42, op: ANCHOR, content: true },
    ];
    return (
      <svg
        aria-hidden
        viewBox="0 0 288 140"
        className={box}
        fill="none"
        stroke="currentColor"
      >
        {layers.map((l, i) => (
          <g key={i}>
            <path
              d={docPath(l.x, l.y)}
              className={fillBg}
              strokeOpacity={l.op}
              strokeWidth={1.5}
            />
            <path d={foldPath(l.x, l.y)} strokeOpacity={l.op} strokeWidth={1.5} />
            {l.content &&
              [0, 1, 2].map((j) => (
                <line
                  key={j}
                  x1={l.x + 11}
                  y1={l.y + 30 + j * 12}
                  x2={l.x + w - 11 - (j === 2 ? 12 : 0)}
                  y2={l.y + 30 + j * 12}
                  strokeOpacity={FAINT}
                  strokeWidth={1.4}
                />
              ))}
          </g>
        ))}
      </svg>
    );
  }

  const sz = 58;
  const tiles: {
    cx: number;
    cy: number;
    a: number;
    op: number;
    glyph: boolean;
  }[] = [
    { cx: 148, cy: 70, a: 10, op: FAINT, glyph: false },
    { cx: 137, cy: 71, a: 5, op: SOFT, glyph: false },
    { cx: 126, cy: 72, a: -2, op: ANCHOR, glyph: true },
  ];
  return (
    <svg
      aria-hidden
      viewBox="0 0 288 140"
      className={box}
      fill="none"
      stroke="currentColor"
    >
      {tiles.map((tl, i) => (
        <g key={i} transform={`rotate(${tl.a} ${tl.cx} ${tl.cy})`}>
          <rect
            x={tl.cx - sz / 2}
            y={tl.cy - sz / 2}
            width={sz}
            height={sz}
            rx={10}
            className={fillBg}
            strokeOpacity={tl.op}
            strokeWidth={1.5}
          />
          {tl.glyph && (
            <>
              <circle
                cx={tl.cx}
                cy={tl.cy - 6}
                r={8}
                strokeOpacity={STRUCT}
                strokeWidth={1.5}
              />
              <line
                x1={tl.cx - 12}
                y1={tl.cy + 12}
                x2={tl.cx + 12}
                y2={tl.cy + 12}
                strokeOpacity={FAINT}
                strokeWidth={1.5}
              />
            </>
          )}
        </g>
      ))}
    </svg>
  );
};

const MyIcon = ({ className = "" }: { className?: string }) => (
  <svg
    width="70"
    height="70"
    viewBox="0 0 70 70"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M65.5869 52.0195C59.6064 62.7446 48.1517 70 35 70C28.4081 70 22.2428 68.1761 16.9785 65.0078C24.0411 65.0505 30.5152 64.4499 36.8809 63.0947C46.275 61.0948 55.321 57.476 65.5869 52.0195Z"
      fill="currentColor"
    />
    <path
      d="M69.9023 37.6084C69.7246 40.0209 69.3033 42.3653 68.6611 44.6172C56.2627 51.6688 46.1988 55.9988 35.8398 58.2041C27.9699 59.8795 19.8406 60.3467 10.2822 59.7793C8.48159 57.9831 6.87607 55.9917 5.49902 53.8398C17.5379 55.0275 27.6247 54.6653 37.4609 52.3047C48.0044 49.7743 58.1043 44.9844 69.9023 37.6084Z"
      fill="currentColor"
    />
    <path
      d="M35 0C53.225 0 68.1937 13.9301 69.8457 31.7236C57.1262 39.9078 46.8552 44.9089 36.2949 47.4434C26.3045 49.841 15.895 50.0686 2.70117 48.5059C0.961337 44.35 0 39.7873 0 35C0 15.67 15.67 0 35 0Z"
      fill="currentColor"
    />
  </svg>
);

const Logo = () => {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2">
      <MyIcon className="size-5 text-black dark:text-white" />
      <span className="text-xl font-bold text-black dark:text-white">
        UGC
      </span>
    </Link>
  );
};
