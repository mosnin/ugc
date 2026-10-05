import Link from "next/link";
const CallToAction = () => {
  return (
    <section className="px-4 py-16 md:py-28">
      <div className="mx-auto max-w-2xl px-2">
        <div className="space-y-8 text-center">
          <div className="space-y-2">
            <h2 className="bg-linear-to-br from-neutral-500 via-neutral-700 to-neutral-950 bg-clip-text pb-1 text-3xl font-semibold tracking-tight text-balance text-transparent md:text-4xl dark:from-neutral-100 dark:via-neutral-100 dark:to-neutral-100/30">
              Put your channel on autopilot.
            </h2>
            <p className="text-[13px] text-balance text-neutral-600 sm:text-[15px] dark:text-neutral-400">
              UGC writes, renders, and posts faceless videos while you sleep.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <Link
              href="/sign-up"
              className="inline-flex cursor-pointer items-center justify-center rounded-full bg-linear-to-b from-red-500 to-red-600 px-6 py-3 text-sm font-medium text-white shadow-[inset_0_1.25px_0_0_rgba(255,255,255,0.25),0_6px_18px_-6px_rgba(220,38,38,0.55)] transition-all duration-150 hover:brightness-110"
            >
              Start free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
