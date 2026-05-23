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

const sections = [
  { key: "hero", label: "Hero", Icon: Scroll },
  { key: "themes", label: "Themes", Icon: BookOpen },
  { key: "backpack", label: "Pack", Icon: Backpack },
  { key: "fellowship", label: "Fellow", Icon: Users },
  { key: "statuses", label: "Status", Icon: Leaf },
  { key: "history", label: "Rolls", Icon: History },
] as const;

export function BookTabBarMobile({ charId }: { charId: string }) {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Character sheet sections"
      className="flex w-full gap-2 overflow-x-auto bg-ink-muted px-4 py-2 md:hidden"
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
              "inline-flex h-11 shrink-0 items-center gap-2 rounded px-3 font-display text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember",
              isActive
                ? "bg-parchment text-ink-base dark:bg-ink dark:text-parchment-base"
                : "text-parchment-elevated hover:bg-parchment-elevated/10",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
