"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  SiBluesky,
  SiDiscord,
  SiDropbox,
  SiElevenlabs,
  SiEtsy,
  SiFacebook,
  SiGoogledrive,
  SiGumroad,
  SiInstagram,
  SiKick,
  SiNotion,
  SiPatreon,
  SiPinterest,
  SiReddit,
  SiShopify,
  SiSnapchat,
  SiSpotify,
  SiTelegram,
  SiThreads,
  SiTiktok,
  SiTwitch,
  SiX,
  SiYoutube,
  SiYoutubeshorts,
} from "react-icons/si";

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

type App = {
  Icon?: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  color?: string;
  custom?: React.ReactNode;
};

const APPS: App[] = [
  { Icon: SiSpotify, color: "#1db954" },
  { Icon: SiTwitch, color: "#9146ff" },
  { Icon: SiReddit, color: "#ff4500" },
  { Icon: SiInstagram, color: "#e4405f" },
  { Icon: SiYoutube, color: "#ff0000" },
  { Icon: SiPinterest, color: "#bd081c" },
  { Icon: SiNotion },
  { Icon: SiFacebook, color: "#0866ff" },
  { Icon: SiTiktok },
  { Icon: SiYoutubeshorts, color: "#ff0033" },
  { Icon: SiDropbox, color: "#0061ff" },
  { Icon: SiSnapchat, color: "#fffc00" },
  { Icon: SiX },
  { Icon: SiThreads },
  { Icon: SiShopify, color: "#7ab55c" },
  { Icon: SiElevenlabs },
  { Icon: SiDiscord, color: "#5865f2" },
  { Icon: SiTelegram, color: "#26a5e4" },
  { Icon: SiBluesky, color: "#0285ff" },
  { Icon: SiKick, color: "#53fc18" },
  { Icon: SiPatreon },
  { Icon: SiEtsy, color: "#f16521" },
  { Icon: SiGumroad, color: "#ff90e8" },
  { Icon: SiGoogledrive, color: "#4285f4" },
];

const IntegrationWall = () => {
  return (
    <FitScale width={460} height={300}>
      <div className="relative h-full w-full overflow-hidden">
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: "1400px" }}
        >
          <div
            className="grid grid-cols-6 gap-4"
            style={{ transform: "rotateX(36deg) rotateZ(12deg) scale(1.02)" }}
          >
            {APPS.map((a, i) => {
              const Icon = a.Icon;
              return (
                <div
                  key={i}
                  className="flex size-16 items-center justify-center rounded-2xl bg-linear-to-b from-white to-neutral-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_0_0_1px_rgba(0,0,0,0.08),0_18px_22px_-8px_rgba(0,0,0,0.08)] dark:from-[#1e1e1e] dark:to-[#161616] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_0_0_0_1px_rgba(255,255,255,0.06),0_18px_32px_-10px_rgba(0,0,0,0.75)]"
                >
                  {a.custom
                    ? a.custom
                    : Icon && (
                        <Icon
                          className={`size-7 ${a.color ? "" : "text-neutral-800 dark:text-neutral-100"}`}
                          style={a.color ? { color: a.color } : undefined}
                        />
                      )}
                </div>
              );
            })}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-[linear-gradient(to_bottom,var(--color-white),transparent)] dark:bg-[linear-gradient(to_bottom,var(--color-black),transparent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-[linear-gradient(to_top,var(--color-white),transparent)] dark:bg-[linear-gradient(to_top,var(--color-black),transparent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-[linear-gradient(to_right,var(--color-white),transparent)] dark:bg-[linear-gradient(to_right,var(--color-black),transparent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-[linear-gradient(to_left,var(--color-white),transparent)] dark:bg-[linear-gradient(to_left,var(--color-black),transparent)]"
        />
      </div>
    </FitScale>
  );
};

export default IntegrationWall;
