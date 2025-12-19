'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Lock,
  Paperclip,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

import { Alert, AlertDescription } from '@kit/ui/alert';
import { cn } from '@kit/ui/utils';

import { ProcessingScreen } from '../../_components/processing-screen';
import { startReportGeneration } from '../../_lib/server/sparlo-reports-server-actions';
import { useReportProgress } from '../../_lib/use-report-progress';

type PagePhase = 'input' | 'processing';

interface FormState {
  phase: PagePhase;
  challengeText: string;
  reportId: string | null;
  isSubmitting: boolean;
  error: string | null;
  showRefusalWarning: boolean;
}

interface ContextDetection {
  id: string;
  label: string;
  patterns: RegExp[];
}

const CONTEXT_DETECTIONS: ContextDetection[] = [
  {
    id: 'technical-goals',
    label: 'Technical Goals',
    patterns: [
      /reduce|improve|increase|decrease|optimize|minimize|maximize/i,
      /under\s+\d+|above\s+\d+|within\s+\d+/i,
      /accuracy|precision|tolerance|efficiency/i,
    ],
  },
  {
    id: 'material-constraints',
    label: 'Material Constraints',
    patterns: [
      /material|steel|aluminum|plastic|composite|alloy|polymer/i,
      /weight|mass|density|strength|durability/i,
      /temperature|thermal|heat|cold/i,
    ],
  },
  {
    id: 'cost-parameters',
    label: 'Cost Parameters',
    patterns: [
      /cost|budget|price|expense|affordable/i,
      /volume|units\/year|production|manufacturing/i,
      /cannot increase cost|low.?cost|cost.?effective/i,
    ],
  },
];

const initialFormState: FormState = {
  phase: 'input',
  challengeText: '',
  reportId: null,
  isSubmitting: false,
  error: null,
  showRefusalWarning: false,
};

