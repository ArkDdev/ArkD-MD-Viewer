import { useT } from '@/lib/i18n/useT';

interface ModeBadgeProps {
  isEditing: boolean;
}

/**
 * Compact "Read only / Editing" badge for non-markdown files.
 *
 * Lives in the TopBar to the right of the burger menu — always visible,
 * never overlaps content controls (unlike the previous corner-overlay).
 * Hides itself for markdown files, where the view/edit difference is
 * already obvious from the split layout.
 *
 * Sized to match other TopBar elements (28px height, subtle hover-less style).
 */
export function ModeBadge({ isEditing }: ModeBadgeProps) {
  const t = useT();

  return (
    <div
      className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-colors duration-200 ${
        isEditing
          ? 'bg-accent/12 text-accent'
          : 'bg-surface/70 text-subtle'
      }`}
    >
      {isEditing ? <PencilIcon /> : <LockIcon />}
      <span className="whitespace-nowrap">
        {isEditing ? t('mode.editing') : t('mode.readonly')}
      </span>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}
