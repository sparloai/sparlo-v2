'use client';

import { useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { Archive, Loader2, RotateCcw } from 'lucide-react';

import { toast } from '@kit/ui/sonner';
import { cn } from '@kit/ui/utils';

import { archiveReport } from '../../_lib/server/sparlo-reports-server-actions';

interface ArchiveToggleButtonProps {
  reportId: string;
  /** If true, shows restore button; if false, shows archive button */
  isArchived: boolean;
  /** Optional callback after action completes */
  onComplete?: () => void;
}

/**
 * Unified archive/restore button component.
 * Shows Archive icon when isArchived=false, RotateCcw when isArchived=true.
 */
export function ArchiveToggleButton({
  reportId,
  isArchived,
  onComplete,
}: ArchiveToggleButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPending) return;

    startTransition(async () => {
      try {
        const result = await archiveReport({
          id: reportId,
          archived: !isArchived,
        });

        if (result.success) {
          toast.success(isArchived ? 'Report restored' : 'Report archived');
          onComplete?.();
          router.refresh();
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to update report',
        );
      }
    });
  };

  const Icon = isPending ? Loader2 : isArchived ? RotateCcw : Archive;
  const label = isArchived ? 'Restore report' : 'Archive report';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={label}
      aria-busy={isPending}
      className="rounded p-1.5 text-[--text-muted] opacity-0 transition-all group-hover:opacity-100 hover:bg-[--surface-overlay] hover:text-[--text-secondary] disabled:opacity-50"
      title={label}
    >
      <Icon className={cn('h-4 w-4', isPending && 'animate-spin')} />
    </button>
  );
}
