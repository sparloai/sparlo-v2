'use client';

import Link from 'next/link';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';

interface SubscriptionRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: 'subscription_required' | 'limit_exceeded';
}

export function SubscriptionRequiredModal({
  open,
  onOpenChange,
  reason,
}: SubscriptionRequiredModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {reason === 'subscription_required'
              ? 'Subscribe to Continue'
              : 'Usage Limit Reached'}
          </DialogTitle>
          <DialogDescription>
            {reason === 'subscription_required' ? (
              <>
                You&apos;ve used your free report. Subscribe to generate
                unlimited reports with our AI-powered analysis engine.
              </>
            ) : (
              <>
                You&apos;ve reached your monthly token limit. Upgrade your plan
                to continue generating reports this month.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-3">
          <Button asChild>
            <Link href="/home/billing">
              {reason === 'subscription_required'
                ? 'View Plans'
                : 'Upgrade Plan'}
            </Link>
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
