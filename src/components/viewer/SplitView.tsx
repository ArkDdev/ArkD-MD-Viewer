import { useEffect, useRef, type UIEvent } from 'react';
import { Editor, type EditorHandle } from '@/components/editor/Editor';
import { Renderer } from '@/components/viewer/Renderer';
import { useFileStore } from '@/store/fileStore';

interface SplitViewProps {
  /**
   * Called when the preview pane's scroll container is mounted (or unmounted,
   * with `null`). App.tsx uses this to attach the reading progress bar to the
   * right scroller in split mode.
   */
  onPreviewScrollerReady?: (el: HTMLDivElement | null) => void;
}

/**
 * Split view: editor on the left, preview on the right.
 *
 * Both panes are forced to exactly 50% of the container width via
 * `width: 50%` (not just flex-1) — this avoids drift caused by long
 * lines or growing content.
 *
 * Scroll sync is by *percentage* with three safeguards:
 *   1. `scrollLock` — single-tick guard against the A→B→A feedback loop
 *   2. `MIN_DELTA` — ignore reverse syncs smaller than 1px, which prevents
 *      jitter from rounding errors when one pane is much taller than the other
 *   3. `requestAnimationFrame` debounce — coalesce multiple scroll events
 *      that fire within the same frame, smoothing out fast scrolls
 */
const MIN_DELTA = 1;

export function SplitView({ onPreviewScrollerReady }: SplitViewProps) {
  const content = useFileStore((s) => s.content);

  const editorRef = useRef<EditorHandle>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const scrollLock = useRef(false);
  const rafScheduled = useRef(false);

  // Expose the preview scroller to the parent on mount, and tell it to drop
  // the reference on unmount. The cleanup is critical — without it, App.tsx
  // would keep tracking a detached node after a mode switch.
  useEffect(() => {
    onPreviewScrollerReady?.(previewRef.current);
    return () => onPreviewScrollerReady?.(null);
  }, [onPreviewScrollerReady]);

  useEffect(() => {
    const editorScroller = editorRef.current?.getScroller();
    if (!editorScroller) return;

    const onEditorScroll = () => {
      if (scrollLock.current) {
        scrollLock.current = false;
        return;
      }
      if (rafScheduled.current) return;
      rafScheduled.current = true;

      requestAnimationFrame(() => {
        rafScheduled.current = false;
        const preview = previewRef.current;
        if (!preview) return;

        const editorMax = editorScroller.scrollHeight - editorScroller.clientHeight;
        if (editorMax <= 0) return;
        const ratio = editorScroller.scrollTop / editorMax;

        const previewMax = preview.scrollHeight - preview.clientHeight;
        const target = ratio * previewMax;

        if (Math.abs(preview.scrollTop - target) < MIN_DELTA) return;

        scrollLock.current = true;
        preview.scrollTop = target;
      });
    };

    editorScroller.addEventListener('scroll', onEditorScroll, { passive: true });
    return () => editorScroller.removeEventListener('scroll', onEditorScroll);
  }, []);

  const onPreviewScroll = (e: UIEvent<HTMLDivElement>) => {
    if (scrollLock.current) {
      scrollLock.current = false;
      return;
    }
    if (rafScheduled.current) return;
    rafScheduled.current = true;

    const preview = e.currentTarget;
    requestAnimationFrame(() => {
      rafScheduled.current = false;
      const editorScroller = editorRef.current?.getScroller();
      if (!editorScroller) return;

      const previewMax = preview.scrollHeight - preview.clientHeight;
      if (previewMax <= 0) return;
      const ratio = preview.scrollTop / previewMax;

      const editorMax = editorScroller.scrollHeight - editorScroller.clientHeight;
      const target = ratio * editorMax;

      if (Math.abs(editorScroller.scrollTop - target) < MIN_DELTA) return;

      scrollLock.current = true;
      editorScroller.scrollTop = target;
    });
  };

  return (
    <div className="flex h-full">
      <div style={{ width: '50%' }} className="border-r border-border overflow-hidden">
        <Editor ref={editorRef} showPaneToggle isFull={false} />
      </div>
      <div style={{ width: '50%' }} className="overflow-hidden">
        <Renderer ref={previewRef} source={content} onScroll={onPreviewScroll} />
      </div>
    </div>
  );
}
