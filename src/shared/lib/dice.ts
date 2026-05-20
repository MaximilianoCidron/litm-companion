import "server-only";
import { randomInt } from "node:crypto";

export type D6 = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Cryptographically secure d6 roll. Server-only — never import in client code.
 * Tamper resistance for the roll flow is the whole point.
 */
export function secureRollD6(): D6 {
  return randomInt(1, 7) as D6;
}
