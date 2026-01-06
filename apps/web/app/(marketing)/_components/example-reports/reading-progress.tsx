interface ReadingProgressProps {
  progress: number;
}

export function ReadingProgress({ progress }: ReadingProgressProps) {
  return (
    <div className="h-0.5 shrink-0 bg-zinc-100">
      <div
        className="h-full bg-blue-500 transition-[width] duration-100 ease-out"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
