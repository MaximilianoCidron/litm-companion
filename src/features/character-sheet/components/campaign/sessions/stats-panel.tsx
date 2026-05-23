"use client";

import type {
  CharacterSessionStats,
  SessionStats,
  TierDistribution as TierDist,
} from "../../../lib/queries";

interface StatsPanelProps {
  stats: SessionStats;
  characterStats: readonly CharacterSessionStats[];
}

export function StatsPanel({ stats, characterStats }: StatsPanelProps) {
  const hasRolls = stats.rollCount > 0;
  const hasChars = characterStats.some((c) => c.rollCount > 0);
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-mist-light bg-parchment-elevated p-4 dark:border-mist-dark dark:bg-ink-elevated">
      <h2 className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
        Stats
      </h2>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <StatCount label="rolls" value={stats.rollCount} />
        <StatCount label="MoFs" value={stats.momentOfFulfillmentCount} />
        <StatCount label="threats" value={stats.deliverThreatCount} />
        <StatCount label="camp actions" value={stats.campActionCount} />
        <StatCount label="advancements" value={stats.themeAdvancementCount} />
        <StatCount label="annotations" value={stats.annotationCount} />
      </div>

      {hasRolls ? (
        <div>
          <h3 className="mb-2 font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Tier distribution
          </h3>
          <TierDistribution
            dist={stats.tierDistribution}
            total={stats.rollCount}
          />
        </div>
      ) : null}

      {hasChars ? (
        <div>
          <h3 className="mb-2 font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Per-character rolls
          </h3>
          <PerCharacterRolls stats={characterStats} />
        </div>
      ) : null}
    </section>
  );
}

function StatCount({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="numeric font-display text-lg text-ink-base dark:text-parchment-base">
        {value}
      </span>
      <span className="ml-1 text-xs text-ink-muted dark:text-parchment-muted">
        {label}
      </span>
    </div>
  );
}

const TIER_ROWS: {
  key: keyof TierDist;
  label: string;
  color: string;
}[] = [
  { key: "success", label: "Success", color: "bg-moss" },
  { key: "mixed", label: "Mixed", color: "bg-tag-power-base" },
  { key: "failure", label: "Failure", color: "bg-rust" },
  { key: "reaction", label: "Reaction", color: "bg-ember" },
];

function TierDistribution({
  dist,
  total,
}: {
  dist: TierDist;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {TIER_ROWS.map(({ key, label, color }) => {
        const count = dist[key];
        const pct = total === 0 ? 0 : Math.round((count / total) * 100);
        return (
          <div key={key} className="flex items-center gap-3 text-xs">
            <span className="w-16 text-ink-muted dark:text-parchment-muted">
              {label}
            </span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-mist-light dark:bg-mist-dark">
              <div
                className={`h-full ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="numeric w-16 text-right text-ink-base dark:text-parchment-base">
              {count} ({pct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PerCharacterRolls({
  stats,
}: {
  stats: readonly CharacterSessionStats[];
}) {
  const max = Math.max(...stats.map((s) => s.rollCount), 1);
  return (
    <div className="flex flex-col gap-1.5">
      {stats.map((s) => {
        const pct = (s.rollCount / max) * 100;
        return (
          <div key={s.characterId} className="flex items-center gap-3 text-xs">
            <span className="w-24 truncate text-ink-base dark:text-parchment-base">
              {s.characterName}
            </span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-mist-light dark:bg-mist-dark">
              <div
                className="h-full bg-ember"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="numeric w-10 text-right text-ink-muted dark:text-parchment-muted">
              {s.rollCount}
            </span>
          </div>
        );
      })}
    </div>
  );
}
