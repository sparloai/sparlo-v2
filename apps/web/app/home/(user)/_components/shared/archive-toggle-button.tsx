'use client';

import { useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { Archive, RotateCcw } from 'lucide-react';

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
    startTransition(async () => {
      try {
        await archiveReport({ id: reportId, archived: !isArchived });
        onComplete?.();
        router.refresh();
      } catch (error) {
        console.error('[ArchiveToggleButton] Failed to update:', error);
      }
    });
  };

  const Icon = isArchived ? RotateCcw : Archive;
  const title = isArchived ? 'Restore report' : 'Archive report';

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded p-1.5 text-[--text-muted] opacity-0 transition-all group-hover:opacity-100 hover:bg-[--surface-overlay] hover:text-[--text-secondary]"
      title={title}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
