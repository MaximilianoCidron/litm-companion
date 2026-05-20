import { Card, Skeleton } from "@/shared/ui";

export default function DashboardLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-11 w-32" />
      </header>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <Card.Header>
              <Skeleton className="h-5 w-32 bg-parchment-elevated/30" />
            </Card.Header>
            <Card.Body className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
              <Skeleton className="h-4 w-24" />
            </Card.Body>
            <Card.Footer>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-4 rounded-full" />
                ))}
              </div>
            </Card.Footer>
          </Card>
        ))}
      </div>
    </main>
  );
}
