/**
 * Pure utilities for parsing Firebase Storage paths and download URLs.
 * Testable in isolation — no SDK imports.
 *
 * Canonical avatar layout (see shared/lib/avatar-upload.ts):
 *   users/{uid}/characters/{characterId}/avatar.jpg
 *   users/{uid}/characters/{characterId}/avatar-thumb.jpg
 */

export const FIREBASE_STORAGE_HOST = "firebasestorage.googleapis.com";

/**
 * Extract the storage path from a Firebase Storage download URL.
 *
 * Input:  https://firebasestorage.googleapis.com/v0/b/{bucket}/o/users%2Fabc%2Fcharacters%2Fxyz%2Favatar.jpg?alt=media&token=...
 * Output: users/abc/characters/xyz/avatar.jpg
 *
 * Returns null when the URL isn't a Firebase Storage URL or doesn't match the expected shape.
 */
export function parseStoragePathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== FIREBASE_STORAGE_HOST) return null;
    // Path format: /v0/b/{bucket}/o/{encodedPath}
    const match = u.pathname.match(/^\/v0\/b\/[^/]+\/o\/(.+)$/);
    const encoded = match?.[1];
    if (encoded === undefined) return null;
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

/**
 * Extract characterId from an avatar storage path.
 *
 * Input:  users/abc/characters/xyz/avatar.jpg       → xyz
 * Input:  users/abc/characters/xyz/avatar-thumb.jpg → xyz
 *
 * Tolerates extension drift (e.g. a legacy `avatar.png`) so such files are
 * still attributed to their character and flagged as orphans downstream.
 * Returns null when the path doesn't match the expected avatar shape.
 */
export function parseCharacterIdFromAvatarPath(path: string): string | null {
  const match = path.match(
    /^users\/[^/]+\/characters\/([^/]+)\/avatar(?:-thumb)?\.[^/]+$/,
  );
  return match?.[1] ?? null;
}

/** Format a byte count as "X B", "Y KB", "Z MB", "W GB". */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
