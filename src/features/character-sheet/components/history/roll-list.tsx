"use client";

import { useRollBuilder } from "../../stores/roll-builder";
import { RollListRow } from "./roll-list-row";
import type { RollRecord } from "../../schemas";

interface RollListProps {
  rolls: readonly RollRecord[];
}

export function RollList({ rolls }: RollListProps) {
  const openResultDialog = useRollBuilder((s) => s.openResultDialog);
  return (
    <ul className="divide-y divide-mist-light overflow-hidden rounded-lg border border-mist-light bg-parchment-elevated dark:divide-mist-dark dark:border-mist-dark dark:bg-ink-elevated">
      {rolls.map((roll) => (
        <li key={roll.id}>
          <RollListRow
            roll={roll}
            onOpen={() => openResultDialog(roll.id, false)}
          />
        </li>
      ))}
    </ul>
  );
}
