'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Loader2 } from 'lucide-react';

import { AnalyzingPhase } from './_components/analyzing-phase';
import { ClarifyingPhase } from './_components/clarifying-phase';
import { CompletePhase } from './_components/complete-phase';
import { SparloErrorBoundary } from './_components/error-boundary';
import { ErrorPhase } from './_components/error-phase';
import { InputPhase } from './_components/input-phase';
import {
  generateSectionId,
  markdownComponents,
} from './_components/markdown-components';
import { OfflineBanner } from './_components/offline-banner';
import { ProcessingPhase } from './_components/processing-phase';
import { useSparloContext } from './_lib/sparlo-context';
import { PROGRESS_PHASES } from './_lib/types';
import { useChat } from './_lib/use-chat';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

function HomePageContent() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const clarificationInputRef = useRef<HTMLTextAreaElement>(null);

  // Report navigation state
  const [activeSection, setActiveSection] =
    useState<string>('executive-summary');
  const [showToc, setShowToc] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  // Clarification response
  const [clarificationResponse, setClarificationResponse] = useState('');

  // Elapsed time for processing phase
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const {
    appState,
    currentPhase, // Explicit phase from state machine - no derivation needed
    activeConversation,
    activeReportId,
    reportData,
    pendingMessage,
    clarificationQuestion,
    error,
    isLoading,
    currentStep,
    sendMessage,
    skipClarification,
    startNewConversation,
    getActiveReportChatHistory,
    updateReportCache,
  } = useSparloContext();

  // Get chat history and convert timestamps from ISO strings to Date objects
  const initialChatMessages = useMemo(() => {
    const chatHistory = getActiveReportChatHistory();
    return chatHistory.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  }, [getActiveReportChatHistory]);

  // Chat functionality - extracted to custom hook for cleaner code
  const chat = useChat({
    reportId: activeReportId,
    reportMarkdown: reportData?.report_markdown ?? null,
    conversationTitle: activeConversation?.title ?? 'Technical Analysis Report',
    initialMessages: initialChatMessages,
    onCacheUpdate: updateReportCache,
  });

  // Generate TOC from report markdown
  const tocItems = useMemo((): TocItem[] => {
    if (!reportData?.report_markdown) return [];

    const headingRegex = /^##\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(reportData.report_markdown)) !== null) {
      const title = match[1]!.replace(/\*\*/g, '').trim();
      const id = generateSectionId(title);
      items.push({ id, title, level: 1 });
    }

    return items;
  }, [reportData?.report_markdown]);

  // Focus textarea on mount and when returning to input state
  useEffect(() => {
    if (textareaRef.current && appState === 'input' && !clarificationQuestion) {
      textareaRef.current.focus();
    }
  }, [appState, clarificationQuestion]);

  // Focus clarification input when question appears
  useEffect(() => {
    if (clarificationInputRef.current && clarificationQuestion) {
      clarificationInputRef.current.focus();
    }
  }, [clarificationQuestion]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chat.endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, chat.endRef]);

  // Track active section on scroll
  useEffect(() => {
    if (appState !== 'complete' || !reportData) return;

    const handleScroll = () => {
      const sections = tocItems.map((item) => ({
        id: item.id,
        element: document.getElementById(item.id),
      }));

      const scrollPosition = window.scrollY + 150;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section?.element && section.element.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [appState, reportData, tocItems]);

  // Handle initial submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle clarification response
  const handleClarificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationResponse.trim() || isLoading) return;
    const response = clarificationResponse.trim();
    setClarificationResponse('');
    await sendMessage(response);
  };

  const handleClarificationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleClarificationSubmit(e);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Note: currentPhase is now explicit from the state machine (use-sparlo.ts)
  // No longer derived from multiple variables - cleaner and more predictable

  // Track elapsed time during processing
  useEffect(() => {
    if (currentPhase !== 'processing') {
      setElapsedSeconds(0);
      return;
    }
    const timeInterval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timeInterval);
  }, [currentPhase]);

  // Progress percentage for generating phase
  const progressPercent = useMemo(() => {
    const stepOrder = [
      'AN0',
      'AN1',
      'AN1.5',
      'AN1.7',
      'AN2',
      'AN2-DIRECT',
      'AN3',
      'AN4',
      'AN4.5',
      'AN5',
    ];
    const idx = stepOrder.indexOf(currentStep);
    if (idx === -1) return 10;
    return Math.min(95, Math.round(((idx + 1) / stepOrder.length) * 100));
  }, [currentStep]);

  // Current progress phase based on percentage
  const currentProgressPhase = useMemo(() => {
    const found = PROGRESS_PHASES.find(
      (p) =>
        progressPercent >= p.duration[0] && progressPercent < p.duration[1],
    );
    return found || PROGRESS_PHASES[PROGRESS_PHASES.length - 1]!;
  }, [progressPercent]);

  // Render appropriate phase
  if (currentPhase === 'input') {
    return (
      <InputPhase
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        textareaRef={textareaRef}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
      />
    );
  }

  if (currentPhase === 'analyzing') {
    return <AnalyzingPhase pendingMessage={pendingMessage ?? undefined} />;
  }

  if (currentPhase === 'clarifying' && clarificationQuestion) {
    return (
      <ClarifyingPhase
        clarificationQuestion={clarificationQuestion}
        clarificationResponse={clarificationResponse}
        setClarificationResponse={setClarificationResponse}
        isLoading={isLoading}
        clarificationInputRef={clarificationInputRef}
        onSubmit={handleClarificationSubmit}
        onKeyDown={handleClarificationKeyDown}
        onSkip={skipClarification}
      />
    );
  }

  if (currentPhase === 'processing') {
    return (
      <ProcessingPhase
        progressPercent={progressPercent}
        currentProgressPhase={currentProgressPhase}
        elapsedSeconds={elapsedSeconds}
      />
    );
  }

  if (currentPhase === 'complete' && reportData) {
    return (
      <CompletePhase
        reportData={reportData}
        activeConversation={activeConversation}
        tocItems={tocItems}
        activeSection={activeSection}
        showToc={showToc}
        setShowToc={setShowToc}
        isChatOpen={chat.isOpen}
        setIsChatOpen={chat.setIsOpen}
        chatMessages={chat.messages}
        chatInput={chat.input}
        setChatInput={chat.setInput}
        isChatLoading={chat.isLoading}
        reportRef={reportRef}
        chatEndRef={chat.endRef}
        scrollToSection={scrollToSection}
        markdownComponents={markdownComponents}
        onStartNew={startNewConversation}
        onChatSubmit={chat.handleSubmit}
        onChatKeyDown={chat.handleKeyDown}
      />
    );
  }

  if (error) {
    return <ErrorPhase error={error} onStartNew={startNewConversation} />;
  }

  // Fallback - shouldn't reach here, but just in case
  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-[#FAFAFA] p-6 dark:bg-neutral-950">
      <Loader2 className="h-8 w-8 animate-spin text-[#7C3AED]" />
    </div>
  );
}

export default function HomePage() {
  return (
    <SparloErrorBoundary>
      <OfflineBanner />
      <HomePageContent />
    </SparloErrorBoundary>
  );
}
