import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(256, "Password is too long."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const sessionRequestSchema = z.object({
  idToken: z.string().min(20, "Missing ID token."),
});

export type SessionRequest = z.infer<typeof sessionRequestSchema>;
