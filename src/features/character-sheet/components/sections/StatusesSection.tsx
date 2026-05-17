import { Card, StatusTierBar } from "@/shared/ui";

const helpful = [
  { label: "Inspired", tier: 3 },
  { label: "Sheltered", tier: 1 },
  { label: "Forewarned", tier: 2 },
] as const;

const hindering = [
  { label: "Wounded", tier: 2 },
  { label: "Hunted", tier: 4 },
  { label: "Exhausted", tier: 1 },
] as const;

export function StatusesSection() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <Card.Header title="Helpful statuses" />
        <Card.Body className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {helpful.map((s) => (
            <StatusTierBar
              key={s.label}
              label={s.label}
              tier={s.tier}
              polarity="helpful"
            />
          ))}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header title="Hindering statuses" />
        <Card.Body className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hindering.map((s) => (
            <StatusTierBar
              key={s.label}
              label={s.label}
              tier={s.tier}
              polarity="hindering"
            />
          ))}
        </Card.Body>
      </Card>
    </div>
  );
}
