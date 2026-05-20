"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Button, Card } from "@/shared/ui";

interface CharacterErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function isForbidden(error: Error): boolean {
  const msg = error.message?.toLowerCase() ?? "";
  return msg.includes("forbidden") || msg.includes("do not have access");
}

export default function CharacterError({ error, reset }: CharacterErrorProps) {
  useEffect(() => {
    console.error("[character] error boundary:", error);
  }, [error]);

  const forbidden = isForbidden(error);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-16 md:px-6">
      <Card>
        <Card.Header
          title={forbidden ? "Access denied" : "Something went wrong"}
        />
        <Card.Body className="flex flex-col gap-4">
          <p className="prose text-base">
            {forbidden
              ? "You don't have access to this character. Ask the owner or your GM to share it with you."
              : "We couldn't load this character. Try again, or head back to the dashboard."}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
            {!forbidden ? (
              <Button type="button" onClick={reset}>
                Try again
              </Button>
            ) : null}
          </div>
        </Card.Body>
      </Card>
    </main>
  );
}
