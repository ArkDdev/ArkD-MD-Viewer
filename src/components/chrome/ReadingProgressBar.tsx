import { useEffect, useState } from 'react';

interface ReadingProgressBarProps {
  /**
   * The scroll container to track. Pass `null` if there isn't one currently
   * (e.g. mode just switched and ref isn't ready yet) — the rail still shows
   * but the fill stays at 0 so the chrome doesn't reflow.
   */
  target: HTMLElement | null;
}

/**
 * A 2px tall progress bar pinned just below the TopBar that fills with the
 * accent colour as the user scrolls through the document.
 *
 * Kept always-visible (with a faint rail background) so that toggling between
 * a short and a long document doesn't shift the layout below it. If we hid
 * the bar for short docs and re-mounted it when content grew, the main area
 * would jump 2px every time and feel jittery.
 *
 * The transform-based fill avoids a layout reflow on every scroll event.
 */
export function ReadingProgressBar({ target }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!target) {
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
      // Clamp; on some browsers scrollTop can momentarily overshoot during
      // overscroll (touch/trackpad).
      setProgress(Math.max(0, Math.min(1, ratio)));
    };

    compute();
    target.addEventListener('scroll', compute, { passive: true });

    // Recompute when content size changes (font/width settings, mode toggles
    // inside the same scroller, document loaded). Without this the bar would
    // lag until the user manually scrolled.
    const resizeObserver = new ResizeObserver(compute);
    resizeObserver.observe(target);

    return () => {
      target.removeEventListener('scroll', compute);
      resizeObserver.disconnect();
    };
  }, [target]);

  return (
    <div
      className="relative h-0.5 shrink-0 bg-border/40"
      aria-hidden="true"
    >
      <div
        className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-100 ease-out"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
