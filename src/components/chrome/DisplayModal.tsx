import { Modal } from '@/components/ui/Modal';
import {
  useUIStore,
  type ReaderFontFamily,
  type ReaderFontSize,
  type ReaderLineHeight,
  type ReaderWidth,
  type EditorFontSize,
} from '@/store/uiStore';

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

  return (
    <Modal isOpen={isDisplayOpen} onClose={closeDisplay} title="Отображение" width="lg">
      <div className="space-y-6 py-1 text-sm">
        {/* ── Document section ─────────────────────────────────────── */}
        <Section title="Документ">
          <Row label="Шрифт">
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

          <Row label="Размер">
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

          <Row label="Высота строки">
            <SegmentedControl<ReaderLineHeight>
              value={readerLineHeight}
              onChange={setReaderLineHeight}
              options={[
                { value: 'compact', label: 'Плотно' },
                { value: 'normal', label: 'Обычно' },
                { value: 'relaxed', label: 'Просторно' },
              ]}
            />
          </Row>

          <Row label="Ширина области просмотра">
            <SegmentedControl<ReaderWidth>
              value={readerWidth}
              onChange={setReaderWidth}
              options={[
                { value: 'narrow', label: 'Узкая' },
                { value: 'medium', label: 'Средняя' },
                { value: 'wide', label: 'Широкая' },
                { value: 'full', label: 'По окну' },
              ]}
            />
          </Row>
        </Section>

        {/* ── Editor section ───────────────────────────────────────── */}
        <Section title="Редактор">
          <Row label="Размер шрифта в редакторе">
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

          <Row label="Перенос строк">
            <Toggle value={editorWrap} onChange={setEditorWrap} />
          </Row>
        </Section>

        {/* ── Footer with reset ─────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            onClick={resetDisplay}
            className="text-xs text-muted transition-colors hover:text-text"
          >
            Сбросить к настройкам по умолчанию
          </button>
          <button
            onClick={closeDisplay}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Готово
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

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
  /** font-family preview shown as the button's font (used for font-family picker) */
  preview?: 'serif' | 'sans' | 'mono';
  /** font-size in px to display the label at (used for size picker) */
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
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative h-6 w-10 rounded-full transition-colors duration-200 ${
        value ? 'bg-accent' : 'bg-border'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-transform duration-200 ${
          value ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
