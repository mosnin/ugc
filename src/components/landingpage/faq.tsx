"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import SectionHeader from "./section-header";

interface FAQItemData {
  question: string;
  answer: string;
}

const Faqs: FAQItemData[] = [
  {
    question: "Do I need to show my face or use my voice?",
    answer:
      "No. Every video is faceless: AI voiceovers, stock and generated b-roll, and animated captions. You never record anything.",
  },
  {
    question: "Which platforms can UGC post to?",
    answer:
      "TikTok, Instagram Reels, YouTube Shorts, and Facebook out of the box. Connect each account once and UGC publishes in the right format for each one.",
  },
  {
    question: "How do content styles and channel themes work?",
    answer:
      "A style sets how your videos look and sound: captions, voice, pacing, and visuals. A theme sets what they are about. Pick both once, and every video in the series follows them.",
  },
  {
    question: "Can I review videos before they post?",
    answer:
      "Yes. Run fully on autopilot, or turn on approvals so each video waits in your queue until you sign off.",
  },
  {
    question: "What do the advanced metrics track?",
    answer:
      "Views, watch time, retention, follower growth, and how each hook performs, per video and per channel. UGC uses the winners to shape the next batch.",
  },
];

const Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <SectionHeader
          title="Answers, before you ask"
          description="Everything you need to know about UGC"
        />

        <div className="mt-8 space-y-1.5 rounded-xl bg-neutral-100 p-1.5 dark:bg-neutral-900/60">
          {Faqs.map((item, i) => (
            <FAQItem
              key={i}
              index={i}
              openIndex={openIndex}
              setOpenIndex={setOpenIndex}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Still have questions?{" "}
          <a
            href="mailto:hello@ugc.app"
            className="font-medium text-red-600 underline-offset-4 hover:underline dark:text-red-500"
          >
            Get in touch
          </a>
        </p>
      </div>
    </section>
  );
};

export default Faq;

function FAQItem({
  index,
  openIndex,
  setOpenIndex,
  question,
  answer,
}: {
  index: number;
  openIndex: number | null;
  setOpenIndex: (i: number | null) => void;
  question: string;
  answer: string;
}) {
  const isOpen = openIndex === index;

  return (
    <div className="rounded-[11px] bg-white px-4 shadow-sm shadow-black/5 sm:px-5 dark:bg-black dark:shadow-none">
      <button
        onClick={() => setOpenIndex(isOpen ? null : index)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-foreground text-[15px] leading-snug font-medium">
          {question}
        </span>

        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          <span className="relative size-3">
            <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current" />
            <span
              className={cn(
                "absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current transition-transform duration-300",
                isOpen ? "rotate-0" : "rotate-90",
              )}
            />
          </span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="text-muted-foreground pb-4 text-sm leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
