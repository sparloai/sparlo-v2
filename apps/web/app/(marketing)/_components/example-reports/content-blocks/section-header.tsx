interface SectionHeaderProps {
  children: React.ReactNode;
}

export function SectionHeader({ children }: SectionHeaderProps) {
  return (
    <h2 className="mb-4 border-b border-zinc-200 pb-3 text-lg font-semibold text-zinc-900">
      {children}
    </h2>
  );
}
