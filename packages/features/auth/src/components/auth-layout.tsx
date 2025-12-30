import { cn } from '@kit/ui/utils';

export function AuthLayoutShell({
  children,
  className,
  Logo,
  contentClassName,
}: React.PropsWithChildren<{
  Logo?: React.ComponentType;
  className?: string;
  contentClassName?: string;
}>) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col items-center justify-center bg-white px-4 py-12',
        className,
      )}
    >
      <div className="animate-in fade-in slide-in-from-bottom-4 flex w-full max-w-[400px] flex-col items-center gap-10 duration-500">
        {Logo ? <Logo /> : null}

        <div
          className={cn(
            'flex w-full flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm transition-shadow duration-200',
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
