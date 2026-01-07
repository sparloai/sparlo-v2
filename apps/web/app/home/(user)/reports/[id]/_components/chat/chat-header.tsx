'use client';

import { memo } from 'react';

import { X } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
}

export const ChatHeader = memo(function ChatHeader({
  onClose,
}: ChatHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-5">
      <h2
        className="text-[14px] font-medium tracking-[-0.01em] text-zinc-900"
        style={{ fontFamily: 'var(--font-heading), system-ui, sans-serif' }}
      >
        Go Deeper
      </h2>

      <button
        onClick={onClose}
        className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </header>
  );
});
