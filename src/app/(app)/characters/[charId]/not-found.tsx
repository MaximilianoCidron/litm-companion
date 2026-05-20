import Link from "next/link";
import { Button, Card } from "@/shared/ui";

export default function CharacterNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-16 md:px-6">
      <Card>
        <Card.Header title="Hero not found" />
        <Card.Body className="flex flex-col gap-4">
          <p className="prose text-base">
            This hero doesn&apos;t exist or has been retired. Head back and
            pick another tale.
          </p>
          <div className="flex justify-end">
            <Button type="button" asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </Card.Body>
      </Card>
    </main>
  );
}
