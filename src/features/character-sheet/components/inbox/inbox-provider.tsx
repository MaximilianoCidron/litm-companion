"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { updateUserSettings } from "../../actions";
import {
  buildInboxItems,
  countUnread,
  type InboxItem,
} from "../../lib/inbox";
import { useIncomingInvitations } from "../../hooks/use-incoming-invitations";
import {
  useInboxCampaignPendingThreats,
  type InboxCampaign,
} from "../../hooks/use-inbox-campaign-pending-threats";
import { useUserSettings } from "../UserSettingsProvider";

interface InboxContextValue {
  items: InboxItem[];
  unreadCount: number;
  markAllSeen: () => Promise<void>;
}

const InboxContext = createContext<InboxContextValue>({
  items: [],
  unreadCount: 0,
  markAllSeen: async () => {},
});

interface InboxProviderProps {
  uid: string;
  campaigns: readonly InboxCampaign[];
  children: ReactNode;
}

/**
 * Composes the live invitation listener + per-campaign pending-threat
 * listeners, then derives a single ordered InboxItem[] + an unreadCount
 * driven by `userSettings.lastInboxOpenedAt`. `markAllSeen()` writes a
 * fresh timestamp through `updateUserSettings`; no success toast (opening
 * the inbox shouldn't surface UX noise).
 */
export function InboxProvider({ uid, campaigns, children }: InboxProviderProps) {
  const settings = useUserSettings();
  const callAction = useActionWithToast();

  const invitations = useIncomingInvitations(uid);
  const { threatsForMe, allocationsForMe } = useInboxCampaignPendingThreats(
    uid,
    campaigns,
  );

  const items = useMemo(
    () =>
      buildInboxItems({
        invitations,
        threatsForMe,
        allocationsForMe,
      }),
    [invitations, threatsForMe, allocationsForMe],
  );

  const unreadCount = useMemo(
    () => countUnread(items, settings.lastInboxOpenedAt),
    [items, settings.lastInboxOpenedAt],
  );

  const markAllSeen = useCallback(async () => {
    await callAction(
      updateUserSettings({
        patch: { lastInboxOpenedAt: new Date().toISOString() },
      }),
    );
  }, [callAction]);

  const value = useMemo(
    () => ({ items, unreadCount, markAllSeen }),
    [items, unreadCount, markAllSeen],
  );

  return (
    <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
  );
}

export function useInbox(): InboxContextValue {
  return useContext(InboxContext);
}
