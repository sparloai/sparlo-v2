'use client';

import { useState } from 'react';

import { MessageSquare, X } from 'lucide-react';

import { cn } from '@kit/ui/utils';

import { HelpChatWidget } from './help-chat-widget';

export function HelpWidgetTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  return (
    <>
      {/* Chat Widget */}
      {!isMinimized && (
        <HelpChatWidget
          isOpen={isOpen}
          onClose={handleClose}
          onMinimize={handleMinimize}
        />
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={isOpen ? handleClose : handleOpen}
        className={cn(
          'fixed right-4 bottom-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105',
          isOpen
            ? 'bg-zinc-700 hover:bg-zinc-600'
            : 'bg-zinc-900 hover:bg-zinc-800',
          isMinimized && 'animate-pulse',
        )}
        aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageSquare className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Minimized indicator */}
      {isMinimized && (
        <div className="fixed right-16 bottom-6 z-50">
          <div className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white shadow-lg">
            Chat minimized
          </div>
        </div>
      )}
    </>
  );
}
