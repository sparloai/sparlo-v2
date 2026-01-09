'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Compass,
  Lock,
  Paperclip,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';

import { Alert, AlertDescription } from '@kit/ui/alert';
import { cn } from '@kit/ui/utils';

import { getAppPath } from '~/lib/hooks/use-app-path';

import { ProcessingScreen } from '../../../_components/processing-screen';
import { startDiscoveryReportGeneration } from '../../../_lib/server/discovery-reports-server-actions';
import { useReportProgress } from '../../../_lib/use-report-progress';

// Attachment types and constants
interface Attachment {
  id: string;
  file: File;
  preview: string;
  base64?: string;
}

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

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

export default function DiscoveryNewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    phase,
    challengeText,
    reportId,
    isSubmitting,
    error,
    showRefusalWarning,
  } = formState;

  // File handling functions
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newAttachments: Attachment[] = [];

      for (const file of Array.from(files)) {
        if (attachments.length + newAttachments.length >= MAX_ATTACHMENTS) {
          setFormState((prev) => ({
            ...prev,
            error: `Maximum ${MAX_ATTACHMENTS} attachments allowed`,
          }));
          break;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
          setFormState((prev) => ({
            ...prev,
            error: `File type ${file.type} not supported. Use images or PDF.`,
          }));
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          setFormState((prev) => ({
            ...prev,
            error: `File ${file.name} exceeds 10MB limit`,
          }));
          continue;
        }

        // Convert to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || '');
          };
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          base64,
        });
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [attachments.length],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment) URL.revokeObjectURL(attachment.preview);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

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
      window.history.replaceState(
        {},
        '',
        getAppPath('/app/reports/discovery/new'),
      );
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
      // Prepare attachments for API (images only for Claude vision)
      const attachmentData = attachments
        .filter((a) => a.file.type.startsWith('image/'))
        .map((a) => ({
          filename: a.file.name,
          media_type: a.file.type as
            | 'image/jpeg'
            | 'image/png'
            | 'image/gif'
            | 'image/webp',
          data: a.base64 || '',
        }));

      const result = await startDiscoveryReportGeneration({
        designChallenge: challengeText.trim(),
        attachments: attachmentData.length > 0 ? attachmentData : undefined,
      });

      if (result.reportId) {
        // Clean up attachment previews
        attachments.forEach((a) => URL.revokeObjectURL(a.preview));
        setAttachments([]);

        setFormState((prev) => ({
          ...prev,
          reportId: result.reportId,
          phase: 'processing',
          isSubmitting: false,
        }));
      }
    } catch (err) {
      console.error('Failed to start discovery report:', err);
      setFormState((prev) => ({
        ...prev,
        error:
          err instanceof Error
            ? err.message
            : 'Failed to start discovery report generation',
        isSubmitting: false,
      }));
    }
  }, [canSubmit, challengeText, isSubmitting, attachments]);

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
      router.push(getAppPath(`/app/reports/${reportId}`));
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

  // Input phase - Discovery Mode design with emerald/teal accents
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center bg-[--surface-base] px-4 py-12 text-[--text-secondary]"
      style={{ fontFamily: "'Suisse Intl', Inter, sans-serif" }}
    >
      {/* Ambient Background Glows - Discovery mode uses teal/emerald */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-teal-900/10 opacity-0 blur-[120px] dark:opacity-50" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-emerald-900/5 opacity-0 blur-[100px] dark:opacity-50" />

      <div className="relative z-10 w-full max-w-4xl">
        {/* Discovery Mode Badge */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 dark:border-teal-800 dark:bg-teal-900/20">
            <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
              Discovery Mode
            </span>
            <span className="text-xs text-teal-600 dark:text-teal-400">
              - Hunting non-obvious solutions
            </span>
          </div>
        </div>

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
        <div className="group relative">
          <div className="relative flex flex-col overflow-hidden rounded-2xl bg-[--surface-elevated] shadow-lg dark:shadow-2xl dark:shadow-black/50">
            {/* Toolbar / Context Hinting */}
            <div className="flex items-center justify-between border-b border-[--border-subtle] bg-[--surface-overlay] px-6 py-3 dark:bg-neutral-900/20">
              <div className="flex items-center gap-2 text-xs font-medium text-teal-700 dark:text-teal-400">
                <Compass className="h-4 w-4" />
                <span>Discovery analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= MAX_ATTACHMENTS}
                  className="group/btn flex items-center gap-1.5 rounded-md border border-[--border-subtle] bg-transparent px-3 py-1.5 text-xs text-[--text-secondary] transition-all hover:border-[--border-default] hover:bg-[--surface-overlay] hover:text-[--text-primary] disabled:opacity-50"
                >
                  Attach
                  {attachments.length > 0 && (
                    <span className="text-teal-600 dark:text-teal-400">
                      ({attachments.length})
                    </span>
                  )}
                  <Paperclip className="h-3 w-3 transition-colors group-hover/btn:text-teal-600" />
                </button>
              </div>
            </div>

            {/* Discovery Mode Info Banner */}
            <div className="border-b border-teal-100 bg-teal-50/50 px-6 py-3 dark:border-teal-800/50 dark:bg-teal-900/10">
              <p className="text-xs text-teal-700 dark:text-teal-300">
                <strong>Discovery Mode</strong> excludes conventional industry
                approaches and hunts in non-obvious domains: biology, geology,
                abandoned technologies, and frontier materials. What has
                everyone missed?
              </p>
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
                data-test="discovery-challenge-input"
                placeholder="Describe the challenge. Discovery Mode will search beyond conventional solutions..."
                spellCheck={false}
                className="min-h-[240px] flex-1 resize-none border-0 bg-transparent text-lg leading-relaxed font-light text-[--text-primary] placeholder-[--text-muted] ring-0 outline-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none disabled:opacity-40 md:text-xl"
                style={{
                  fontFamily: "'Suisse Intl', Inter, sans-serif",
                  outline: 'none',
                }}
              />
            </div>

            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <div className="border-t border-[--border-subtle] px-6 py-4">
                <div className="flex flex-wrap gap-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="group relative h-16 w-16 overflow-hidden rounded-lg border border-[--border-subtle] bg-[--surface-overlay]"
                    >
                      {attachment.file.type.startsWith('image/') ? (
                        <img
                          src={attachment.preview}
                          alt={attachment.file.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-[--text-muted]">
                          PDF
                        </div>
                      )}
                      <button
                        onClick={() => removeAttachment(attachment.id)}
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-600 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[--text-muted]">
                  {attachments.length} attachment
                  {attachments.length !== 1 ? 's' : ''} - Images will be
                  analyzed by Claude Vision
                </p>
              </div>
            )}

            {/* Context Awareness / Intelligence Layer */}
            <div className="px-6 pb-6 md:px-8 md:pb-8">
              <div className="flex flex-wrap items-center gap-3 select-none">
                <span className="mr-1 text-xs font-medium text-[--text-muted]">
                  Context detection
                </span>

                {CONTEXT_DETECTIONS.map((context) => {
                  const isDetected = detectedContexts.has(context.id);
                  return (
                    <div
                      key={context.id}
                      className={cn(
                        'flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-300',
                        isDetected
                          ? 'border border-teal-200 bg-teal-50 dark:border-teal-700 dark:bg-teal-900/20'
                          : 'border border-dashed border-[--border-default] bg-transparent text-[--text-muted]',
                      )}
                    >
                      <div
                        className={cn(
                          'h-1.5 w-1.5 rounded-full transition-all duration-300',
                          isDetected
                            ? 'bg-teal-500 dark:bg-teal-400'
                            : 'bg-[--border-default]',
                        )}
                      />
                      <span
                        className={cn(
                          'text-xs font-medium',
                          isDetected
                            ? 'text-teal-700 dark:text-teal-300'
                            : 'text-[--text-muted]',
                        )}
                        style={{
                          fontFamily: "'Suisse Intl', Inter, sans-serif",
                        }}
                      >
                        {context.label}
                      </span>
                      {isDetected && (
                        <Check className="h-3 w-3 text-teal-600 dark:text-teal-400" />
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
                      className="text-[10px] font-semibold text-[--text-muted]"
                      style={{ fontFamily: "'Suisse Intl', Inter, sans-serif" }}
                    >
                      Discovery analysis
                    </span>
                    <span
                      className="text-xs text-[--text-secondary]"
                      style={{
                        fontFamily: "'Suisse Intl', Inter, sans-serif",
                      }}
                    >
                      ~20 minutes
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
                    data-test="discovery-challenge-submit"
                    className={cn(
                      'group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl px-8 py-4 transition-all duration-300 md:w-auto',
                      canSubmit && !isSubmitting
                        ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 hover:bg-teal-500 dark:bg-teal-600 dark:hover:bg-teal-500'
                        : 'bg-[--surface-overlay] text-[--text-muted] dark:bg-neutral-800 dark:text-neutral-500',
                    )}
                  >
                    <span
                      className="relative z-10 text-base font-semibold tracking-tight"
                      style={{ fontFamily: "'Suisse Intl', Inter, sans-serif" }}
                    >
                      {isSubmitting ? 'Discovering...' : 'Run Discovery'}
                    </span>
                    {!isSubmitting && (
                      <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
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
            style={{ fontFamily: "'Suisse Intl', Inter, sans-serif" }}
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
              style={{
                fontFamily: "'Suisse Mono', 'SF Mono', ui-monospace, monospace",
              }}
            >
              DATA NEVER TRAINS AI
            </span>
          </div>
          <div className="hidden h-3 w-px bg-[--border-default] md:block" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3 w-3 text-teal-600 dark:text-teal-500" />
            <span
              className="font-mono text-xs tracking-tight text-[--text-secondary]"
              style={{
                fontFamily: "'Suisse Mono', 'SF Mono', ui-monospace, monospace",
              }}
            >
              BUILT ON SOC2 INFRASTRUCTURE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
