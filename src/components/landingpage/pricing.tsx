import Link from "next/link";
import { IoCheckmark } from "react-icons/io5";
import { LuArrowRight } from "react-icons/lu";
import SectionHeader from "./section-header";

const PRO_FEATURES = [
  "Up to 5 connected channels",
  "TikTok, Reels, Shorts, and more",
  "AI scripts, hooks & voiceovers",
  "Faceless b-roll & auto-captions",
  "Auto-posting & content calendar",
  "Advanced metrics & hook testing",
];

const TEAM_FEATURES = [
  "Everything in the Creator plan",
  "Unlimited channels & brands",
  "Client workspaces & approvals",
  "Custom voices & style presets",
  "Priority rendering queue",
  "Dedicated success manager",
];

const Pricing = () => {
  return (
    <section id="pricing" className="w-full px-4 py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          title="One plan, every channel"
          description="Try every feature free for 7 days. No card required."
          className="mb-4"
        />

        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="flex flex-col rounded-2xl bg-neutral-100/80 p-6 sm:p-8 md:col-span-2 dark:bg-neutral-900/55">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                $49
              </span>
              <span className="mb-1 text-xs leading-tight text-neutral-500 dark:text-neutral-400">
                per workspace
                <br />
                per month, billed annually
              </span>
            </div>

            <p className="mt-6 max-w-xs text-base text-neutral-500 dark:text-neutral-400">
              Everything UGC does, from your first hook to auto-posting, in one
              simple plan.
            </p>

            <ul className="mt-6 space-y-3">
              {PRO_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2.5 text-sm font-medium text-neutral-900 dark:text-neutral-100"
                >
                  <IoCheckmark className="size-4 shrink-0 text-red-600 dark:text-red-500" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <Link
                href="/sign-up"
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-linear-to-b from-red-500 to-red-600 px-6 py-3 text-sm font-medium text-white shadow-[inset_0_1.25px_0_0_rgba(255,255,255,0.25),0_3px_10px_-6px_rgba(220,38,38,0.35)] transition-all duration-150 hover:brightness-110"
              >
                Start free trial
                <LuArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl bg-neutral-100/80 p-6 sm:p-8 md:col-span-1 dark:bg-neutral-900/55">
            <span className="text-xs font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
              Agency
            </span>
            <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
              For agencies running many channels, brands, and clients:
            </p>

            <ul className="mt-5 space-y-3">
              {TEAM_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm font-medium text-neutral-900 dark:text-neutral-100"
                >
                  <IoCheckmark className="mt-0.5 size-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
                  <span className="leading-snug">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <Link
                href="mailto:hello@ugc.app"
                className="flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-900 shadow-xs ring-1 shadow-black/5 ring-neutral-300/70 transition-all ring-inset hover:bg-neutral-50 dark:bg-neutral-950 dark:text-white dark:shadow-none dark:ring-neutral-800 dark:hover:bg-neutral-900"
              >
                Talk to sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
