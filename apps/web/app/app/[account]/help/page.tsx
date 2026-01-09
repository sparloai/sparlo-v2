import { ArrowLeft, MessageSquare } from 'lucide-react';

import { AppLink } from '~/components/app-link';
import { HelpWidgetTrigger } from '~/components/help-widget';
import { withI18n } from '~/lib/i18n/with-i18n';

import { HelpDocsLink } from './_components/help-docs-link';
import { HelpTicketForm } from './_components/help-ticket-form';

export const metadata = {
  title: 'Help Center',
  description:
    'Get help with Sparlo - submit a support ticket or browse documentation',
};

function HelpPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-8 pt-12 pb-16">
        {/* Back link */}
        <AppLink
          href="/app"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </AppLink>

        {/* Page title with signature left border */}
        <div className="mb-12 border-l-4 border-zinc-950 py-1 pl-6">
          <h1 className="font-heading mb-3 text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
            Help Center
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed font-normal text-zinc-600">
            Submit a support request or browse our documentation.
          </p>
        </div>

        {/* Chat widget hint */}
        <div className="mb-8 flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
          <MessageSquare className="h-5 w-5 text-zinc-500" />
          <p className="text-sm text-zinc-600">
            Have a quick question? Use the chat widget in the bottom-right
            corner for instant help.
          </p>
        </div>

        {/* Submit ticket section */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-medium text-zinc-900">
            Submit a Request
          </h2>
          <HelpTicketForm />
        </section>

        {/* Documentation section */}
        <section>
          <h2 className="mb-4 text-lg font-medium text-zinc-900">
            Documentation
          </h2>
          <HelpDocsLink />
        </section>
      </div>
      <HelpWidgetTrigger />
    </main>
  );
}

export default withI18n(HelpPage);
