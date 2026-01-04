import { ArrowLeft, FileText, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';

import { withI18n } from '~/lib/i18n/with-i18n';

// Import shared components from team account help
import { HelpChat } from '../../[account]/help/_components/help-chat';
import { HelpDocsLink } from '../../[account]/help/_components/help-docs-link';
import { HelpTicketForm } from '../../[account]/help/_components/help-ticket-form';

export const metadata = {
  title: 'Help Center',
  description:
    'Get help with Sparlo - chat with our AI assistant, submit a support ticket, or browse documentation',
};

function HelpPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-8 pb-16 pt-12">
        {/* Back link */}
        <Link
          href="/home"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>

        {/* Page title with signature left border */}
        <div className="mb-12 border-l-4 border-zinc-950 py-1 pl-6">
          <h1 className="mb-3 font-heading text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
            Help Center
          </h1>
          <p className="max-w-2xl text-lg font-normal leading-relaxed text-zinc-600">
            Get answers from our support assistant, submit a request, or browse
            documentation.
          </p>
        </div>

        {/* Tabs with custom styling */}
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="mb-8 grid h-auto w-full grid-cols-3 gap-2 bg-transparent p-0">
            <TabsTrigger
              value="chat"
              className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-600 transition-all data-[state=active]:border-zinc-900 data-[state=active]:bg-zinc-900 data-[state=active]:text-white hover:border-zinc-300"
            >
              <MessageSquare className="h-4 w-4" />
              Support Chat
            </TabsTrigger>
            <TabsTrigger
              value="ticket"
              className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-600 transition-all data-[state=active]:border-zinc-900 data-[state=active]:bg-zinc-900 data-[state=active]:text-white hover:border-zinc-300"
            >
              <Send className="h-4 w-4" />
              Submit Request
            </TabsTrigger>
            <TabsTrigger
              value="docs"
              className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-[14px] font-medium text-zinc-600 transition-all data-[state=active]:border-zinc-900 data-[state=active]:bg-zinc-900 data-[state=active]:text-white hover:border-zinc-300"
            >
              <FileText className="h-4 w-4" />
              Documentation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-0">
            <HelpChat />
          </TabsContent>

          <TabsContent value="ticket" className="mt-0">
            <HelpTicketForm />
          </TabsContent>

          <TabsContent value="docs" className="mt-0">
            <HelpDocsLink />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

export default withI18n(HelpPage);
