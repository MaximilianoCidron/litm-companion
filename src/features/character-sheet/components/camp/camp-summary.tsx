import type { CampForecast } from "./helpers";

interface CampSummaryProps {
  forecast: CampForecast;
  activity: "rest" | "reflect" | "campAction";
}

export function CampSummary({ forecast, activity }: CampSummaryProps) {
  const lines: string[] = [];
  lines.push(
    `${forecast.powerTagsRefreshed} power tag${forecast.powerTagsRefreshed === 1 ? "" : "s"} refresh`,
  );
  if (activity === "rest") {
    lines.push(
      `${forecast.hinderingStatusesCleared} hindering status${forecast.hinderingStatusesCleared === 1 ? "" : "es"} clear`,
    );
  }
  if (activity === "reflect" && forecast.improveThemeName) {
    lines.push(`+1 Improve on "${forecast.improveThemeName}"`);
  }
  lines.push(
    `${forecast.storyTagsDiscarded} story tag${forecast.storyTagsDiscarded === 1 ? "" : "s"} discarded`,
  );

  return (
    <div className="rounded-lg border border-mist-light bg-parchment-soft p-3 dark:border-mist-dark dark:bg-ink-soft">
      <p className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
        When you make camp
      </p>
      <ul className="mt-1 flex flex-col gap-0.5 text-sm text-ink-base dark:text-parchment-base">
        {lines.map((line, i) => (
          <li key={i} className="flex items-center gap-2">
            <span aria-hidden="true">·</span>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
