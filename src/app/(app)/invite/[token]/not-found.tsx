import Link from "next/link";
import { Button, Card } from "@/shared/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16 md:px-6">
      <Card>
        <Card.Header title="Invite not found" />
        <Card.Body className="flex flex-col gap-4">
          <p className="prose text-base">
            That invite link is invalid or has been deleted.
          </p>
          <div className="flex justify-end">
            <Link href="/dashboard">
              <Button variant="secondary">Back to dashboard</Button>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </main>
  );
}
