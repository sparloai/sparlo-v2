'use client';

import { type RefObject } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Download,
  List,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  Share2,
  X,
} from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';

import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { cn } from '@kit/ui/utils';

import type { Conversation, ReportData } from '../_lib/types';

type ViabilityLevel = 'GREEN' | 'YELLOW' | 'RED';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

function ViabilityBadge({ viability }: { viability: ViabilityLevel }) {
  const styles = {
    GREEN:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    YELLOW:
      'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    RED: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <span
      className={cn(
        'flex-shrink-0 rounded px-3 py-1.5 text-xs font-semibold tracking-wide uppercase',
        styles[viability],
      )}
    >
      {viability} Light
    </span>
  );
}

interface CompletePhaseProps {
  reportData: ReportData;
  activeConversation: Conversation | null;
  tocItems: TocItem[];
  activeSection: string;
  showToc: boolean;
  setShowToc: (value: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (value: boolean) => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (value: string) => void;
  isChatLoading: boolean;
  reportRef: RefObject<HTMLDivElement | null>;
  chatEndRef: RefObject<HTMLDivElement | null>;
  scrollToSection: (sectionId: string) => void;
  markdownComponents: Components;
  onStartNew: () => void;
  onChatSubmit: (e: React.FormEvent) => void;
  onChatKeyDown: (e: React.KeyboardEvent) => void;
}

export function CompletePhase({
  reportData,
  activeConversation,
  tocItems,
  activeSection,
  showToc,
  setShowToc,
  isChatOpen,
  setIsChatOpen,
  chatMessages,
  chatInput,
  setChatInput,
  isChatLoading,
  reportRef,
  chatEndRef,
  scrollToSection,
  markdownComponents,
  onStartNew,
  onChatSubmit,
  onChatKeyDown,
}: CompletePhaseProps) {
  return (
    <div className="relative min-h-screen bg-[#FAFAFA] dark:bg-neutral-950">
      {/* Fixed TOC Sidebar */}
      <AnimatePresence>
        {showToc && tocItems.length > 0 && (
          <motion.aside
            className="fixed top-20 left-0 z-40 hidden h-[calc(100vh-80px)] w-64 overflow-y-auto border-r border-[#E5E5E5] bg-white p-4 lg:block dark:border-neutral-800 dark:bg-neutral-900"
            initial={{ x: -264 }}
            animate={{ x: 0 }}
            exit={{ x: -264 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-[#8A8A8A] uppercase">
                Contents
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowToc(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <nav className="space-y-1">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={cn(
                    'block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    activeSection === item.id
                      ? 'bg-[#7C3AED]/10 font-medium text-[#7C3AED]'
                      : 'text-[#6B6B6B] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white',
                  )}
                >
                  {item.title}
                </button>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* TOC Toggle Button (when hidden) */}
      {!showToc && tocItems.length > 0 && (
        <motion.button
          className="fixed top-24 left-4 z-40 hidden rounded-lg border border-[#E5E5E5] bg-white p-2 shadow-sm lg:block dark:border-neutral-800 dark:bg-neutral-900"
          onClick={() => setShowToc(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
        >
          <List className="h-4 w-4" />
        </motion.button>
      )}

      {/* Main Content Area */}
      <div
        ref={reportRef}
        className={cn(
          'mx-auto max-w-4xl p-6 pt-8 transition-all duration-300',
          showToc && tocItems.length > 0 && 'lg:ml-64',
          isChatOpen && 'lg:mr-[400px]',
        )}
      >
        {/* Report Header */}
        <header className="mb-8 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-[32px] font-bold tracking-tight text-[#1A1A1A] dark:text-white">
                {activeConversation?.title || 'Technical Analysis Report'}
              </h1>
            </div>
            {reportData.viability && (
              <ViabilityBadge
                viability={reportData.viability as ViabilityLevel}
              />
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-[#E5E5E5] dark:border-neutral-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-[#E5E5E5] dark:border-neutral-700"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onStartNew}
              className="rounded-lg border-[#E5E5E5] dark:border-neutral-700"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              New Analysis
            </Button>
          </div>
        </header>

        {/* Full Report Markdown */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown components={markdownComponents}>
            {reportData.report_markdown}
          </ReactMarkdown>
        </div>

        {/* Bottom spacer for chat */}
        <div className="h-24" />
      </div>

      {/* Chat Toggle Button */}
      {!isChatOpen && (
        <motion.button
          className="fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-full bg-[#7C3AED] px-4 py-3 text-white shadow-lg"
          onClick={() => setIsChatOpen(true)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="font-medium">Ask about this report</span>
        </motion.button>
      )}

      {/* Chat Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className="fixed top-0 right-0 z-50 flex h-full w-[400px] flex-col border-l border-[#E5E5E5] bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-3 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#7C3AED]" />
                <span className="font-semibold text-[#1A1A1A] dark:text-white">
                  Chat with Report
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {chatMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-[#8A8A8A]">
                  <MessageSquare className="mb-4 h-12 w-12 opacity-20" />
                  <p className="font-medium text-[#4A4A4A] dark:text-neutral-300">
                    Ask anything about this report
                  </p>
                  <p className="mt-1 text-sm">
                    Get clarification, explore alternatives, or dive deeper into
                    specific concepts.
                  </p>
                  <div className="mt-6 w-full space-y-2">
                    {[
                      'What are the main risks?',
                      'Summarize the key recommendations',
                      'What should I do first?',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-left text-sm text-[#6B6B6B] transition-colors hover:bg-[#F5F5F5] hover:text-[#1A1A1A] dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                        onClick={() => setChatInput(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start',
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-2',
                        msg.role === 'user'
                          ? 'rounded-tr-sm bg-[#7C3AED] text-white'
                          : 'rounded-tl-sm bg-[#F5F5F5] dark:bg-neutral-800',
                      )}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                          {msg.isStreaming && (
                            <span className="inline-block animate-pulse">
                              ▋
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={onChatSubmit}
              className="border-t border-[#E5E5E5] bg-[#FAFAFA] p-4 dark:border-neutral-800 dark:bg-neutral-900/50"
            >
              <div className="flex gap-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={onChatKeyDown}
                  placeholder="Ask a question about the report..."
                  className="max-h-[100px] min-h-[44px] resize-none rounded-lg border-[#E5E5E5] bg-white text-sm focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 dark:border-neutral-700 dark:bg-neutral-800"
                  disabled={isChatLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-[44px] w-[44px] flex-shrink-0 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9]"
                  disabled={!chatInput.trim() || isChatLoading}
                >
                  {isChatLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="mt-3 text-center text-[10px] text-[#8A8A8A]">
                Powered by Claude Opus 4.5
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
