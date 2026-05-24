"use client";

const MAIN_MAX_DIMENSION = 512;
const THUMB_MAX_DIMENSION = 128;
const JPEG_QUALITY = 0.85;
const MAX_INPUT_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_INPUT_MIME: ReadonlyArray<string> = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export interface ProcessedAvatar {
  main: Blob;
  thumb: Blob;
}

export type AvatarErrorCode = "TOO_LARGE" | "BAD_MIME" | "DECODE_FAILED";

export class AvatarProcessingError extends Error {
  code: AvatarErrorCode;
  constructor(code: AvatarErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "AvatarProcessingError";
  }
}

/**
 * Decode + resize an image File into two JPEG blobs (main 512px, thumb 128px).
 * Aspect ratio preserved (no crop). Canvas re-encoding strips EXIF.
 */
export async function processAvatar(file: File): Promise<ProcessedAvatar> {
  if (file.size > MAX_INPUT_SIZE_BYTES) {
    throw new AvatarProcessingError(
      "TOO_LARGE",
      "Max file size is 2MB.",
    );
  }
  if (!ALLOWED_INPUT_MIME.includes(file.type)) {
    throw new AvatarProcessingError(
      "BAD_MIME",
      "Invalid file type. Use JPEG, PNG, or WebP.",
    );
  }

  const img = await loadImage(file);
  const main = await drawToBlob(img, MAIN_MAX_DIMENSION);
  const thumb = await drawToBlob(img, THUMB_MAX_DIMENSION);
  return { main, thumb };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new AvatarProcessingError(
          "DECODE_FAILED",
          "We couldn't read that image.",
        ),
      );
    };
    img.src = url;
  });
}

function drawToBlob(
  img: HTMLImageElement,
  maxDim: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const ratio = img.naturalWidth / img.naturalHeight;
    let targetW: number;
    let targetH: number;
    if (img.naturalWidth >= img.naturalHeight) {
      targetW = Math.min(maxDim, img.naturalWidth);
      targetH = Math.round(targetW / ratio);
    } else {
      targetH = Math.min(maxDim, img.naturalHeight);
      targetW = Math.round(targetH * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(
        new AvatarProcessingError(
          "DECODE_FAILED",
          "Canvas isn't available in this browser.",
        ),
      );
      return;
    }
    // White fill so transparent PNGs encode cleanly to JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new AvatarProcessingError(
              "DECODE_FAILED",
              "Failed to encode resized image.",
            ),
          );
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}
