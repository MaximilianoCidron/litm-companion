"use client";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";
import { toast as toastApi, useToastStore } from "./use-toast";

export function Toaster() {
  const items = useToastStore();

  return (
    <ToastProvider swipeDirection="right">
      {items.map((t) => (
        <Toast
          key={t.id}
          variant={t.variant}
          duration={t.duration ?? 5000}
          onOpenChange={(open) => {
            if (!open) toastApi.dismiss(t.id);
          }}
        >
          <div className="flex-1 pr-6">
            {t.title ? <ToastTitle>{t.title}</ToastTitle> : null}
            {t.description ? (
              <ToastDescription>{t.description}</ToastDescription>
            ) : null}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
