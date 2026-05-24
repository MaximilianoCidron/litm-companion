"use client";
import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { ConfirmDialog } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import {
  AvatarProcessingError,
  processAvatar,
} from "@/shared/lib/image-processing";
import { uploadAvatar } from "@/shared/lib/avatar-upload";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import {
  removeCharacterAvatar,
  setCharacterAvatar,
} from "../../actions";
import { getInitials } from "../../lib/initials";
import type { CharacterId } from "../../schemas";

interface AvatarUploaderProps {
  characterId: CharacterId;
  ownerUid: string;
  avatarUrl: string | null;
  characterName: string;
  size?: "sm" | "md" | "lg";
  canEdit: boolean;
}

export function AvatarUploader({
  characterId,
  ownerUid,
  avatarUrl,
  characterName,
  size = "md",
  canEdit,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callAction = useActionWithToast();

  const dimensionClass =
    size === "sm" ? "h-16 w-16" : size === "lg" ? "h-32 w-32" : "h-24 w-24";

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const processed = await processAvatar(file);
      const urls = await uploadAvatar(ownerUid, characterId, processed);
      await callAction(
        setCharacterAvatar({
          characterId,
          mainUrl: urls.mainUrl,
          thumbUrl: urls.thumbUrl,
        }),
        { onSuccess: "Portrait updated" },
      );
    } catch (err) {
      if (err instanceof AvatarProcessingError) {
        setError(err.message);
      } else {
        console.error("[avatar] upload failed", err);
        setError("Upload failed. Try a different image.");
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    await callAction(removeCharacterAvatar({ characterId }), {
      onSuccess: "Portrait removed",
    });
  };

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden rounded-full border-2 border-ink-muted bg-mist-light font-display text-ink-muted dark:bg-mist-dark dark:text-parchment-muted",
          dimensionClass,
        )}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${characterName}'s portrait`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className={size === "sm" ? "text-xl" : "text-2xl"}>
            {getInitials(characterName)}
          </span>
        )}
        {uploading ? (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 flex items-center justify-center bg-ink/50"
          >
            <Loader2
              className="h-6 w-6 animate-spin text-parchment-elevated"
              aria-hidden="true"
            />
          </div>
        ) : null}
      </div>

      {canEdit ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            aria-label="Change portrait"
            className="absolute bottom-0 right-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-ember text-parchment-elevated shadow transition-transform hover:scale-105 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
          >
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          {avatarUrl ? (
            <ConfirmDialog
              trigger={
                <button
                  type="button"
                  aria-label="Remove portrait"
                  disabled={uploading}
                  className="absolute right-0 top-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-rust text-parchment-elevated shadow transition-transform hover:scale-105 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              }
              title="Remove portrait?"
              description="This deletes the uploaded image."
              confirmLabel="Remove"
              variant="destructive"
              onConfirm={handleRemove}
            />
          ) : null}
        </>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="absolute -bottom-6 left-0 whitespace-nowrap text-xs text-rust-text dark:text-rust-text-dark"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
