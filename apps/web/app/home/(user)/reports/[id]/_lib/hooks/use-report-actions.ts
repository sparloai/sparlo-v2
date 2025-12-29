'use client';

import { useCallback, useState } from 'react';

import { toast } from '@kit/ui/sonner';

import { generateShareLink } from '../server/share-actions';

/**
 * Sanitize a string for use as a filename.
 * Removes special characters, replaces spaces with dashes, and limits length.
 */
function sanitizeFilename(name: string, maxLength = 50): string {
  return name
    .replace(/[^a-z0-9\s-]/gi, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .substring(0, maxLength);
}

interface UseReportActionsOptions {
  /** The report ID - required for share/export to work */
  reportId: string;
  /** The report title - used for share text and PDF filename */
  reportTitle: string;
  /**
   * Optional callback when Web Share API is unavailable or fails.
   * If not provided, falls back to copying share link to clipboard.
   * Use this to open a share modal instead.
   */
  onShareFallback?: () => void;
}

interface UseReportActionsReturn {
  /** Trigger share - uses Web Share API with fallback */
  handleShare: () => Promise<void>;
  /** Whether share link is being generated */
  isGeneratingShare: boolean;
  /** Trigger PDF export/download */
  handleExport: () => Promise<void>;
  /** Whether PDF is being exported */
  isExporting: boolean;
}

/**
 * Shared hook for report share and export functionality.
 *
 * Used by both standard reports (report-display.tsx) and
 * hybrid reports (brand-system-report.tsx).
 *
 * Features:
 * - Web Share API with clipboard fallback
 * - PDF download via /api/reports/[id]/pdf
 * - Proper resource cleanup (blob URLs)
 * - Loading states for UI feedback
 */
export function useReportActions({
  reportId,
  reportTitle,
  onShareFallback,
}: UseReportActionsOptions): UseReportActionsReturn {
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleShare = useCallback(async () => {
    // Try Web Share API first (works on mobile and some desktop browsers)
    if (navigator.share) {
      setIsGeneratingShare(true);
      try {
        const result = await generateShareLink({ reportId });
        if (result.success && result.shareUrl) {
          await navigator.share({
            title: reportTitle,
            url: result.shareUrl,
          });
          return; // Success - native share handled it
        }
      } catch (err) {
        // User cancelled - no error needed
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        // Other Web Share API errors - log and fall through
        console.error('[useReportActions] Web Share API error:', err);
      } finally {
        setIsGeneratingShare(false);
      }
    }

    // Fallback behavior
    if (onShareFallback) {
      // Use custom fallback (e.g., open share modal)
      onShareFallback();
      return;
    }

    // Default fallback: generate link and copy to clipboard
    setIsGeneratingShare(true);
    try {
      const result = await generateShareLink({ reportId });
      if (result.success && result.shareUrl) {
        await navigator.clipboard.writeText(result.shareUrl);
        toast.success('Share link copied to clipboard');
      } else {
        toast.error('Failed to generate share link');
      }
    } catch (error) {
      console.error('[useReportActions] Error generating share link:', error);
      toast.error('Failed to share report');
    } finally {
      setIsGeneratingShare(false);
    }
  }, [reportId, reportTitle, onShareFallback]);

  const handleExport = useCallback(async () => {
    let objectUrl: string | null = null;

    setIsExporting(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/pdf`);
      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);

      const filename = sanitizeFilename(reportTitle) || 'report';
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${filename}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('PDF downloaded');
    } catch (error) {
      console.error('[useReportActions] Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      // Always cleanup object URL to prevent memory leaks
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setIsExporting(false);
    }
  }, [reportId, reportTitle]);

  return {
    handleShare,
    isGeneratingShare,
    handleExport,
    isExporting,
  };
}
