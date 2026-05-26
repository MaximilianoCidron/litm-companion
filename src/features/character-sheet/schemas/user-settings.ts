import { z } from "zod";

export const ThemePreferenceSchema = z.enum(["light", "dark", "system"]);
export type ThemePreference = z.infer<typeof ThemePreferenceSchema>;

export const UserSettingsSchema = z.object({
  uid: z.string().min(1),

  hidePresence: z.boolean().default(false),
  themePreference: ThemePreferenceSchema.default("system"),

  showRetiredCharacters: z.boolean().default(false),
  confirmBeforeRolling: z.boolean().default(false),

  showInvitationToasts: z.boolean().default(true),
  showPendingThreatToasts: z.boolean().default(true),

  // ISO timestamp of the last time the user opened the notification inbox.
  // Items with `createdAt > lastInboxOpenedAt` are considered "new". Pre-
  // feature docs parse as null via the default; first inbox open writes the
  // first timestamp.
  lastInboxOpenedAt: z.string().datetime().nullable().default(null),

  updatedAt: z.string().datetime().nullable().default(null),
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

/**
 * Build a fully-defaulted settings object. Used when no Firestore doc exists
 * yet (fresh user) so consumers never deal with null.
 */
export function defaultSettingsFor(uid: string): UserSettings {
  return UserSettingsSchema.parse({ uid });
}
