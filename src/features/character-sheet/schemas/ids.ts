import { z } from "zod";

export const CharacterId = z.string().min(1).brand<"CharacterId">();
export const ThemeId = z.string().min(1).brand<"ThemeId">();
export const TagId = z.string().min(1).brand<"TagId">();
export const StatusId = z.string().min(1).brand<"StatusId">();
export const CampaignId = z.string().min(1).brand<"CampaignId">();
export const FellowshipRelationshipId = z
  .string()
  .min(1)
  .brand<"FellowshipRelationshipId">();
export const RollId = z.string().min(1).brand<"RollId">();
export const InvitationId = z.string().min(1).brand<"InvitationId">();
export const ChallengeId = z.string().min(1).brand<"ChallengeId">();
export const ThreatId = z.string().min(1).brand<"ThreatId">();
export const LimitId = z.string().min(1).brand<"LimitId">();
export const SessionLogEntryId = z.string().min(1).brand<"SessionLogEntryId">();
export const PendingThreatId = z.string().min(1).brand<"PendingThreatId">();
export const SessionId = z.string().min(1).brand<"SessionId">();

export type CharacterId = z.infer<typeof CharacterId>;
export type ThemeId = z.infer<typeof ThemeId>;
export type TagId = z.infer<typeof TagId>;
export type StatusId = z.infer<typeof StatusId>;
export type CampaignId = z.infer<typeof CampaignId>;
export type FellowshipRelationshipId = z.infer<typeof FellowshipRelationshipId>;
export type RollId = z.infer<typeof RollId>;
export type InvitationId = z.infer<typeof InvitationId>;
export type ChallengeId = z.infer<typeof ChallengeId>;
export type ThreatId = z.infer<typeof ThreatId>;
export type LimitId = z.infer<typeof LimitId>;
export type SessionLogEntryId = z.infer<typeof SessionLogEntryId>;
export type PendingThreatId = z.infer<typeof PendingThreatId>;
export type SessionId = z.infer<typeof SessionId>;
