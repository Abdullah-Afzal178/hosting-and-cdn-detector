export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <div className="h-9 w-44 animate-pulse rounded-xl bg-white" />
      <div className="mt-6 h-10 w-80 animate-pulse rounded-xl bg-white" />
      <div className="mt-5 h-12 animate-pulse rounded-xl bg-white" />
      <div className="mt-8 h-44 animate-pulse rounded-2xl bg-white" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-xl bg-white" />
        ))}
      </div>
    </div>
  );
}
