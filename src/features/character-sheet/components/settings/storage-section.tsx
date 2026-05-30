"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, HardDrive, RefreshCw, Trash2 } from "lucide-react";
import { Button, ConfirmDialog, toast } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import {
  cleanupOrphanStorageFiles,
  getUserStorageUsageAction,
} from "../../actions";
import { formatBytes } from "@/shared/lib/storage-paths";
import type {
  CharacterStorageUsage,
  UserStorageUsage,
} from "../../lib/queries";
import { SettingRow } from "./setting-row";

type LoadState =
  | { kind: "loading" }
  | { kind: "loaded"; usage: UserStorageUsage }
  | { kind: "error"; error: string };

export function StorageSection() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const callAction = useActionWithToast();

  // Lazy-load: nothing fetches until this section mounts. Initial state is
  // already "loading", so the effect only kicks off the fetch.
  useEffect(() => {
    let cancelled = false;
    getUserStorageUsageAction({}).then((result) => {
      if (cancelled) return;
      if (result.ok) setState({ kind: "loaded", usage: result.data });
      else setState({ kind: "error", error: result.error.message });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = async () => {
    setState({ kind: "loading" });
    const result = await getUserStorageUsageAction({});
    if (result.ok) setState({ kind: "loaded", usage: result.data });
    else setState({ kind: "error", error: result.error.message });
  };

  const handleCleanup = async () => {
    // Manual toast branching: the hook always toasts success, but a partial
    // failure (failed > 0) warrants the neutral `toast.show` instead.
    const data = await callAction(cleanupOrphanStorageFiles({}));
    if (!data) return; // error already toasted by the hook
    if (data.failed > 0) {
      toast.show({
        title: `Cleaned ${data.deleted} of ${data.totalOrphans} orphan files`,
        description: `${data.failed} couldn't be deleted — try again.`,
      });
    } else {
      toast.success(
        `Cleaned ${data.deleted} orphan file${data.deleted === 1 ? "" : "s"}`,
      );
    }
    await refetch();
  };

  return (
    <section className="rounded-lg border border-mist-light bg-parchment-elevated p-4 dark:border-mist-dark dark:bg-ink-elevated">
      <header className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
          <HardDrive className="h-4 w-4" aria-hidden="true" />
          Storage
        </h2>
        {state.kind === "loaded" ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh storage usage"
            onClick={refetch}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
      </header>

      {state.kind === "loading" ? (
        <p className="text-sm italic text-ink-muted dark:text-parchment-muted">
          Calculating…
        </p>
      ) : null}

      {state.kind === "error" ? (
        <p className="text-sm text-rust dark:text-rust-dark">
          Couldn&apos;t load storage usage: {state.error}
        </p>
      ) : null}

      {state.kind === "loaded" ? (
        <StorageBreakdown usage={state.usage} onCleanup={handleCleanup} />
      ) : null}
    </section>
  );
}

function StorageBreakdown({
  usage,
  onCleanup,
}: {
  usage: UserStorageUsage;
  onCleanup: () => Promise<void>;
}) {
  if (usage.totalFileCount === 0) {
    return (
      <p className="text-sm text-ink-muted dark:text-parchment-muted">
        No portraits uploaded yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingRow
        label="Total used"
        control={
          <span className="numeric text-sm text-ink-base dark:text-parchment-base">
            {formatBytes(usage.totalBytes)} · {usage.totalFileCount} file
            {usage.totalFileCount === 1 ? "" : "s"}
          </span>
        }
      />

      {usage.byCharacter.length > 0 ? (
        <div className="overflow-hidden rounded border border-mist-light dark:border-mist-dark">
          {usage.byCharacter.map((c) => (
            <CharacterRow key={c.characterId} entry={c} />
          ))}
        </div>
      ) : null}

      {usage.orphanFileCount > 0 ? (
        <div className="flex items-center justify-between gap-4 rounded border border-rust/30 bg-rust/10 p-4 dark:border-rust-dark/40 dark:bg-rust/15">
          <div className="flex items-start gap-2">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-rust dark:text-rust-dark"
              aria-hidden="true"
            />
            <div className="text-sm">
              <p className="font-display text-rust dark:text-rust-dark">
                {usage.orphanFileCount} orphan file
                {usage.orphanFileCount === 1 ? "" : "s"} ·{" "}
                <span className="numeric">{formatBytes(usage.orphanBytes)}</span>
              </p>
              <p className="mt-0.5 text-ink-muted dark:text-parchment-muted">
                Portrait files no longer referenced by any of your heroes.
              </p>
            </div>
          </div>
          <ConfirmDialog
            trigger={
              <Button variant="destructive" size="md">
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Clean up
              </Button>
            }
            title={`Clean up ${usage.orphanFileCount} orphan file${
              usage.orphanFileCount === 1 ? "" : "s"
            }?`}
            description="These files aren't referenced by any of your heroes. Deleting them frees up storage and can't be undone."
            confirmLabel="Delete orphan files"
            variant="destructive"
            onConfirm={onCleanup}
          />
        </div>
      ) : null}
    </div>
  );
}

function CharacterRow({ entry }: { entry: CharacterStorageUsage }) {
  const hasOrphans = entry.files.some((f) => f.isOrphan);
  return (
    <div className="flex items-center justify-between gap-4 border-b border-mist-light px-4 py-3 last:border-b-0 dark:border-mist-dark">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-display text-sm text-ink-base dark:text-parchment-base">
          {entry.characterName ?? "Unknown hero"}
        </span>
        {hasOrphans ? (
          <span
            className="rounded bg-rust/20 px-1.5 py-0.5 text-xs uppercase tracking-wider text-rust dark:bg-rust-dark/20 dark:text-rust-dark"
            aria-label="Has orphan files"
          >
            orphan
          </span>
        ) : null}
      </div>
      <span className="numeric shrink-0 text-xs text-ink-muted dark:text-parchment-muted">
        {formatBytes(entry.bytes)} · {entry.fileCount} file
        {entry.fileCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}
