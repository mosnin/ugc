"use client";

import Link from "next/link";
import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
} from "motion/react";
import Image from "next/image";
import { LuChevronRight } from "react-icons/lu";

const HeroSection = () => {
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);
  const glowLight = useMotionTemplate`radial-gradient(750px circle at ${glowX}px ${glowY}px, rgba(220,38,38,0.9), transparent 60%)`;
  const glowDark = useMotionTemplate`radial-gradient(750px circle at ${glowX}px ${glowY}px, rgba(220,38,38,0.5), transparent 65%)`;

  const handleGlowMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    glowX.set(e.clientX - rect.left);
    glowY.set(e.clientY - rect.top);
  };

  return (
    <section className="relative w-full overflow-hidden bg-white dark:bg-black">
      <div className="relative mx-auto max-w-6xl px-3 pt-28 pb-12 md:pt-36 lg:px-5">
        <div className="mx-auto max-w-3xl text-center">
          <a
            href="#product"
            className="group inline-flex items-center gap-2 rounded-full bg-neutral-100 py-1 pr-3 pl-1 text-sm text-neutral-600 ring-1 ring-neutral-200 transition-colors hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-800 dark:hover:bg-neutral-800/60"
          >
            <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-1 text-[11px] leading-none font-semibold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_1px_2px_0_rgba(153,27,27,0.55)]">
              New
            </span>
            Auto-posting to TikTok, Reels &amp; Shorts
            <LuChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>

          <h1 className="mx-auto mt-7 max-w-2xl text-4xl leading-[1.06] font-bold tracking-tight text-balance text-neutral-900 sm:text-6xl lg:text-7xl dark:text-white">
            Your whole{" "}
            <span className="whitespace-nowrap">
              <TikTokMark className="mr-[0.18em] inline-block h-[0.72em] w-[0.63em] translate-y-[-0.04em] align-middle" />
              channel,
            </span>{" "}
            on autopilot.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-balance text-neutral-500 sm:text-lg dark:text-neutral-400">
            Pick your content style and channel theme once. UGC writes, voices,
            renders, and posts faceless videos while you sleep, then shows you
            exactly what is working.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="group inline-flex items-center rounded-full bg-linear-to-b from-red-500 to-red-600 px-5 py-3 text-sm font-medium text-white shadow-[inset_0_1.25px_0_0_rgba(255,255,255,0.25),0_3px_10px_-6px_rgba(220,38,38,0.35)] transition-all duration-150 hover:brightness-110"
            >
              Start your channel
            </Link>
            <a
              href="#product"
              className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-5 py-3 text-sm font-medium text-neutral-900 ring-1 ring-neutral-200 transition-colors hover:bg-neutral-200/70 dark:bg-neutral-900 dark:text-white dark:ring-neutral-800 dark:hover:bg-neutral-800/70"
            >
              See how it works
            </a>
          </div>
        </div>

        <div className="relative z-10 mt-14 md:mt-20">
          <MagneticContainer>
            <div
              onMouseMove={handleGlowMove}
              className="group relative rounded-2xl bg-neutral-500/4 p-2 ring-1 ring-black/6 dark:bg-white/3 dark:ring-white/6"
            >
              <motion.div
                aria-hidden="true"
                style={{ background: glowLight }}
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:hidden"
              />
              <motion.div
                aria-hidden="true"
                style={{ background: glowDark }}
                className="pointer-events-none absolute inset-0 hidden rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:block"
              />
              <div className="relative aspect-2300/1374 overflow-hidden rounded-xl ring-1 ring-black/10 dark:shadow-[0_50px_100px_-40px_rgba(0,0,0,0.9)] dark:ring-white/10">
                <Image
                  src="/heroimage-ugc.png"
                  alt="The UGC workspace"
                  width={2300}
                  height={1616}
                  priority
                  className="h-auto w-full"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-linear-to-t from-black to-transparent"
                />
              </div>
            </div>
          </MagneticContainer>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

function TikTokMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 290" fill="none" className={className} aria-hidden>
      <path
        fill="#25F4EE"
        d="M189.72 104.42a114.36 114.36 0 0 0 66.65 21.31V77.98a67.47 67.47 0 0 1-14-1.47v37.6a114.39 114.39 0 0 1-66.65-21.32v97.55c0 48.8-39.58 88.36-88.4 88.36a87.96 87.96 0 0 1-49.2-14.95 88.13 88.13 0 0 0 63.2 26.6c48.83 0 88.41-39.56 88.41-88.36v-97.57Zm17.27-48.21a66.6 66.6 0 0 1-17.27-39.03V11h-13.27a67 67 0 0 0 30.54 45.2ZM68.94 226.31a40.32 40.32 0 0 1-8.24-24.5c0-22.33 18.11-40.43 40.45-40.43a40.48 40.48 0 0 1 12.27 1.9v-48.87a89.07 89.07 0 0 0-14-.8v38.03a40.48 40.48 0 0 0-12.27-1.9c-22.34 0-40.45 18.1-40.45 40.43 0 15.79 9.05 29.46 22.24 36.14Z"
      />
      <path
        fill="currentColor"
        className="text-neutral-900 dark:text-white"
        d="M175.72 92.79a114.39 114.39 0 0 0 66.65 21.32V76.5a66.9 66.9 0 0 1-35.38-20.3A67 67 0 0 1 176.45 11h-34.89v190.8c-.08 22.25-18.15 40.26-40.44 40.26a40.4 40.4 0 0 1-32.18-15.75c-13.19-6.68-22.24-20.35-22.24-36.14 0-22.33 18.11-40.43 40.45-40.43 4.28 0 8.4.66 12.27 1.9v-38.03c-47.98.99-86.56 40.17-86.56 88.34a88.07 88.07 0 0 0 25.2 61.73 87.96 87.96 0 0 0 49.2 14.95c48.82 0 88.4-39.56 88.4-88.36V92.79Z"
      />
      <path
        fill="#FE2C55"
        d="M242.37 76.5V66.33a66.65 66.65 0 0 1-35.38-10.12 66.83 66.83 0 0 0 35.38 20.3ZM176.45 11a68.16 68.16 0 0 1-.73-5.49V0h-48.17v190.8c-.08 22.24-18.15 40.25-40.44 40.25a40.37 40.37 0 0 1-18.2-4.31 40.4 40.4 0 0 0 32.18 15.75c22.29 0 40.36-18 40.44-40.26V11h34.92ZM99.33 113.53v-10.83a89.38 89.38 0 0 0-12.13-.82C38.38 101.88-1.2 141.44-1.2 190.24c0 30.6 15.56 57.56 39.2 73.42a88.07 88.07 0 0 1-25.2-61.73c0-48.17 38.58-87.35 86.56-88.34Z"
      />
    </svg>
  );
}

type MagneticContainerProps = {
  children: React.ReactNode;
  strength?: number;
};

function MagneticContainer({
  children,
  strength = 34,
}: MagneticContainerProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = {
    stiffness: 60,
    damping: 20,
    mass: 0.6,
  };

  const mouseX = useSpring(x, springConfig);
  const mouseY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    if (window.innerWidth < 768) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - (rect.left + rect.width / 2);
    const offsetY = e.clientY - (rect.top + rect.height / 2);

    const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

    x.set(clamp(offsetX / strength, 18));
    y.set(clamp(offsetY / strength, 18));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: mouseX, y: mouseY }}
    >
      {children}
    </motion.div>
  );
}
