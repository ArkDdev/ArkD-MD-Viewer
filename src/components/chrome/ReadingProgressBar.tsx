import { useEffect, useState } from 'react';

interface ReadingProgressBarProps {
  target: HTMLElement | null;
  /**
   * When true, the bar is filled 100% with accent colour to act as a clear
   * "you are editing" indicator. The reading-progress semantics don't apply
   * during editing (the user is writing, not reading sequentially), so
   * repurposing the bar as a mode indicator keeps the chrome minimal —
   * one persistent UI element with two states, instead of two separate
   * strips for the same vertical space.
   */
  isEditing?: boolean;
}

/**
 * A 2px tall progress bar pinned just below the TopBar.
 *
 * Two modes:
 *   - reading (default) — fills with the scroll progress of `target`
 *   - editing           — fills 100% with accent, ignoring target
 *
 * Always rendered with a faint rail so the layout doesn't shift when
 * the document length changes or the mode flips.
 */
export function ReadingProgressBar({ target, isEditing = false }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isEditing || !target) {
      setProgress(0);
      return;
    }

    const compute = () => {
      const max = target.scrollHeight - target.clientHeight;
      if (max <= 0) {
        setProgress(0);
        return;
      }
      const ratio = target.scrollTop / max;
      setProgress(Math.max(0, Math.min(1, ratio)));
    };

    compute();
    target.addEventListener('scroll', compute, { passive: true });

    const resizeObserver = new ResizeObserver(compute);
    resizeObserver.observe(target);

    return () => {
      target.removeEventListener('scroll', compute);
      resizeObserver.disconnect();
    };
  }, [target, isEditing]);

  // In edit mode we override the width to 100% with no transition delay,
  // so the switch from reading-progress to "full bar" feels instant rather
  // than animating from 30%-progress up to 100%.
  const widthPercent = isEditing ? 100 : progress * 100;

  return (
    <div
      className="relative h-0.5 shrink-0 bg-border/40"
      aria-hidden="true"
    >
      <div
        className={`absolute inset-y-0 left-0 bg-accent ${
          isEditing ? '' : 'transition-[width] duration-100 ease-out'
        }`}
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  );
}
