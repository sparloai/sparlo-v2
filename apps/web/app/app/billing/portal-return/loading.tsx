import { Loader2 } from 'lucide-react';

export default function PortalReturnLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
        </div>
        <h1 className="text-xl font-medium text-zinc-900">
          Updating your subscription
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          This will only take a moment...
        </p>
      </div>
    </main>
  );
}
