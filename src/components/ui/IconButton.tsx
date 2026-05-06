import type { ReactNode } from 'react';

interface IconButtonProps {
  onClick: () => void;
  children: ReactNode;
  tooltip?: string;
  label: string;
}

export function IconButton({ onClick, children, tooltip, label }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-surface hover:text-text"
    >
      {children}
    </button>
  );
}
