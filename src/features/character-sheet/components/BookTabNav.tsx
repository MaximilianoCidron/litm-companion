"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Backpack,
  BookOpen,
  History,
  Leaf,
  Scroll,
  Users,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";

type Section = {
  key:
    | "hero"
    | "themes"
    | "backpack"
    | "fellowship"
    | "statuses"
    | "history";
  label: string;
  Icon: typeof Scroll;
};

const sections: Section[] = [
  { key: "hero", label: "Hero", Icon: Scroll },
  { key: "themes", label: "Themes", Icon: BookOpen },
  { key: "backpack", label: "Pack", Icon: Backpack },
  { key: "fellowship", label: "Fellowship", Icon: Users },
  { key: "statuses", label: "Status", Icon: Leaf },
  { key: "history", label: "History", Icon: History },
];

export function BookTabNav({ charId }: { charId: string }) {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Character sheet sections"
      className="hidden shrink-0 flex-col md:flex md:w-14"
    >
      {sections.map(({ key, label, Icon }) => {
        const href = `/characters/${charId}/${key}`;
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 min-h-32 flex-col items-center justify-center gap-2 rounded-l-md border-b border-ink-base/20 px-1 py-3 font-display text-sm transition-transform",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-inset",
              isActive
                ? "translate-x-0 bg-parchment text-ink-base dark:bg-ink dark:text-parchment-base"
                : "bg-ink-muted text-parchment-elevated shadow-[inset_-6px_0_8px_-6px_rgba(0,0,0,0.25)] hover:translate-x-0.5",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="rotate-180 tracking-wide [writing-mode:vertical-rl]">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
