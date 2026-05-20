"use client";
import { useEffect } from "react";
import { Button, Card } from "@/shared/ui";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] error boundary:", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-16 md:px-6">
      <Card>
        <Card.Header title="Something went wrong" />
        <Card.Body className="flex flex-col gap-4">
          <p className="prose text-base">
            We couldn&apos;t load your heroes. The connection might be
            unstable, or the data layer needs a moment to settle.
          </p>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={reset}>
              Try again
            </Button>
          </div>
        </Card.Body>
      </Card>
    </main>
  );
}
