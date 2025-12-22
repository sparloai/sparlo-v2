import Link from 'next/link';

import { FileX } from 'lucide-react';

import { Button } from '@kit/ui/button';

export default function ShareNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
      <div className="max-w-md px-6 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <FileX className="h-8 w-8 text-zinc-400" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-white">
          Report Not Found
        </h1>
        <p className="mb-6 text-zinc-500 dark:text-zinc-400">
          This shared report link is invalid or has been removed. Please check
          the URL or contact the person who shared it with you.
        </p>
        <Button asChild>
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    </div>
  );
}
