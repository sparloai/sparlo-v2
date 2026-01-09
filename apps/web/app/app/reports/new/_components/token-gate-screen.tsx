import { ArrowLeft } from 'lucide-react';

import { AppLink } from '~/components/app-link';

export function TokenGateScreen() {
  return (
    <main className="bg-white">
      <div className="mx-auto max-w-3xl px-8 pt-16 pb-16">
        <AppLink
          href="/app"
          className="mb-8 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </AppLink>

        <div className="border-l-2 border-zinc-900 pl-10">
          <h1 className="font-heading mb-4 text-[36px] font-normal tracking-[-0.02em] text-zinc-900">
            Out of Credits
          </h1>

          <p className="mb-8 max-w-lg text-[17px] leading-[1.6] text-zinc-500">
            You&apos;re out of credits. Upgrade your plan to continue.
          </p>

          <AppLink
            href="/app/billing"
            className="inline-flex items-center rounded-lg bg-zinc-900 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Upgrade Plan
          </AppLink>
        </div>
      </div>
    </main>
  );
}