export default function NewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<FormState>(initialFormState);

  const {
    phase,
    challengeText,
    reportId,
    isSubmitting,
    error,
    showRefusalWarning,
  } = formState;

  // Handle URL params for prefill and error state
  useEffect(() => {
    const prefill = searchParams.get('prefill');
    const errorType = searchParams.get('error');

    if (prefill || errorType === 'refusal') {
      setFormState((prev) => ({
        ...prev,
        challengeText: prefill || prev.challengeText,
        showRefusalWarning: errorType === 'refusal',
      }));
    }

    // Clear params from URL without navigation
    if (prefill || errorType) {
      window.history.replaceState({}, '', '/home/reports/new');
    }
  }, [searchParams]);

  // Track progress once we have a report ID
  const { progress } = useReportProgress(reportId);

  const canSubmit = challengeText.trim().length >= 50;

  // Detect context from input text
  const detectedContexts = useMemo(() => {
    const detected = new Set<string>();
    for (const context of CONTEXT_DETECTIONS) {
      for (const pattern of context.patterns) {
        if (pattern.test(challengeText)) {
          detected.add(context.id);
          break;
        }
      }
    }
    return detected;
  }, [challengeText]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;

    setFormState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const result = await startReportGeneration({
        designChallenge: challengeText.trim(),
      });

      if (result.reportId) {
        setFormState((prev) => ({
          ...prev,
          reportId: result.reportId,
          phase: 'processing',
          isSubmitting: false,
        }));
      }
    } catch (err) {
      console.error('Failed to start report:', err);
      setFormState((prev) => ({
        ...prev,
        error:
          err instanceof Error
            ? err.message
            : 'Failed to start report generation',
        isSubmitting: false,
      }));
    }
  }, [canSubmit, challengeText, isSubmitting]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleViewReport = useCallback(() => {
    if (reportId) {
      router.push(`/home/reports/${reportId}`);
    }
  }, [reportId, router]);

  // Show processing screen when we have a report in progress
  if (phase === 'processing' && progress) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-[--surface-base]">
        <ProcessingScreen
          progress={progress}
          onComplete={handleViewReport}
          designChallenge={challengeText}
        />
      </div>
    );
  }

  // Input phase - Aura.build inspired design
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center bg-[--surface-base] px-4 py-12 text-[--text-secondary]"
      style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
    >
      {/* Ambient Background Glows - only visible in dark mode */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-900/10 opacity-0 blur-[120px] dark:opacity-50" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-emerald-900/5 opacity-0 blur-[100px] dark:opacity-50" />

      <div className="relative z-10 w-full max-w-4xl">
        {/* Refusal warning */}
        {showRefusalWarning && (
          <div className="mb-6">
            <Alert
              variant="destructive"
              className="border-red-200 bg-red-50 text-red-800 dark:border-[#7f1d1d] dark:bg-[#7f1d1d]/10 dark:text-[#fca5a5]"
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>
                  Your previous query was flagged by our AI safety filters.
                </strong>{' '}
                This is often a false positive for legitimate engineering
                problems. Please rephrase your challenge, focusing on the
                engineering aspects.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Main Input Card */}
        <div className="group relative rounded-2xl bg-[--surface-overlay] p-[1px] transition-all duration-500 dark:bg-neutral-900/40">
          {/* Glowing border effect */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-black/5 via-black/[0.02] to-transparent opacity-50 transition-opacity duration-500 group-hover:opacity-100 dark:from-white/10 dark:via-white/5" />

          <div className="relative flex flex-col overflow-hidden rounded-2xl bg-[--surface-elevated] shadow-lg dark:shadow-2xl dark:shadow-black/50">
            {/* Toolbar / Context Hinting */}
            <div className="flex items-center justify-between border-b border-[--border-subtle] bg-[--surface-overlay] px-6 py-3 dark:bg-neutral-900/20">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[--text-muted]">
                <Terminal className="h-4 w-4 text-[--text-muted]" />
                <span>new analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="group/btn flex items-center gap-1.5 rounded-md border border-[--border-subtle] bg-transparent px-3 py-1.5 text-xs text-[--text-secondary] transition-all hover:border-[--border-default] hover:bg-[--surface-overlay] hover:text-[--text-primary]"
                >
                  Attach
                  <Paperclip className="h-3 w-3 transition-colors group-hover/btn:text-emerald-500" />
                </button>
              </div>
            </div>

            {/* Text Area - Full height */}
            <div className="flex min-h-[320px] flex-col p-6 md:p-8">
              <textarea
                value={challengeText}
                onChange={(e) => {
                  setFormState((prev) => ({
                    ...prev,
                    challengeText: e.target.value,
                    showRefusalWarning: false,
                  }));
                }}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                autoFocus
                data-test="challenge-input"
                placeholder="Describe the engineering challenge..."
                spellCheck={false}
                className="min-h-[240px] flex-1 resize-none border-0 bg-transparent text-lg font-light leading-relaxed text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-0 disabled:opacity-40 md:text-xl"
                style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
              />
            </div>

            {/* Context Awareness / Intelligence Layer */}
            <div className="px-6 pb-6 md:px-8 md:pb-8">
              <div className="flex select-none flex-wrap items-center gap-3">
                <span className="mr-1 font-mono text-xs font-medium uppercase tracking-widest text-[--text-muted]">
                  Context Detection
                </span>

                {CONTEXT_DETECTIONS.map((context) => {
                  const isDetected = detectedContexts.has(context.id);
                  return (
                    <div
                      key={context.id}
                      className={cn(
                        'flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-500',
                        isDetected
                          ? 'border border-emerald-500/30 bg-emerald-500/10 dark:border-emerald-500/20'
                          : 'border border-dashed border-[--border-default] bg-transparent text-[--text-muted]',
                      )}
                    >
                      <div
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          isDetected
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)] dark:bg-emerald-400'
                            : 'bg-[--text-muted]',
                        )}
                      />
                      <span
                        className={cn(
                          'text-xs font-medium',
                          isDetected ? 'text-emerald-700 dark:text-emerald-200/90' : 'text-[--text-muted]',
                        )}
                        style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                      >
                        {context.label}
                      </span>
                      {isDetected && (
                        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400/80" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer / Action Area */}
            <div className="border-t border-[--border-subtle] bg-[--surface-overlay] p-2 dark:bg-neutral-900/30">
              <div className="flex flex-col items-center justify-between gap-4 px-4 py-2 md:flex-row">
                {/* Compute Estimate */}
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[--border-subtle] bg-[--surface-base] dark:bg-neutral-900">
                    <Clock className="h-4 w-4 text-[--text-muted]" />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider text-[--text-muted]"
                      style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                    >
                      ANALYSIS
                    </span>
                    <span
                      className="font-mono text-xs text-[--text-secondary]"
                      style={{ fontFamily: 'Soehne Mono, JetBrains Mono, monospace' }}
                    >
                      ~15 MINUTES
                    </span>
                  </div>
                </div>

                {/* Primary Action with keyboard shortcut */}
                <div className="flex items-center gap-3">
                  {/* Keyboard shortcut hint */}
                  <div className="hidden items-center gap-1.5 md:flex">
                    <kbd className="flex h-5 items-center justify-center rounded border border-[--border-default] bg-[--surface-overlay] px-1.5 font-mono text-[10px] text-[--text-muted]">
                      ⌘
                    </kbd>
                    <kbd className="flex h-5 items-center justify-center rounded border border-[--border-default] bg-[--surface-overlay] px-1.5 font-mono text-[10px] text-[--text-muted]">
                      ↵
                    </kbd>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    data-test="challenge-submit"
                    className={cn(
                      'group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg px-6 py-3 transition-all duration-300 md:w-auto',
                      canSubmit && !isSubmitting
                        ? 'bg-[--text-primary] text-[--surface-base] shadow-lg hover:opacity-90 dark:bg-white dark:text-black dark:shadow-[0_0_20px_rgba(255,255,255,0.05)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]'
                        : 'cursor-not-allowed bg-[--surface-overlay] text-[--text-muted] dark:bg-neutral-800 dark:text-neutral-500',
                    )}
                  >
                    <span
                      className="relative z-10 text-sm font-semibold tracking-tight"
                      style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                    >
                      {isSubmitting ? 'Running...' : 'Run Analysis'}
                    </span>
                    {!isSubmitting && (
                      <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p
            className="mt-4 text-center text-sm text-red-600 dark:text-red-400"
            style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
          >
            {error}
          </p>
        )}

        {/* Trust / Capability Indicators - Always visible */}
        <div className="mt-8 flex flex-col items-center justify-center gap-6 opacity-60 md:flex-row">
          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3 text-[--text-muted]" />
            <span
              className="font-mono text-xs tracking-tight text-[--text-secondary]"
              style={{ fontFamily: 'Soehne Mono, JetBrains Mono, monospace' }}
            >
              DATA NEVER TRAINS AI
            </span>
          </div>
          <div className="hidden h-3 w-px bg-[--border-default] md:block" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-500" />
            <span
              className="font-mono text-xs tracking-tight text-[--text-secondary]"
              style={{ fontFamily: 'Soehne Mono, JetBrains Mono, monospace' }}
            >
              BUILT ON SOC2 INFRASTRUCTURE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
