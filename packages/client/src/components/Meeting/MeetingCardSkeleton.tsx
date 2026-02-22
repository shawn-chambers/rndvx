export function MeetingCardSkeleton() {
  return (
    <div
      className="rounded-lg bg-white p-4 shadow-sm"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded-sm bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded-sm bg-muted" />
        </div>
        <div className="h-5 w-16 animate-pulse rounded-sm bg-muted" />
      </div>
      <div className="mt-3 h-4 w-full animate-pulse rounded-sm bg-muted" />
      <div className="mt-1 h-4 w-2/3 animate-pulse rounded-sm bg-muted" />
      <div className="mt-3 flex items-center gap-3">
        <div className="h-4 w-20 animate-pulse rounded-sm bg-muted" />
        <div className="h-1.5 w-20 animate-pulse rounded-sm bg-muted" />
      </div>
    </div>
  );
}
