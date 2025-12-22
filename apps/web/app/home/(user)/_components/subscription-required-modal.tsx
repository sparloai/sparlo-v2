'use client';

import Link from 'next/link';

import { ArrowRight, Check, Sparkles, Zap } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
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

const FEATURES = [
  'AI-powered financial analysis',
  'Unlimited report exports',
  'Priority support',
];

export function SubscriptionRequiredModal({
  open,
  onOpenChange,
  reason,
}: SubscriptionRequiredModalProps) {
  const isSubscriptionRequired = reason === 'subscription_required';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
            {isSubscriptionRequired ? (
              <Sparkles className="h-8 w-8 text-white" />
            ) : (
              <Zap className="h-8 w-8 text-white" />
            )}
          </div>
          <DialogTitle className="text-xl">
            {isSubscriptionRequired
              ? 'Unlock Unlimited Reports'
              : 'Need More Capacity?'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isSubscriptionRequired ? (
              <>
                You&apos;ve used your free report. Subscribe to continue
                generating powerful AI-driven financial analysis.
              </>
            ) : (
              <>
                You&apos;ve reached your monthly limit. Upgrade your plan to
                keep the momentum going.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 space-y-3">
          {FEATURES.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-3 w-3 text-green-500" />
              </div>
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 -mx-6 mb-6 border-y px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Pro Plan</p>
              <p className="text-muted-foreground text-sm">
                Most popular choice
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-1">
                Best Value
              </Badge>
              <p className="text-lg font-bold">
                $499<span className="text-muted-foreground text-sm">/mo</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link href="/home/billing">
              {isSubscriptionRequired ? 'View Plans' : 'Upgrade Now'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
