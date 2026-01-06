interface ReadingProgressProps {
  progress: number;
}

export function ReadingProgress({ progress }: ReadingProgressProps) {
  return (
    <div className="h-px shrink-0 bg-zinc-100">
      <div
        className="h-full bg-zinc-900 transition-[width] duration-100 ease-out"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
