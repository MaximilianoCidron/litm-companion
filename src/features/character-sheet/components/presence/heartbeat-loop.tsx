"use client";
import { useEffect } from "react";
import { pingPresence } from "../../actions";
import { usePresenceStore } from "../../stores/presence";

const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Side-effect-only component. Mount once in the authenticated app shell.
 * Reads context (current campaign/character) from the presence store and
 * pings every 30s. Context changes trigger an immediate ping via the
 * effect dep array — so navigation propagates within seconds, not minutes.
 *
 * Errors are best-effort: a missed heartbeat just means the user appears
 * offline ~75s sooner — recoverable on the next tick.
 */
export function HeartbeatLoop() {
  const campaignId = usePresenceStore((s) => s.currentCampaignId);
  const characterId = usePresenceStore((s) => s.currentCharacterId);

  useEffect(() => {
    let cancelled = false;
    const ping = () => {
      if (cancelled) return;
      pingPresence({ campaignId, characterId }).catch((err) => {
        console.debug("[presence] heartbeat failed", err);
      });
    };
    ping();
    const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [campaignId, characterId]);

  return null;
}
