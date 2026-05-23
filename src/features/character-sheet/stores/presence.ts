"use client";
import { create } from "zustand";
import type { CampaignId, CharacterId } from "../schemas";

interface PresenceStoreState {
  currentCampaignId: CampaignId | null;
  currentCharacterId: CharacterId | null;
  setCurrentCampaign(id: CampaignId | null): void;
  setCurrentCharacter(id: CharacterId | null): void;
}

export const usePresenceStore = create<PresenceStoreState>((set) => ({
  currentCampaignId: null,
  currentCharacterId: null,
  setCurrentCampaign: (id) => set({ currentCampaignId: id }),
  setCurrentCharacter: (id) => set({ currentCharacterId: id }),
}));
