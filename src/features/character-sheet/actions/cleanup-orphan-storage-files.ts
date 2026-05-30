"use server";
import { z } from "zod";
import { withAction } from "@/shared/auth";
import { getAdminStorage } from "@/shared/firebase/admin";
import { getUserStorageUsage } from "../lib/queries";

/**
 * Delete the caller's orphan Storage files (those not referenced by any of
 * their characters' avatars). Reads the per-file `isOrphan` flag computed by
 * `getUserStorageUsage` — single source of truth, no re-derivation here.
 *
 * Best-effort + idempotent: a single delete failure logs and counts as
 * `failed` without aborting the pass; a second run with no orphans is a no-op.
 */
export const cleanupOrphanStorageFiles = withAction(
  z.object({}),
  async (_input, ctx) => {
    const usage = await getUserStorageUsage(ctx.uid);
    const bucket = getAdminStorage().bucket();

    const orphanPaths: string[] = [];
    for (const c of usage.byCharacter) {
      for (const f of c.files) {
        if (f.isOrphan) orphanPaths.push(f.path);
      }
    }
    for (const f of usage.unrecognizedFiles) {
      orphanPaths.push(f.path);
    }

    let deleted = 0;
    let failed = 0;
    for (const path of orphanPaths) {
      try {
        await bucket.file(path).delete();
        deleted += 1;
      } catch (err) {
        console.warn("[cleanup-orphan-storage] failed to delete", path, err);
        failed += 1;
      }
    }

    return { totalOrphans: orphanPaths.length, deleted, failed };
  },
);
