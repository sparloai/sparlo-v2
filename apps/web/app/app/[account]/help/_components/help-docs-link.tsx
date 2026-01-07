import Link from 'next/link';

import { BookOpen, ExternalLink, Search } from 'lucide-react';

import { Button } from '@kit/ui/button';

export function HelpDocsLink() {
  return (
    <div className="rounded-lg border p-8 text-center">
      <BookOpen className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
      <h3 className="mb-2 text-xl font-semibold">Documentation</h3>
      <p className="text-muted-foreground mb-6">
        Browse our comprehensive documentation for guides, tutorials, and API
        references.
      </p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/docs">
            <Search className="mr-2 h-4 w-4" />
            Browse Documentation
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/docs/getting-started" target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            Getting Started Guide
          </Link>
        </Button>
      </div>
    </div>
  );
}
