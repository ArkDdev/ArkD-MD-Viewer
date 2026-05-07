import { Modal } from '@/components/ui/Modal';
import {
  useUIStore,
  type ReaderFontFamily,
  type ReaderFontSize,
  type ReaderLineHeight,
  type ReaderWidth,
  type EditorFontSize,
} from '@/store/uiStore';
import { useT } from '@/lib/i18n/useT';

export function DisplayModal() {
  const {
    isDisplayOpen,
    closeDisplay,
    readerFontFamily,
    readerFontSize,
    readerLineHeight,
    readerWidth,
    editorFontSize,
    editorWrap,
    setReaderFontFamily,
    setReaderFontSize,
    setReaderLineHeight,
    setReaderWidth,
    setEditorFontSize,
    setEditorWrap,
    resetDisplay,
  } = useUIStore();
  const t = useT();

  return (
    <Modal isOpen={isDisplayOpen} onClose={closeDisplay} title={t('display.title')} width="lg">
      <div className="space-y-6 py-1 text-sm">
        <Section title={t('display.section.document')}>
          <Row label={t('display.font')}>
            <SegmentedControl<ReaderFontFamily>
              value={readerFontFamily}
              onChange={setReaderFontFamily}
              options={[
                { value: 'serif', label: 'Serif', preview: 'serif' },
                { value: 'sans', label: 'Sans', preview: 'sans' },
                { value: 'mono', label: 'Mono', preview: 'mono' },
              ]}
            />
          </Row>

          <Row label={t('display.size')}>
            <SegmentedControl<ReaderFontSize>
              value={readerFontSize}
              onChange={setReaderFontSize}
              options={[
                { value: 'sm', label: 'A', sizeIndicator: 12 },
                { value: 'base', label: 'A', sizeIndicator: 14 },
                { value: 'lg', label: 'A', sizeIndicator: 16 },
                { value: 'xl', label: 'A', sizeIndicator: 18 },
              ]}
            />
          </Row>

          <Row label={t('display.lineHeight')}>
            <SegmentedControl<ReaderLineHeight>
              value={readerLineHeight}
              onChange={setReaderLineHeight}
              options={[
                { value: 'compact', label: t('display.lineHeight.compact') },
                { value: 'normal', label: t('display.lineHeight.normal') },
                { value: 'relaxed', label: t('display.lineHeight.relaxed') },
              ]}
            />
          </Row>

          <Row label={t('display.width')}>
            <SegmentedControl<ReaderWidth>
              value={readerWidth}
              onChange={setReaderWidth}
              options={[
                { value: 'narrow', label: t('display.width.narrow') },
                { value: 'medium', label: t('display.width.medium') },
                { value: 'wide', label: t('display.width.wide') },
                { value: 'full', label: t('display.width.full') },
              ]}
            />
          </Row>
        </Section>

        <Section title={t('display.section.editor')}>
          <Row label={t('display.editorFontSize')}>
            <SegmentedControl<EditorFontSize>
              value={editorFontSize}
              onChange={setEditorFontSize}
              options={[
                { value: 12, label: '12' },
                { value: 14, label: '14' },
                { value: 16, label: '16' },
                { value: 18, label: '18' },
              ]}
            />
          </Row>

          <Row label={t('display.editorWrap')}>
            <Toggle value={editorWrap} onChange={setEditorWrap} />
          </Row>
        </Section>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            onClick={resetDisplay}
            className="text-xs text-muted transition-colors hover:text-text"
          >
            {t('display.reset')}
          </button>
          <button
            onClick={closeDisplay}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {t('display.done')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-text">{label}</span>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

interface SegmentedOption<T> {
  value: T;
  label: string;
  preview?: 'serif' | 'sans' | 'mono';
  sizeIndicator?: number;
}

function SegmentedControl<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-surface/40 p-0.5">
      {options.map((opt) => {
        const isActive = opt.value === value;
        const fontClass =
          opt.preview === 'serif' ? 'font-serif'
          : opt.preview === 'sans' ? 'font-sans'
          : opt.preview === 'mono' ? 'font-mono'
          : '';
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={`rounded-md px-2.5 py-1 text-sm transition-colors ${fontClass} ${
              isActive
                ? 'bg-elevated text-text shadow-soft'
                : 'text-muted hover:text-text'
            }`}
            style={opt.sizeIndicator ? { fontSize: `${opt.sizeIndicator}px`, lineHeight: 1.2 } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  /*
   * Layout (precise pixel math, no Tailwind arbitrary values):
   *
   *   track: 40px wide × 24px tall
   *   knob:  20px × 20px, 2px gap from each edge
   *
   * inactive: knob.left = 2px       → right edge at  22px (inside track)
   * active:   knob.left = 18px      → right edge at  38px (2px inset on right)
   *
   * We use inline `left` rather than `translate-x-[…]` because Tailwind's
   * JIT can be unreliable with arbitrary translate values inside template
   * literals — switching to the absolute positioning model with a numeric
   * style avoids the class-name purge surprises altogether.
   */
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative inline-block h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${
        value ? 'bg-accent' : 'bg-border'
      }`}
    >
      <span
        className="absolute h-5 w-5 rounded-full bg-white shadow-soft transition-[left] duration-200"
        style={{ top: 2, left: value ? 18 : 2 }}
      />
    </button>
  );
}
