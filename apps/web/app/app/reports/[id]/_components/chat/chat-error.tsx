import { AlertCircle, RefreshCw } from 'lucide-react';

import { Button } from '@kit/ui/button';

interface ChatErrorProps {
  message: string;
  onRetry?: () => void;
}

export function ChatError({ message, onRetry }: ChatErrorProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
        <p className="flex-1 text-sm text-red-600 dark:text-red-300">
          {message}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} type="button">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
