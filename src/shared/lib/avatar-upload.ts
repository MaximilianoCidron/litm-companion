"use client";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseStorage } from "@/shared/firebase/client";
import type { ProcessedAvatar } from "./image-processing";

export interface UploadedAvatar {
  mainUrl: string;
  thumbUrl: string;
}

/**
 * Upload main + thumb avatar blobs under
 * users/{ownerUid}/characters/{characterId}/avatar*.jpg and resolve their
 * tokenized download URLs. Storage rules constrain writes to the owner's
 * subtree, so the ownerUid prefix is required.
 */
export async function uploadAvatar(
  ownerUid: string,
  characterId: string,
  processed: ProcessedAvatar,
): Promise<UploadedAvatar> {
  const storage = getFirebaseStorage();
  const base = `users/${ownerUid}/characters/${characterId}`;
  const mainRef = ref(storage, `${base}/avatar.jpg`);
  const thumbRef = ref(storage, `${base}/avatar-thumb.jpg`);

  await Promise.all([
    uploadBytes(mainRef, processed.main, { contentType: "image/jpeg" }),
    uploadBytes(thumbRef, processed.thumb, { contentType: "image/jpeg" }),
  ]);

  const [mainUrl, thumbUrl] = await Promise.all([
    getDownloadURL(mainRef),
    getDownloadURL(thumbRef),
  ]);

  return { mainUrl, thumbUrl };
}
