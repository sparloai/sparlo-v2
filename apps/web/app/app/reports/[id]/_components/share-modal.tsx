'use client';

import { useCallback, useState, useTransition } from 'react';

import { Check, Copy, Link2 } from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Input } from '@kit/ui/input';
import { toast } from '@kit/ui/sonner';

import { generateShareLink } from '../_lib/server/share-actions';

interface ShareModalProps {
  reportId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareModal({ reportId, open, onOpenChange }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleGenerateLink = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await generateShareLink({ reportId });

        if (result.success) {
          setShareUrl(result.shareUrl);
        }
      } catch (error) {
        console.error('[ShareModal] Error generating link:', error);
        toast.error('Failed to generate share link');
      }
    });
  }, [reportId]);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[ShareModal] Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  }, [shareUrl]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        // Reset state when closing
        setShareUrl(null);
        setCopied(false);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
          <DialogDescription>
            Create a shareable link that anyone can use to view this report
            without logging in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {!shareUrl ? (
            <Button
              onClick={handleGenerateLink}
              loading={isPending}
              className="w-full"
            >
              <Link2 className="h-4 w-4" />
              {isPending ? 'Generating link...' : 'Generate Share Link'}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Anyone with this link can view the report without signing in.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
