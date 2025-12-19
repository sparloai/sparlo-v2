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
      <div className="min-h-[calc(100vh-120px)] bg-[#050505]">
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
      className="relative flex min-h-screen flex-col items-center justify-center bg-[#050505] px-4 py-12 text-neutral-300"
      style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
    >
      {/* Ambient Background Glows */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-900/10 opacity-50 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-emerald-900/5 opacity-50 blur-[100px]" />

      <div className="relative z-10 w-full max-w-4xl">
        {/* Refusal warning */}
        {showRefusalWarning && (
          <div className="mb-6">
            <Alert
              variant="destructive"
              className="border-[#7f1d1d] bg-[#7f1d1d]/10 text-[#fca5a5]"
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
        <div className="group relative rounded-2xl bg-neutral-900/40 p-[1px] transition-all duration-500">
          {/* Glowing border effect */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/10 via-white/5 to-transparent opacity-50 transition-opacity duration-500 group-hover:opacity-100" />

          <div className="relative flex flex-col overflow-hidden rounded-2xl bg-[#0A0A0A] shadow-2xl shadow-black/50">
            {/* Toolbar / Context Hinting */}
            <div className="flex items-center justify-between border-b border-white/5 bg-neutral-900/20 px-6 py-3">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-neutral-400">
                <Terminal className="h-4 w-4 text-neutral-400" />
                <span>new analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="group/btn flex items-center gap-1.5 rounded-md border border-white/5 bg-transparent px-3 py-1.5 text-xs text-neutral-300 transition-all hover:border-white/10 hover:bg-white/5 hover:text-white"
                >
                  Attach
                  <Paperclip className="h-3 w-3 transition-colors group-hover/btn:text-emerald-400" />
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
                className="min-h-[240px] flex-1 resize-none border-0 bg-transparent text-lg font-light leading-relaxed text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-0 disabled:opacity-40 md:text-xl"
                style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
              />
            </div>

            {/* Context Awareness / Intelligence Layer */}
            <div className="px-6 pb-6 md:px-8 md:pb-8">
              <div className="flex select-none flex-wrap items-center gap-3">
                <span className="mr-1 font-mono text-xs font-medium uppercase tracking-widest text-neutral-400">
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
                          ? 'border border-emerald-500/20 bg-emerald-500/10'
                          : 'border border-dashed border-neutral-700 bg-transparent text-neutral-500',
                      )}
                    >
                      <div
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          isDetected
                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                            : 'bg-neutral-600',
                        )}
                      />
                      <span
                        className={cn(
                          'text-xs font-medium',
                          isDetected ? 'text-emerald-200/90' : 'text-neutral-400',
                        )}
                        style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                      >
                        {context.label}
                      </span>
                      {isDetected && (
                        <Check className="h-3 w-3 text-emerald-400/80" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer / Action Area */}
            <div className="border-t border-white/5 bg-neutral-900/30 p-2">
              <div className="flex flex-col items-center justify-between gap-4 px-4 py-2 md:flex-row">
                {/* Compute Estimate */}
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-neutral-900">
                    <Clock className="h-4 w-4 text-neutral-400" />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400"
                      style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                    >
                      ANALYSIS
                    </span>
                    <span
                      className="font-mono text-xs text-neutral-200"
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
                    <kbd className="flex h-5 items-center justify-center rounded border border-neutral-700 bg-neutral-800 px-1.5 font-mono text-[10px] text-neutral-400">
                      ⌘
                    </kbd>
                    <kbd className="flex h-5 items-center justify-center rounded border border-neutral-700 bg-neutral-800 px-1.5 font-mono text-[10px] text-neutral-400">
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
                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:bg-neutral-200 hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]'
                        : 'cursor-not-allowed bg-neutral-800 text-neutral-500',
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
            className="mt-4 text-center text-sm text-red-400"
            style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
          >
            {error}
          </p>
        )}

        {/* Trust / Capability Indicators - Always visible */}
        <div className="mt-8 flex flex-col items-center justify-center gap-6 opacity-60 md:flex-row">
          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3 text-neutral-400" />
            <span
              className="font-mono text-xs tracking-tight text-neutral-300"
              style={{ fontFamily: 'Soehne Mono, JetBrains Mono, monospace' }}
            >
              DATA NEVER TRAINS AI
            </span>
          </div>
          <div className="hidden h-3 w-px bg-neutral-700 md:block" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            <span
              className="font-mono text-xs tracking-tight text-neutral-300"
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
