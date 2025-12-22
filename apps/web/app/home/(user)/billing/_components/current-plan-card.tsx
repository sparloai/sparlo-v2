'use client';

import { ExternalLink, Settings } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { cn } from '@kit/ui/utils';

interface CurrentPlanCardProps {
  planName: string;
  planDescription: string;
  price: number;
  interval: string;
  status: string;
  features: string[];
  onManageSubscription: () => void;
}

export function CurrentPlanCard({
  planName,
  planDescription,
  price,
  interval,
  status,
  features,
  onManageSubscription,
}: CurrentPlanCardProps) {
  const statusColor =
    status === 'active'
      ? 'bg-green-500/10 text-green-600'
      : status === 'canceled'
        ? 'bg-amber-500/10 text-amber-600'
        : 'bg-muted text-muted-foreground';

  const statusLabel =
    status === 'active'
      ? 'Active'
      : status === 'canceled'
        ? 'Canceling'
        : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="mb-1 text-lg">{planName}</CardTitle>
            <p className="text-muted-foreground text-sm">{planDescription}</p>
          </div>
          <Badge className={cn('font-medium', statusColor)}>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">${price}</span>
          <span className="text-muted-foreground">/{interval}</span>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Included
          </p>
          <ul className="space-y-1.5">
            {features.map((feature, i) => (
              <li
                key={i}
                className="text-muted-foreground flex items-center gap-2 text-sm"
              >
                <span className="text-primary">•</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3 border-t pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onManageSubscription}
          >
            <Settings className="mr-2 h-4 w-4" />
            Manage Subscription
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://billing.stripe.com/p/login"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
