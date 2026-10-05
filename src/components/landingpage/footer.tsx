import Link from "next/link";
import { FaXTwitter, FaLinkedin, FaGithub } from "react-icons/fa6";

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#product" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "mailto:hello@ugc.app" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help center", href: "#" },
      { label: "Community", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "DPA", href: "/dpa" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
];

const socials = [
  { icon: <FaXTwitter />, href: "#", label: "Twitter" },
  { icon: <FaLinkedin />, href: "#", label: "LinkedIn" },
  { icon: <FaGithub />, href: "#", label: "GitHub" },
];

const BrandMark = () => (
  <svg
    width="70"
    height="70"
    viewBox="0 0 70 70"
    fill="none"
    className="size-5 text-neutral-900 dark:text-neutral-100"
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

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-neutral-200/80 px-2 py-12 sm:px-4 dark:border-neutral-900">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex max-w-xs flex-col">
            <Link href="/" className="flex w-fit items-center gap-2">
              <BrandMark />
              <span className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                UGC
              </span>
            </Link>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              Faceless content that posts itself.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-10 sm:grid-cols-4 lg:gap-x-16">
            {footerLinks.map((section) => (
              <div key={section.title} className="flex flex-col">
                <h4 className="mb-4 text-sm text-neutral-900 dark:text-neutral-100">
                  {section.title}
                </h4>
                <div className="flex flex-col gap-3">
                  {section.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="group w-fit text-xs text-neutral-500 transition-colors hover:text-neutral-900 md:text-sm dark:hover:text-neutral-200"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-neutral-900 transition-all duration-300 group-hover:w-full dark:bg-neutral-200" />
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-dashed border-neutral-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800/80">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            © 2026 UGC. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 w-full overflow-hidden">
          <svg
            aria-hidden="true"
            viewBox="0 0 1000 210"
            preserveAspectRatio="xMidYMid meet"
            className="h-auto w-full select-none mask-[linear-gradient(to_bottom,black_60%,transparent_98%)]"
          >
            <text
              x="500"
              y="110"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="250"
              fontWeight="800"
              letterSpacing="-8"
              fill="none"
              strokeWidth="1"
              className="stroke-neutral-300 dark:stroke-neutral-700"
            >
              UGC
            </text>
          </svg>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
