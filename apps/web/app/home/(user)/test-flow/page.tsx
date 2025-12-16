'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  Lightbulb,
  List,
  Loader2,
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  Settings,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { cn } from '@kit/ui/utils';

import {
  MOCK_REPORT_MARKDOWN,
  MOCK_REPORT_METADATA,
  MOCK_REPORT_SUMMARY,
  MOCK_REPORT_TOC,
} from '../_lib/mock-report';
import { useSparloContext } from '../_lib/sparlo-context';
import { PROGRESS_PHASES, analyzeInputQuality } from '../_lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// SPARLO DESIGN SYSTEM v2: Deep Tech × Consumer Premium
// ═══════════════════════════════════════════════════════════════════════════
// Colors: Warm neutrals + purple accent (#7C3AED)
// Typography: Inter, 32px title, 18px headers, 16px body
// Spacing: 8px grid, 48px between sections, 24px within
// Corners: 8px default, 4px badges, 12px hero
// Shadows: Subtle and purposeful

type ViabilityLevel = 'GREEN' | 'YELLOW' | 'RED';

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

const DEFAULT_CONFIG = {
  analyzingDuration: 1500,
  generatingDuration: 5000,
  skipInput: false,
  prefilledChallenge: MOCK_REPORT_METADATA.challenge,
  useMockData: true,
};

type FlowPhase =
  | 'config'
  | 'input'
  | 'clarifying'
  | 'analyzing'
  | 'generating'
  | 'complete'
  | 'report';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ClarifyingQuestion {
  id: string;
  question: string;
  answer: string;
  isAnswered: boolean;
}

// TocItem interface is defined in mock-report.ts

