'use client';

import Image from 'next/image';

import type { Attachment } from '../../_lib/use-file-attachments';

/**
 * Shared attachment list component for analysis forms.
 * Displays uploaded files with previews and remove buttons.
 */

interface AttachmentListProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

export function AttachmentList({ attachments, onRemove }: AttachmentListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="group flex items-center gap-2 rounded border border-zinc-200 bg-zinc-50 py-1.5 pr-2 pl-1.5 transition-colors hover:border-zinc-300"
          >
            <div className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm">
              {attachment.file.type.startsWith('image/') ? (
                <Image
                  src={attachment.preview}
                  alt={attachment.file.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-sm text-zinc-500">📄</span>
              )}
            </div>
            <span className="max-w-[120px] truncate text-[12px] tracking-[-0.02em] text-zinc-600">
              {attachment.file.name}
            </span>
            <button
              onClick={() => onRemove(attachment.id)}
              className="ml-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600"
              aria-label={`Remove ${attachment.file.name}`}
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
