interface TitleBarProps {
  filePath: string | null;
  isDirty: boolean;
}

export function TitleBar({ filePath, isDirty }: TitleBarProps) {
  const fileName = filePath
    ? filePath.split(/[/\\]/).pop() ?? 'Untitled'
    : 'Untitled';

  return (
    <div
      className="flex h-9 shrink-0 items-center justify-center border-b border-border bg-surface/60 px-4 text-xs text-muted backdrop-blur"
      data-tauri-drag-region
    >
      <span className="select-none truncate" data-tauri-drag-region>
        {fileName}
        {isDirty && <span className="ml-1 text-accent">●</span>}
      </span>
    </div>
  );
}
