import { AlertCircle, Check, HelpCircle, X } from 'lucide-react';

interface ViabilityBadgeProps {
  status: 'viable' | 'conditional' | 'uncertain' | 'not-viable';
  children: React.ReactNode;
}

const config = {
  viable: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: Check,
  },
  conditional: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: AlertCircle,
  },
  uncertain: {
    bg: 'bg-zinc-50',
    border: 'border-zinc-200',
    text: 'text-zinc-700',
    icon: HelpCircle,
  },
  'not-viable': {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: X,
  },
};

export function ViabilityBadge({ status, children }: ViabilityBadgeProps) {
  const { bg, border, text, icon: Icon } = config[status];

  return (
    <div
      className={`${bg} border ${border} flex items-center gap-2 rounded-lg px-4 py-3`}
    >
      <Icon className={`h-5 w-5 ${text}`} />
      <span className={`text-sm font-medium ${text}`}>{children}</span>
    </div>
  );
}
