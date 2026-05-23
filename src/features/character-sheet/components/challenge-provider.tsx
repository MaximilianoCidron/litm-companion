"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useChallengeSnapshot } from "../hooks/use-challenge-snapshot";
import type { Challenge } from "../schemas";

interface ChallengeContextValue {
  challenge: Challenge;
  error: Error | null;
}

const ChallengeContext = createContext<ChallengeContextValue | null>(null);

interface ChallengeProviderProps {
  initial: Challenge;
  children: ReactNode;
}

export function ChallengeProvider({ initial, children }: ChallengeProviderProps) {
  const state = useChallengeSnapshot(initial.campaignId, initial.id, initial);
  return (
    <ChallengeContext.Provider
      value={{ challenge: state.challenge, error: state.error }}
    >
      {children}
    </ChallengeContext.Provider>
  );
}

export function useChallenge(): ChallengeContextValue {
  const ctx = useContext(ChallengeContext);
  if (!ctx) {
    throw new Error("useChallenge must be used inside <ChallengeProvider>.");
  }
  return ctx;
}
