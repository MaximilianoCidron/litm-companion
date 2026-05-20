"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ActionResult } from "@/shared/auth";

export type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

interface UseDebouncedFieldSaveArgs<T> {
  value: T;
  save: (val: T) => Promise<ActionResult<unknown>>;
  debounceMs?: number;
}

interface UseDebouncedFieldSaveReturn<T> {
  value: T;
  setValue: (val: T) => void;
  state: SaveState;
  errorMsg: string | null;
}

export function useDebouncedFieldSave<T>({
  value: upstream,
  save,
  debounceMs = 800,
}: UseDebouncedFieldSaveArgs<T>): UseDebouncedFieldSaveReturn<T> {
  const [local, setLocal] = useState<T>(upstream);
  const [state, setState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const lastSavedRef = useRef<T>(upstream);
  const savedFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reconcile when the snapshot brings a newer value that differs from what
  // we last saved (so we don't clobber our own in-flight or pending writes).
  useEffect(() => {
    if (upstream !== lastSavedRef.current) {
      setLocal(upstream);
      lastSavedRef.current = upstream;
    }
  }, [upstream]);

  // Debounced save: any time `local` diverges from the last-saved value,
  // schedule a save. State transitions (pending) happen in `setValue` so the
  // lint rule about set-state-in-effect stays satisfied.
  useEffect(() => {
    if (local === lastSavedRef.current) return;
    const t = setTimeout(async () => {
      setState("saving");
      const result = await save(local);
      if (result.ok) {
        lastSavedRef.current = local;
        setErrorMsg(null);
        setState("saved");
        if (savedFlashTimer.current) clearTimeout(savedFlashTimer.current);
        savedFlashTimer.current = setTimeout(() => setState("idle"), 1500);
      } else {
        setState("error");
        setErrorMsg(result.error.message);
      }
    }, debounceMs);
    return () => clearTimeout(t);
  }, [local, save, debounceMs]);

  useEffect(() => {
    return () => {
      if (savedFlashTimer.current) clearTimeout(savedFlashTimer.current);
    };
  }, []);

  const setValue = useCallback((next: T) => {
    setLocal(next);
    if (next === lastSavedRef.current) {
      setState("idle");
      setErrorMsg(null);
    } else {
      setState("pending");
    }
  }, []);

  return { value: local, setValue, state, errorMsg };
}
