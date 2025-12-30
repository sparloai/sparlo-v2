'use client';

import { useState } from 'react';

import { Eye, EyeOff, Lock } from 'lucide-react';

import { cn } from '@kit/ui/utils';

export function PasswordInput({
  className,
  ...props
}: React.ComponentProps<'input'>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className={cn(
        'group flex h-11 w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 transition-all focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-100',
        className,
      )}
    >
      <Lock className="h-4 w-4 shrink-0 text-zinc-400" />
      <input
        data-test="password-input"
        type={showPassword ? 'text' : 'password'}
        placeholder="************"
        className="h-full flex-1 bg-transparent text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        aria-pressed={showPassword}
        className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
