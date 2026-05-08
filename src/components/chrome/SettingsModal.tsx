import { openUrl } from '@tauri-apps/plugin-opener';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/store/uiStore';
import { useT } from '@/lib/i18n/useT';
import type { Language } from '@/lib/i18n/translations';

const APP_VERSION = '1.0.2';
const GITHUB_REPO_URL = 'https://github.com/ArkDdev/ArkD-MD-Viewer';
const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases`;

export function SettingsModal() {
  const { isSettingsOpen, closeSettings, language, setLanguage } = useUIStore();
  const t = useT();

  const handleOpenUrl = async (url: string) => {
    try {
      await openUrl(url);
    } catch (err) {
      console.error('Failed to open URL:', err);
    }
  };

  return (
    <Modal isOpen={isSettingsOpen} onClose={closeSettings} title={t('settings.title')} width="lg">
      <div className="space-y-6 py-1 text-sm">
        {/* ── Language ───────────────────────────────────────────── */}
        <Section title={t('settings.section.language')}>
          <Row>
            <SegmentedControl<Language>
              value={language}
              onChange={setLanguage}
              options={[
                { value: 'ru', label: t('settings.language.ru') },
                { value: 'en', label: t('settings.language.en') },
              ]}
            />
          </Row>
        </Section>

        {/* ── Updates ───────────────────────────────────────────── */}
        <Section title={t('settings.section.updates')}>
          {/*
           * Single flex column for the whole Updates section, replacing the
           * default `space-y-3` Section spacing for this section only.
           * Layout:
           *   [Проверить обновления] (right-aligned)
           *   Откроется страница релизов на GitHub  (right-aligned, gap-1 from button)
           *   ─── 8px gap ───
           *   Текущая версия               1.0.1
           */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => handleOpenUrl(GITHUB_RELEASES_URL)}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-elevated"
              >
                {t('settings.updates.checkButton')}
              </button>
              <span className="text-xs text-subtle">{t('settings.updates.hint')}</span>
            </div>
            <div className="flex w-full items-center justify-between">
              <span className="text-muted">{t('settings.updates.currentVersion')}</span>
              <span className="font-mono text-text">{APP_VERSION}</span>
            </div>
          </div>
        </Section>

        {/* ── About ─────────────────────────────────────────────── */}
        <Section title={t('settings.section.about')}>
          <div className="rounded-lg border border-border bg-surface/40 p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold text-text">ArkD. MD Viewer</span>
              <span className="font-mono text-xs text-subtle">v{APP_VERSION}</span>
            </div>
            <p className="mt-1 text-muted">{t('settings.about.tagline')}</p>
            <button
              onClick={() => handleOpenUrl(GITHUB_REPO_URL)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent transition-colors hover:text-accent-hover"
            >
              <GitHubIcon />
              {t('settings.about.openOnGitHub')}
            </button>
          </div>
        </Section>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="flex items-center justify-end border-t border-border pt-4">
          <button
            onClick={closeSettings}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {t('settings.close')}
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

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4">{children}</div>;
}

function SegmentedControl<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-surface/40 p-0.5">
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={`rounded-md px-3 py-1 text-sm transition-colors ${
              isActive
                ? 'bg-elevated text-text shadow-soft'
                : 'text-muted hover:text-text'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
      />
    </svg>
  );
}
