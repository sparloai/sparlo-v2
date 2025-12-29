import { MessageSquare, X } from 'lucide-react';

import { Button } from '@kit/ui/button';

interface ChatHeaderProps {
  onClose: () => void;
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-neutral-800">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
          <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Chat with Report
          </span>
          <p className="text-[10px] text-gray-500 dark:text-neutral-400">
            Ask follow-up questions
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white"
        onClick={onClose}
        aria-label="Close chat"
      >
        <X className="h-4 w-4" />
      </Button>
    </header>
  );
}
