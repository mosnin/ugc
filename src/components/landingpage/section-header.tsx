import { cn } from "@/lib/utils";

const SectionHeader = ({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) => {
  return (
    <div className={cn("space-y-1 text-center", className)}>
      <h2 className="bg-linear-to-br from-neutral-500 via-neutral-700 to-neutral-950 bg-clip-text pb-1 text-3xl font-semibold tracking-tight text-balance text-transparent md:text-4xl dark:from-neutral-100 dark:via-neutral-100 dark:to-neutral-100/30">
        {title}
      </h2>
      <p className="text-[13px] text-balance text-neutral-600 sm:text-[15px] dark:text-neutral-400">
        {description}
      </p>
    </div>
  );
};

export default SectionHeader;
