'use client';

import { Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@kit/ui/utils';

export function EmailInput({
  className,
  ...props
}: React.ComponentProps<'input'>) {
  const { t } = useTranslation('auth');

  return (
    <div
      className={cn(
        'group flex h-11 w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 transition-all focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-100',
        className,
      )}
    >
      <Mail className="h-4 w-4 shrink-0 text-zinc-400" />
      <input
        data-test="email-input"
        required
        type="email"
        placeholder={t('emailPlaceholder')}
        className="h-full flex-1 bg-transparent text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
        {...props}
      />
    </div>
  );
}
