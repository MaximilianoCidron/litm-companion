"use client";
import { useEffect } from "react";
import { Button, Card } from "@/shared/ui";

export default function ChallengeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[challenge] error boundary:", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-16 md:px-6">
      <Card>
        <Card.Header title="Something went wrong" />
        <Card.Body className="flex flex-col gap-4">
          <p className="prose text-base">Couldn&apos;t load this challenge.</p>
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
