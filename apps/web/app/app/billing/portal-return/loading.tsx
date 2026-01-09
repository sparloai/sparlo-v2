export default function PortalReturnLoading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-8 pt-24 pb-16">
        <div className="border-l-2 border-zinc-900 pl-10">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500" />
            <p className="text-[15px] text-zinc-500">Syncing changes...</p>
          </div>
        </div>
      </div>
    </main>
  );
}