export default function TestFlowPage() {
  const [phase, setPhase] = useState<FlowPhase>('config');
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [challengeText, setChallengeText] = useState(
    DEFAULT_CONFIG.prefilledChallenge,
  );
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Clarifying questions state
  const [clarifyingQuestions, setClarifyingQuestions] = useState<
    ClarifyingQuestion[]
  >([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Report navigation state
  const [activeSection, setActiveSection] =
    useState<string>('executive-summary');
  const [showToc, setShowToc] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  // Chat drawer state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get context for integration with main app (available for future use)
  const _sparloContext = useSparloContext();

  const currentProgressPhase = useMemo(() => {
    const found = PROGRESS_PHASES.find(
      (p) => progress >= p.duration[0] && progress < p.duration[1],
    );
    return found || PROGRESS_PHASES[PROGRESS_PHASES.length - 1]!;
  }, [progress]);

  const inputQuality = analyzeInputQuality(challengeText);
  const wordCount = challengeText.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = challengeText.trim().length >= 30;

  // Generate clarifying questions based on input
  const generateClarifyingQuestions = useCallback(async (input: string) => {
    setIsGeneratingQuestions(true);

    // Simulate AI generating questions based on input analysis
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const questions: ClarifyingQuestion[] = [];

    // Analyze input to generate relevant questions
    const hasScaleInfo = /scale|volume|capacity|throughput|amount/i.test(input);
    const hasTimelineInfo = /timeline|deadline|urgent|when|time/i.test(input);
    const hasBudgetInfo = /budget|cost|price|afford|investment/i.test(input);
    const hasConstraints =
      /constraint|must|require|limit|cannot|can't|need to/i.test(input);

    if (!hasScaleInfo) {
      questions.push({
        id: 'scale',
        question:
          'What scale are you targeting? (e.g., lab prototype, pilot plant, full production)',
        answer: '',
        isAnswered: false,
      });
    }

    if (!hasTimelineInfo) {
      questions.push({
        id: 'timeline',
        question: 'What is your target timeline for implementing a solution?',
        answer: '',
        isAnswered: false,
      });
    }

    if (!hasBudgetInfo) {
      questions.push({
        id: 'budget',
        question: 'Do you have budget constraints or a target cost per unit?',
        answer: '',
        isAnswered: false,
      });
    }

    if (!hasConstraints) {
      questions.push({
        id: 'constraints',
        question:
          'Are there any regulatory, safety, or technical constraints we should consider?',
        answer: '',
        isAnswered: false,
      });
    }

    // Always ask about success criteria if no other questions
    if (questions.length === 0) {
      questions.push({
        id: 'success',
        question:
          'What would success look like for this project? What metrics matter most?',
        answer: '',
        isAnswered: false,
      });
    }

    // Limit to ONE question max for better UX - take the most relevant one
    setClarifyingQuestions(questions.slice(0, 1));
    setIsGeneratingQuestions(false);
  }, []);

  const startFlow = useCallback(() => {
    if (config.skipInput) {
      setPhase('clarifying');
      generateClarifyingQuestions(challengeText);
    } else {
      setPhase('input');
    }
  }, [config.skipInput, challengeText, generateClarifyingQuestions]);

  const handleInputSubmit = useCallback(() => {
    setPhase('clarifying');
    generateClarifyingQuestions(challengeText);
  }, [challengeText, generateClarifyingQuestions]);

  const handleSkipClarification = useCallback(() => {
    setPhase('analyzing');
  }, []);

  const handleContinueWithAnswers = useCallback(() => {
    // Append answered questions to challenge text for better analysis
    const answeredQuestions = clarifyingQuestions.filter((q) => q.isAnswered);
    if (answeredQuestions.length > 0) {
      const additionalContext = answeredQuestions
        .map((q) => `${q.question}\n${q.answer}`)
        .join('\n\n');
      setChallengeText(
        (prev) => `${prev}\n\nAdditional Context:\n${additionalContext}`,
      );
    }
    setPhase('analyzing');
  }, [clarifyingQuestions]);

  const updateQuestionAnswer = useCallback((id: string, answer: string) => {
    setClarifyingQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, answer, isAnswered: answer.trim().length > 0 }
          : q,
      ),
    );
  }, []);

  // Keyboard shortcuts: Cmd+Enter to submit, Cmd+/ to toggle chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Enter to submit in various phases
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (phase === 'input' && canSubmit) {
          e.preventDefault();
          handleInputSubmit();
        }
        if (phase === 'clarifying' && !isGeneratingQuestions) {
          e.preventDefault();
          handleContinueWithAnswers();
        }
        if (phase === 'config') {
          e.preventDefault();
          startFlow();
        }
      }
      // Cmd+/ to toggle chat panel in report view
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        if (phase === 'report') {
          e.preventDefault();
          setIsChatOpen((prev) => !prev);
        }
      }
      // Escape to close chat
      if (e.key === 'Escape' && isChatOpen) {
        e.preventDefault();
        setIsChatOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    phase,
    canSubmit,
    handleInputSubmit,
    startFlow,
    handleContinueWithAnswers,
    isGeneratingQuestions,
    isChatOpen,
  ]);

  useEffect(() => {
    if (phase !== 'analyzing') return;
    const timer = setTimeout(() => {
      setPhase('generating');
      setProgress(0);
      setElapsedSeconds(0);
    }, config.analyzingDuration);
    return () => clearTimeout(timer);
  }, [phase, config.analyzingDuration]);

  useEffect(() => {
    if (phase !== 'generating') return;
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(
          prev + 100 / (config.generatingDuration / 100),
          100,
        );
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => setPhase('complete'), 300);
        }
        return newProgress;
      });
    }, 100);
    const timeInterval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => {
      clearInterval(progressInterval);
      clearInterval(timeInterval);
    };
  }, [phase, config.generatingDuration]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Track active section on scroll
  useEffect(() => {
    if (phase !== 'report') return;

    const handleScroll = () => {
      const sections = MOCK_REPORT_TOC.map((item) => ({
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
  }, [phase]);

  const resetFlow = useCallback(() => {
    setPhase('config');
    setProgress(0);
    setElapsedSeconds(0);
    setChatMessages([]);
    setIsChatOpen(false);
    setActiveSection('executive-summary');
    setClarifyingQuestions([]);
    setIsGeneratingQuestions(false);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const scrollToSection = useCallback((sectionId: string) => {
    // Try to find the element by ID
    let element = document.getElementById(sectionId);

    // If not found, try to find by normalized ID (for markdown-generated IDs)
    if (!element) {
      // Generate the same ID that the markdown component would generate
      const normalizedId = sectionId
        .toLowerCase()
        .replace(/['']/g, '')
        .replace(/&/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');
      element = document.getElementById(normalizedId);
    }

    if (element) {
      const offset = 120; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setActiveSection(sectionId);
    } else {
      console.warn(`Section not found: ${sectionId}`);
    }
  }, []);

  // Simulate streaming chat response - connected to Sparlo API with full report context
  const handleChatSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || isChatLoading) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: chatInput.trim(),
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, userMessage]);
      setChatInput('');
      setIsChatLoading(true);

      const assistantId = (Date.now() + 1).toString();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setChatMessages((prev) => [...prev, assistantMessage]);

      try {
        // Build full context including the entire report
        const fullContext = `You are an expert assistant helping a user understand and act on a Sparlo technical analysis report.

REPORT TITLE: ${MOCK_REPORT_METADATA.title}

CHALLENGE: ${MOCK_REPORT_METADATA.challenge}

CORE INSIGHT: ${MOCK_REPORT_METADATA.coreInsight}

LEAD RECOMMENDATION: ${MOCK_REPORT_METADATA.leadRecommendation}

VIABILITY: ${MOCK_REPORT_METADATA.viability} - ${MOCK_REPORT_METADATA.viabilitySummary}

CONFIDENCE: ${MOCK_REPORT_METADATA.confidence}

FULL REPORT CONTENT:
${MOCK_REPORT_MARKDOWN}

---

The user is viewing this report and has a question. Answer based on the report content above. Be specific and reference relevant sections. If the user asks about implementation, refer to the test protocols and next steps in the report.

USER QUESTION: ${chatInput.trim()}`;

        const response = await fetch('/api/sparlo/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: fullContext,
            mode: 'corpus',
          }),
        });

        if (!response.ok) {
          // Provide helpful local responses for common questions when API is unavailable
          const localResponses: Record<string, string> = {
            spray: `Based on the report, **spray drying is the lead recommendation** because it's the industry-standard approach used by Grace, BASF, and Albemarle for mixed oxide catalysts. It achieves D50 of 40-70 μm with HIGH confidence. The key advantage is that droplet physics—not sintering kinetics—controls particle size, which gives you much tighter control (±10% precision) than any solid-state process.`,
            risk: `The main risks identified in the report are:\n\n1. **Hollow shell formation** if drying too fast during spray drying\n2. **10-20% surface area loss** which could impact activity\n3. **Scale-up surprises** - lab spray dryers behave differently from production units\n4. **Four-metal kinetic mismatch** if using co-precipitation route\n\nEach has specific mitigations outlined in the test protocols.`,
            week: `**Week 1 recommendations:**\n\n1. Run PSD characterization on current product (2 hours on laser diffraction)\n2. Run staged calcination on one batch vs. control batch\n3. Run the KNO₃ flux experiment in parallel (add 1% to one batch)\n\nThis tells you whether classification alone gets you running, and whether fragmentation is contributing to your fines problem.`,
            default: `This is a test environment demonstrating the Sparlo report chat feature. In production, this would connect to the AI backend to answer questions about your specific report.\n\nThe report recommends **spray drying** as the primary approach for achieving D50 of 40-50 μm with high confidence. See the "Solution Concepts" section for detailed implementation guidance.`,
          };

          // Find matching local response
          const userQuestion = chatInput.toLowerCase();
          let localContent = localResponses['default']!;
          for (const [keyword, response] of Object.entries(localResponses)) {
            if (keyword !== 'default' && userQuestion.includes(keyword)) {
              localContent = response;
              break;
            }
          }

          // Simulate streaming for local response
          let displayedContent = '';
          const words = localContent.split(' ');
          for (let i = 0; i < words.length; i++) {
            await new Promise((resolve) =>
              setTimeout(resolve, 15 + Math.random() * 20),
            );
            displayedContent += (i > 0 ? ' ' : '') + words[i];
            setChatMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: displayedContent, isStreaming: true }
                  : msg,
              ),
            );
          }

          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, isStreaming: false } : msg,
            ),
          );
          return;
        }

        const data = await response.json();
        const content =
          data.response ||
          data.message ||
          'I apologize, but I was unable to generate a response. Please try again.';

        // Simulate streaming effect for the response
        let displayedContent = '';
        const words = content.split(' ');
        for (let i = 0; i < words.length; i++) {
          await new Promise((resolve) =>
            setTimeout(resolve, 20 + Math.random() * 30),
          );
          displayedContent += (i > 0 ? ' ' : '') + words[i];
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: displayedContent, isStreaming: true }
                : msg,
            ),
          );
        }

        // Mark streaming complete
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, isStreaming: false } : msg,
          ),
        );
      } catch {
        // On error, provide a helpful fallback response
        const fallbackContent = `I'm currently running in demo mode. In production, this would connect to the Sparlo AI to answer questions about your report.\n\n**Quick summary from the report:**\nThe recommended approach is spray drying to achieve D50 of 40-50 μm. Start with staged calcination (zero cost) this week, then run a toll spray dryer trial in Week 2.`;

        let displayedContent = '';
        const words = fallbackContent.split(' ');
        for (let i = 0; i < words.length; i++) {
          await new Promise((resolve) =>
            setTimeout(resolve, 15 + Math.random() * 20),
          );
          displayedContent += (i > 0 ? ' ' : '') + words[i];
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: displayedContent, isStreaming: true }
                : msg,
            ),
          );
        }

        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, isStreaming: false } : msg,
          ),
        );
      } finally {
        setIsChatLoading(false);
      }
    },
    [chatInput, isChatLoading],
  );

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit(e);
    }
  };

  // Helper function to generate consistent section IDs
  const generateSectionId = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/\*\*/g, '') // Remove markdown bold markers
      .replace(/['']/g, '') // Remove apostrophes
      .replace(/&/g, '') // Remove ampersands
      .replace(/[^\w\s-]/g, '') // Remove other special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/--+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .replace(/^[\d)]+\s*/, ''); // Remove leading numbers
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SPARLO DESIGN SYSTEM v2: Markdown Components
  // Premium document styling with refined typography and spacing
  // ═══════════════════════════════════════════════════════════════════════════
  const markdownComponents = {
    h2: ({ children, ...props }: React.HTMLProps<HTMLHeadingElement>) => {
      const text = String(children);
      const id = generateSectionId(text);
      return (
        <h2
          id={id}
          className="mt-12 mb-5 scroll-mt-28 border-b border-[#E5E5E5] pb-3 text-[22px] font-semibold tracking-tight text-[#1A1A1A] first:mt-0 dark:border-neutral-800 dark:text-white"
          {...props}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }: React.HTMLProps<HTMLHeadingElement>) => {
      const text = String(children);
      const id = generateSectionId(text);
      return (
        <h3
          id={id}
          className="mt-8 mb-3 scroll-mt-28 text-lg font-semibold text-[#1A1A1A] dark:text-white"
          {...props}
        >
          {children}
        </h3>
      );
    },
    h4: ({ children, ...props }: React.HTMLProps<HTMLHeadingElement>) => (
      <h4
        className="mt-6 mb-2 text-base font-semibold text-[#1A1A1A] dark:text-white"
        {...props}
      >
        {children}
      </h4>
    ),
    p: ({ children, ...props }: React.HTMLProps<HTMLParagraphElement>) => (
      <p
        className="mb-4 text-base leading-[1.7] text-[#4A4A4A] dark:text-neutral-300"
        {...props}
      >
        {children}
      </p>
    ),
    ul: ({ children, ...props }: React.HTMLProps<HTMLUListElement>) => (
      <ul className="mb-5 ml-1 space-y-2.5" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children }: React.HTMLProps<HTMLOListElement>) => (
      <ol className="mb-5 ml-1 list-inside list-decimal space-y-2.5">
        {children}
      </ol>
    ),
    li: ({ children, ...props }: React.HTMLProps<HTMLLIElement>) => (
      <li
        className="relative pl-2 leading-[1.7] text-[#4A4A4A] before:absolute before:left-[-12px] before:font-bold before:text-[#7C3AED] before:content-['•'] dark:text-neutral-300"
        {...props}
      >
        {children}
      </li>
    ),
    strong: ({ children, ...props }: React.HTMLProps<HTMLElement>) => (
      <strong
        className="font-semibold text-[#1A1A1A] dark:text-white"
        {...props}
      >
        {children}
      </strong>
    ),
    em: ({ children, ...props }: React.HTMLProps<HTMLElement>) => (
      <em className="text-[#4A4A4A] italic dark:text-neutral-300" {...props}>
        {children}
      </em>
    ),
    hr: () => <hr className="my-10 border-[#E5E5E5] dark:border-neutral-800" />,
    table: ({ children, ...props }: React.HTMLProps<HTMLTableElement>) => (
      <div className="mb-6 overflow-x-auto rounded-lg border border-[#E5E5E5] dark:border-neutral-800">
        <table className="min-w-full text-sm" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({
      children,
      ...props
    }: React.HTMLProps<HTMLTableSectionElement>) => (
      <thead className="bg-[#F5F5F5] dark:bg-neutral-900" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }: React.HTMLProps<HTMLTableCellElement>) => (
      <th
        className="border-b border-[#E5E5E5] px-4 py-3 text-left text-xs font-semibold tracking-wider text-[#1A1A1A] uppercase dark:border-neutral-800 dark:text-white"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }: React.HTMLProps<HTMLTableCellElement>) => (
      <td
        className="border-b border-[#E5E5E5] px-4 py-3 text-[#4A4A4A] last:border-b-0 dark:border-neutral-800 dark:text-neutral-300"
        {...props}
      >
        {children}
      </td>
    ),
    code: ({ children, className, ...props }: React.HTMLProps<HTMLElement>) => {
      const isBlock = className?.includes('language-');
      if (isBlock) {
        return (
          <pre className="mb-5 overflow-x-auto rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] p-4 font-mono text-sm dark:border-neutral-800 dark:bg-neutral-900">
            <code {...props}>{children}</code>
          </pre>
        );
      }
      return (
        <code
          className="rounded bg-[#F5F5F5] px-1.5 py-0.5 font-mono text-[13px] text-[#7C3AED] dark:bg-neutral-900"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }: React.HTMLProps<HTMLPreElement>) => (
      <pre
        className="mb-5 overflow-x-auto rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] p-4 font-mono text-sm whitespace-pre dark:border-neutral-800 dark:bg-neutral-900"
        {...props}
      >
        {children}
      </pre>
    ),
    blockquote: ({ children, ...props }: React.HTMLProps<HTMLQuoteElement>) => (
      <blockquote
        className="my-5 rounded-r-lg border-l-[3px] border-[#7C3AED] bg-[#FAFAFA] py-4 pr-4 pl-5 dark:bg-neutral-900/50"
        {...props}
      >
        <div className="leading-[1.7] text-[#4A4A4A] italic dark:text-neutral-300">
          {children}
        </div>
      </blockquote>
    ),
  };

  return (
    <div className="relative min-h-[calc(100vh-120px)]">
      <AnimatePresence mode="wait">
        {/* CONFIG: Developer tool panel */}
        {phase === 'config' && (
          <motion.div
            key="config"
            className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-full max-w-md space-y-6">
              <div className="flex items-center gap-3">
                <Settings className="text-muted-foreground h-5 w-5" />
                <span className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                  Test Configuration
                </span>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={config.skipInput}
                    onChange={(e) =>
                      setConfig({ ...config, skipInput: e.target.checked })
                    }
                    className="rounded"
                  />
                  Skip input phase
                </label>

                <div className="space-y-2">
                  <div className="text-muted-foreground flex justify-between text-sm">
                    <span>Generation time</span>
                    <span className="font-mono">
                      {config.generatingDuration / 1000}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2000}
                    max={15000}
                    step={1000}
                    value={config.generatingDuration}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        generatingDuration: Number(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>

                <Textarea
                  value={challengeText}
                  onChange={(e) => setChallengeText(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                  placeholder="Pre-filled challenge text..."
                />
              </div>

              <Button
                onClick={startFlow}
                className="w-full"
                data-test="start-test-flow"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Flow
                <span className="text-primary-foreground/60 ml-auto text-xs">
                  ⌘↵
                </span>
              </Button>
            </div>
          </motion.div>
        )}

        {/* INPUT: Clean, focused input */}
        {phase === 'input' && (
          <motion.div
            key="input"
            className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-full max-w-2xl space-y-8">
              {/* Brand mark - simple diamond */}
              <div className="flex justify-center">
                <motion.div
                  className="text-primary"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L22 12L12 22L2 12L12 2Z"
                      fill="currentColor"
                      opacity="0.15"
                    />
                    <path
                      d="M12 6L18 12L12 18L6 12L12 6Z"
                      fill="currentColor"
                    />
                  </svg>
                </motion.div>
              </div>

              {/* Single clear instruction */}
              <motion.h1
                className="text-center text-2xl font-semibold tracking-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Describe your engineering challenge
              </motion.h1>

              {/* Input area */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Textarea
                  value={challengeText}
                  onChange={(e) => setChallengeText(e.target.value)}
                  placeholder="What are you trying to solve? Include constraints, goals, and context for better results."
                  className="min-h-[180px] resize-none text-base leading-relaxed"
                  data-test="problem-input-textarea"
                />

                {/* Minimal quality feedback */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground text-sm tabular-nums">
                      {wordCount} words
                    </span>
                    {canSubmit && (
                      <div className="flex items-center gap-3">
                        {[
                          {
                            check: inputQuality.checks.hasChallenge,
                            label: 'Problem',
                          },
                          {
                            check: inputQuality.checks.hasConstraints,
                            label: 'Constraints',
                          },
                          {
                            check: inputQuality.checks.hasGoals,
                            label: 'Goals',
                          },
                          {
                            check: inputQuality.checks.hasContext,
                            label: 'Context',
                          },
                        ].map(({ check, label }) => (
                          <div
                            key={label}
                            className={cn(
                              'flex items-center gap-1 text-xs transition-colors',
                              check
                                ? 'text-primary'
                                : 'text-muted-foreground/50',
                            )}
                          >
                            <div
                              className={cn(
                                'h-1.5 w-1.5 rounded-full transition-colors',
                                check ? 'bg-primary' : 'bg-muted',
                              )}
                            />
                            <span className="hidden sm:inline">{label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleInputSubmit}
                    disabled={!canSubmit}
                    data-test="generate-report-button"
                  >
                    Generate
                    <span className="text-primary-foreground/60 ml-2 text-xs">
                      ⌘↵
                    </span>
                  </Button>
                </div>

                {/* Time notice - prominent, honest */}
                <p className="text-muted-foreground text-center text-sm">
                  Analysis takes 5-10 minutes. Safe to leave this page.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* CLARIFYING: AI asks clarifying questions */}
        {phase === 'clarifying' && (
          <motion.div
            key="clarifying"
            className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-full max-w-2xl space-y-8">
              {/* Header */}
              <div className="text-center">
                <motion.div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <MessageSquare className="h-6 w-6 text-[#7C3AED]" />
                </motion.div>
                <motion.h1
                  className="text-2xl font-semibold tracking-tight text-[#1A1A1A] dark:text-white"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Quick question
                </motion.h1>
                <motion.p
                  className="mt-2 text-[#6A6A6A]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Help us understand your challenge better for more accurate
                  results
                </motion.p>
              </div>

              {/* Loading state */}
              {isGeneratingQuestions && (
                <motion.div
                  className="flex flex-col items-center gap-4 py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Loader2 className="h-8 w-8 animate-spin text-[#7C3AED]" />
                  <p className="text-sm text-[#8A8A8A]">
                    Analyzing your challenge...
                  </p>
                </motion.div>
              )}

              {/* Questions */}
              {!isGeneratingQuestions && clarifyingQuestions.length > 0 && (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {clarifyingQuestions.map((q, index) => (
                    <motion.div
                      key={q.id}
                      className="rounded-xl border border-[#E5E5E5] bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-[#1A1A1A] dark:text-white">
                          {q.question}
                        </span>
                        <Textarea
                          value={q.answer}
                          onChange={(e) =>
                            updateQuestionAnswer(q.id, e.target.value)
                          }
                          placeholder="Type your answer (optional)"
                          className="min-h-[80px] resize-none text-sm"
                        />
                      </label>
                    </motion.div>
                  ))}

                  {/* Actions */}
                  <motion.div
                    className="flex items-center justify-between pt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={handleSkipClarification}
                      className="text-[#6B6B6B] hover:text-[#1A1A1A] dark:text-neutral-400 dark:hover:text-white"
                    >
                      Skip and proceed
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleContinueWithAnswers}
                      className="bg-[#7C3AED] hover:bg-[#6D28D9]"
                    >
                      Answer and continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>

                  <p className="text-center text-sm text-[#8A8A8A]">
                    You can skip this question if you prefer to proceed with the
                    information already provided.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ANALYZING: Brief transition state */}
        {phase === 'analyzing' && (
          <motion.div
            key="analyzing"
            className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <motion.div
                className="text-primary mx-auto mb-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L22 12L12 22L2 12L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </motion.div>
              <p className="text-muted-foreground">
                Analyzing your challenge...
              </p>
            </div>
          </motion.div>
        )}

        {/* GENERATING: Focused progress */}
        {phase === 'generating' && (
          <motion.div
            key="generating"
            className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-full max-w-md space-y-8">
              {/* Single animated brand mark */}
              <div className="flex justify-center">
                <motion.div
                  className="text-primary"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L22 12L12 22L2 12L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                    <motion.path
                      d="M12 6L18 12L12 18L6 12L12 6Z"
                      fill="currentColor"
                      animate={{ scale: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </svg>
                </motion.div>
              </div>

              {/* Current phase - single line, animated */}
              <div className="text-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentProgressPhase.id}
                    className="text-lg font-medium"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {currentProgressPhase.label}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Clean progress bar */}
              <div className="space-y-3">
                <div className="bg-muted h-1 overflow-hidden rounded-full">
                  <motion.div
                    className="bg-primary h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1, ease: 'easeOut' }}
                  />
                </div>
                <div className="text-muted-foreground flex justify-between text-sm">
                  <span>{formatTime(elapsedSeconds)} elapsed</span>
                  <span>~{Math.ceil(config.generatingDuration / 1000)}s</span>
                </div>
              </div>

              {/* Safe to leave - inline, not a card */}
              <motion.p
                className="text-muted-foreground text-center text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Safe to leave — check back anytime.
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* COMPLETE: Lead with the insight - Sparlo Design System v2 */}
        {phase === 'complete' && (
          <motion.div
            key="complete"
            className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-[#FAFAFA] p-6 dark:bg-neutral-950"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-full max-w-xl space-y-8 text-center">
              {/* Success indicator - refined */}
              <motion.div
                className="flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                  <Check
                    className="h-8 w-8 text-emerald-500"
                    strokeWidth={2.5}
                  />
                </div>
              </motion.div>

              {/* The headline finding - THE star of the show */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-600 uppercase dark:bg-emerald-900/20 dark:text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  Analysis Complete
                </div>
                <h1 className="text-[28px] leading-tight font-semibold text-[#1A1A1A] dark:text-white">
                  {MOCK_REPORT_SUMMARY.headlineFinding}
                </h1>
                <p className="text-base text-[#6A6A6A]">
                  {MOCK_REPORT_SUMMARY.title}
                </p>
              </motion.div>

              {/* Stats - secondary, refined */}
              <motion.div
                className="flex justify-center gap-6 text-sm text-[#8A8A8A]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
                  {MOCK_REPORT_SUMMARY.conceptCount} concepts
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {MOCK_REPORT_SUMMARY.recommendedCount} recommended
                </span>
                <span>{formatTime(elapsedSeconds)}</span>
              </motion.div>

              {/* CTA - dominant with accent glow */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={() => setPhase('report')}
                  size="lg"
                  className="rounded-lg bg-[#7C3AED] px-8 text-white hover:bg-[#6D28D9]"
                  style={{
                    boxShadow: '0 4px 14px -2px rgba(124, 58, 237, 0.4)',
                  }}
                  data-test="view-report-button"
                >
                  View Full Report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════
            REPORT: Premium Document Experience
            Sparlo Design System v2 - Deep Tech × Consumer Premium
            ═══════════════════════════════════════════════════════════════════════════ */}
        {phase === 'report' && (
          <motion.div
            key="report"
            className="relative min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Two-column layout: Sticky TOC + Content */}
            <div className="flex">
              {/* Sticky TOC Sidebar - Within content flow, not fixed */}
              <AnimatePresence>
                {showToc && (
                  <motion.aside
                    className="hidden w-64 flex-shrink-0 lg:block"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 256 }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="sticky top-20 h-[calc(100vh-80px)] overflow-y-auto border-r border-[#E5E5E5] bg-white dark:border-neutral-800 dark:bg-neutral-900">
                      <div className="p-5">
                        <div className="mb-5 flex items-center justify-between">
                          <span className="text-xs font-semibold tracking-[0.1em] text-[#8A8A8A] uppercase">
                            Contents
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-[#8A8A8A] hover:text-[#1A1A1A] dark:hover:text-white"
                            onClick={() => setShowToc(false)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <nav className="space-y-0.5">
                          {MOCK_REPORT_TOC.map((item, index) => (
                            <button
                              key={item.id}
                              onClick={() => scrollToSection(item.id)}
                              className={cn(
                                'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-all duration-150',
                                activeSection === item.id
                                  ? 'bg-[#7C3AED]/10 font-medium text-[#7C3AED]'
                                  : 'text-[#6A6A6A] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] dark:hover:bg-neutral-800 dark:hover:text-white',
                              )}
                            >
                              <span
                                className={cn(
                                  'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-semibold transition-colors',
                                  activeSection === item.id
                                    ? 'bg-[#7C3AED] text-white'
                                    : 'bg-[#E5E5E5] text-[#8A8A8A] group-hover:bg-[#7C3AED]/20 group-hover:text-[#7C3AED] dark:bg-neutral-700',
                                )}
                              >
                                {index + 1}
                              </span>
                              <span className="truncate">{item.title}</span>
                            </button>
                          ))}
                        </nav>
                      </div>

                      {/* Progress indicator at bottom */}
                      <div className="absolute right-0 bottom-0 left-0 border-t border-[#E5E5E5] bg-[#F5F5F5] p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                        <div className="mb-2 flex items-center justify-between text-xs text-[#8A8A8A]">
                          <span>Progress</span>
                          <span className="font-medium">
                            {Math.round(
                              ((MOCK_REPORT_TOC.findIndex(
                                (t) => t.id === activeSection,
                              ) +
                                1) /
                                MOCK_REPORT_TOC.length) *
                                100,
                            )}
                            %
                          </span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-[#E5E5E5] dark:bg-neutral-800">
                          <motion.div
                            className="h-full bg-[#7C3AED]"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${((MOCK_REPORT_TOC.findIndex((t) => t.id === activeSection) + 1) / MOCK_REPORT_TOC.length) * 100}%`,
                            }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.aside>
                )}
              </AnimatePresence>

              {/* TOC Toggle Button (when hidden) */}
              {!showToc && (
                <motion.button
                  className="fixed top-24 left-[calc(var(--sidebar-width,0px)+16px)] z-40 hidden items-center gap-2 rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 shadow-md transition-all hover:shadow-lg lg:flex dark:border-neutral-800 dark:bg-neutral-900"
                  onClick={() => setShowToc(true)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <List className="h-4 w-4 text-[#6A6A6A]" />
                  <span className="text-xs text-[#6A6A6A]">Contents</span>
                </motion.button>
              )}

              {/* Main Content Area */}
              <div
                ref={reportRef}
                className={cn(
                  'min-w-0 flex-1 px-6 py-10 transition-all duration-300',
                  isChatOpen && 'lg:mr-[420px]',
                )}
              >
                <div className="mx-auto max-w-3xl">
                  {/* Report Header - Premium Typography */}
                  <header className="mb-10">
                    <div className="mb-6 flex items-start justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-[#8A8A8A] uppercase">
                          <Sparkles className="h-3.5 w-3.5" />
                          Sparlo Analysis Report
                        </div>
                        <h1 className="text-[32px] leading-tight font-semibold tracking-tight text-[#1A1A1A] dark:text-white">
                          {MOCK_REPORT_METADATA.title}
                        </h1>
                        <p className="max-w-2xl text-base leading-relaxed text-[#6A6A6A]">
                          {MOCK_REPORT_METADATA.challenge}
                        </p>
                      </div>
                      <ViabilityBadge
                        viability={MOCK_REPORT_METADATA.viability}
                      />
                    </div>

                    {/* Meta info + Action buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-[#8A8A8A]">
                        <span>
                          {MOCK_REPORT_METADATA.conceptCount} concepts analyzed
                        </span>
                        <span className="text-[#E5E5E5]">•</span>
                        <span>
                          {MOCK_REPORT_METADATA.recommendedCount} recommended
                        </span>
                        <span className="text-[#E5E5E5]">•</span>
                        <span>~8 min read</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg border-[#E5E5E5] text-[#6A6A6A] hover:bg-[#F5F5F5] hover:text-[#1A1A1A]"
                        >
                          <Download className="mr-2 h-3.5 w-3.5" />
                          Export
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg border-[#E5E5E5] text-[#6A6A6A] hover:bg-[#F5F5F5] hover:text-[#1A1A1A]"
                        >
                          <Share2 className="mr-2 h-3.5 w-3.5" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </header>

                  {/* ═══════════════════════════════════════════════════════════════════
                  Core Insight Card - The Hero Element
                  3px left border accent, subtle background, 12px radius
                  ═══════════════════════════════════════════════════════════════════ */}
                  <motion.section
                    id="executive-summary"
                    className="relative mb-12 overflow-hidden rounded-xl border-l-[3px] border-[#7C3AED] bg-white shadow-sm dark:bg-neutral-900"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#7C3AED]/10">
                          <Lightbulb className="h-5 w-5 text-[#7C3AED]" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-[#1A1A1A] dark:text-white">
                              Core Insight
                            </h2>
                            <span className="rounded bg-[#7C3AED]/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#7C3AED] uppercase">
                              Key Finding
                            </span>
                          </div>
                          <p className="text-[15px] leading-[1.7] text-[#4A4A4A] dark:text-neutral-300">
                            {MOCK_REPORT_METADATA.coreInsight}
                          </p>
                          <div className="border-t border-[#E5E5E5] pt-3 dark:border-neutral-800">
                            <div className="flex items-start gap-2">
                              <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7C3AED]" />
                              <div>
                                <p className="text-sm font-medium text-[#1A1A1A] dark:text-white">
                                  {MOCK_REPORT_METADATA.leadRecommendation}
                                </p>
                                <p className="mt-1 text-xs text-[#8A8A8A]">
                                  Confidence: {MOCK_REPORT_METADATA.confidence}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.section>

                  {/* Full Report Markdown - Premium Document Styling */}
                  <motion.div
                    className="rounded-xl bg-white p-8 shadow-sm lg:p-10 dark:bg-neutral-900"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <ReactMarkdown components={markdownComponents}>
                      {/* Render full report - Executive Summary will still be in markdown but that's OK */}
                      {MOCK_REPORT_MARKDOWN}
                    </ReactMarkdown>
                  </motion.div>

                  {/* Bottom spacer for chat */}
                  <div className="h-32" />
                </div>
              </div>
            </div>

            {/* Chat Toggle Button - Premium Floating Action */}
            {!isChatOpen && (
              <motion.button
                className="fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-full bg-[#7C3AED] px-5 py-3.5 text-white shadow-lg transition-shadow hover:shadow-xl"
                style={{ boxShadow: '0 4px 14px -2px rgba(124, 58, 237, 0.4)' }}
                onClick={() => setIsChatOpen(true)}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Ask about this report
                </span>
                <span className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium">
                  ⌘/
                </span>
              </motion.button>
            )}

            {/* Chat Drawer - Refined Conversational UI */}
            <AnimatePresence>
              {isChatOpen && (
                <motion.div
                  className="fixed top-0 right-0 z-50 flex h-full w-[420px] flex-col border-l border-[#E5E5E5] bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
                  initial={{ x: 420 }}
                  animate={{ x: 0 }}
                  exit={{ x: 420 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                >
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-[#E5E5E5] px-5 py-4 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]/10">
                        <MessageSquare className="h-4 w-4 text-[#7C3AED]" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-[#1A1A1A] dark:text-white">
                          Chat with Report
                        </span>
                        <p className="text-[10px] text-[#8A8A8A]">
                          Ask follow-up questions
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#8A8A8A] hover:text-[#1A1A1A] dark:hover:text-white"
                      onClick={() => setIsChatOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    {chatMessages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F5F5] dark:bg-neutral-800">
                          <MessageSquare className="h-7 w-7 text-[#8A8A8A]" />
                        </div>
                        <p className="text-base font-semibold text-[#1A1A1A] dark:text-white">
                          Ask anything about this report
                        </p>
                        <p className="mt-2 max-w-[280px] text-sm text-[#8A8A8A]">
                          Get clarification, explore alternatives, or dive
                          deeper into specific concepts.
                        </p>
                        <div className="mt-8 w-full space-y-2">
                          <button
                            className="w-full rounded-lg border border-[#E5E5E5] px-4 py-3 text-left text-sm text-[#4A4A4A] transition-all hover:border-[#7C3AED]/30 hover:bg-[#F5F5F5] hover:text-[#1A1A1A] dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                            onClick={() =>
                              setChatInput(
                                'Why is spray drying the lead recommendation?',
                              )
                            }
                          >
                            Why is spray drying the lead recommendation?
                          </button>
                          <button
                            className="w-full rounded-lg border border-[#E5E5E5] px-4 py-3 text-left text-sm text-[#4A4A4A] transition-all hover:border-[#7C3AED]/30 hover:bg-[#F5F5F5] hover:text-[#1A1A1A] dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                            onClick={() =>
                              setChatInput('What are the main risks with C-02?')
                            }
                          >
                            What are the main risks with C-02?
                          </button>
                          <button
                            className="w-full rounded-lg border border-[#E5E5E5] px-4 py-3 text-left text-sm text-[#4A4A4A] transition-all hover:border-[#7C3AED]/30 hover:bg-[#F5F5F5] hover:text-[#1A1A1A] dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                            onClick={() =>
                              setChatInput('What should I do in week 1?')
                            }
                          >
                            What should I do in week 1?
                          </button>
                        </div>
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex',
                            msg.role === 'user'
                              ? 'justify-end'
                              : 'justify-start',
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[85%] rounded-2xl px-4 py-3',
                              msg.role === 'user'
                                ? 'rounded-br-md bg-[#7C3AED] text-white'
                                : 'rounded-bl-md bg-[#F5F5F5] text-[#1A1A1A] dark:bg-neutral-800 dark:text-white',
                            )}
                          >
                            {msg.role === 'assistant' ? (
                              <div className="text-sm leading-relaxed">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => (
                                      <p className="mb-2 last:mb-0">
                                        {children}
                                      </p>
                                    ),
                                    strong: ({ children }) => (
                                      <strong className="font-semibold">
                                        {children}
                                      </strong>
                                    ),
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                                {msg.isStreaming && (
                                  <span className="inline-block animate-pulse text-[#7C3AED]">
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

                  {/* Chat Input - Refined */}
                  <form
                    onSubmit={handleChatSubmit}
                    className="border-t border-[#E5E5E5] bg-[#FAFAFA] p-4 dark:border-neutral-800 dark:bg-neutral-900/50"
                  >
                    <div className="flex gap-2">
                      <Textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleChatKeyDown}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset button - consistent position at top-left of viewport */}
      {phase !== 'config' && phase !== 'input' && (
        <motion.div
          className="fixed top-4 left-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFlow}
            data-test="reset-flow"
            className="text-muted-foreground hover:bg-muted/50"
          >
            <RotateCcw className="mr-2 h-3 w-3" />
            Reset
          </Button>
        </motion.div>
      )}

      {/* Phase indicator - minimal dots (excludes config phase for cleaner UX) */}
      {phase !== 'report' && phase !== 'config' && (
        <div className="fixed bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5">
          {['input', 'clarifying', 'analyzing', 'generating', 'complete'].map(
            (p, i) => {
              const phases = [
                'input',
                'clarifying',
                'analyzing',
                'generating',
                'complete',
              ];
              const currentIndex = phases.indexOf(phase);
              return (
                <div
                  key={p}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-all duration-300',
                    i === currentIndex
                      ? 'bg-primary w-4'
                      : i < currentIndex
                        ? 'bg-primary/40'
                        : 'bg-muted',
                  )}
                />
              );
            },
          )}
        </div>
      )}
    </div>
  );
}
