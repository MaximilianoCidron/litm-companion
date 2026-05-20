"use client";
import { useSyncExternalStore } from "react";
import type { ToastVariant } from "./toast";

export interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type Listener = (items: ToastItem[]) => void;

const EMPTY_SNAPSHOT: ToastItem[] = [];
let toasts: ToastItem[] = EMPTY_SNAPSHOT;
const listeners = new Set<Listener>();

function emit(): void {
  for (const fn of listeners) fn(toasts);
}

function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot(): ToastItem[] {
  return toasts;
}

function getServerSnapshot(): ToastItem[] {
  return EMPTY_SNAPSHOT;
}

function push(item: Omit<ToastItem, "id">): string {
  const id = `t_${Math.random().toString(36).slice(2)}`;
  toasts = [...toasts, { id, ...item }];
  emit();
  return id;
}

function dismiss(id: string): void {
  const next = toasts.filter((t) => t.id !== id);
  toasts = next.length === 0 ? EMPTY_SNAPSHOT : next;
  emit();
}

export const toast = {
  show: (item: Omit<ToastItem, "id" | "variant"> & { variant?: ToastVariant }) =>
    push({ variant: "default", ...item }),
  success: (
    title: string,
    options?: { description?: string; duration?: number },
  ) => push({ variant: "success", title, ...options }),
  warning: (
    title: string,
    options?: { description?: string; duration?: number },
  ) => push({ variant: "warning", title, ...options }),
  error: (
    title: string,
    options?: { description?: string; duration?: number },
  ) => push({ variant: "destructive", title, ...options }),
  dismiss,
};

export function useToastStore(): ToastItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
