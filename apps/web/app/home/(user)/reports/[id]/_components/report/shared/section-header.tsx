interface SectionHeaderProps {
  id: string;
  title: string;
  children?: React.ReactNode;
}

export function SectionHeader({ id, title, children }: SectionHeaderProps) {
  return (
    <div
      id={id}
      className="flex items-center justify-between border-b border-zinc-100 pb-4"
    >
      <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
        {title}
      </h2>
      {children}
    </div>
  );
}
