import Link from "next/link";
import { Button, Card } from "@/shared/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-16 md:px-6">
      <Card>
        <Card.Header title="Challenge not found" />
        <Card.Body className="flex flex-col gap-4">
          <p className="prose text-base">
            We couldn&apos;t find that challenge, or it&apos;s not yours to view.
          </p>
          <div className="flex justify-end">
            <Link href="/campaigns">
              <Button variant="secondary">Back to fellowships</Button>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </main>
  );
}
