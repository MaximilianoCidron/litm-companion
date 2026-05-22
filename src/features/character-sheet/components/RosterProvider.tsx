// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { Character } from "../schemas";

const RosterContext = createContext<Character[] | null>(null);

interface RosterProviderProps {
  characters: Character[];
  children: ReactNode;
}

/**
 * Holds the campaign's full roster fetched once on the server. Reads only —
 * mutations go through the kick action which updates the campaign doc; the
 * CampaignProvider listener then re-renders the roster card list using its
 * own (lighter) summary data. The full Character objects here are used by
 * `<RosterView>` to show statuses + promise tracks at a glance.
 */
export function RosterProvider({ characters, children }: RosterProviderProps) {
  return (
    <RosterContext.Provider value={characters}>
      {children}
    </RosterContext.Provider>
  );
}

export function useRoster(): Character[] {
  const ctx = useContext(RosterContext);
  if (ctx === null) {
    throw new Error("useRoster must be used inside <RosterProvider>.");
  }
  return ctx;
}
