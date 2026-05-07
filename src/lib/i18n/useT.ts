import { useUIStore } from '@/store/uiStore';
import { translations, type Language } from './translations';

/**
 * Get a translation for the current language.
 *
 * Usage in a component:
 *   const t = useT();
 *   return <span>{t('menu.open')}</span>;
 *
 * If a key is missing in the active language, it falls back to the key
 * itself — this makes missing translations very obvious during testing.
 *
 * Optional interpolation: pass a vars object to substitute {placeholders}:
 *   t('dragdrop.openFirstOf', { count: 3 }) → "Открыть первый из 3 файлов"
 */
export function useT() {
  const language = useUIStore((s) => s.language);
  return (key: string, vars?: Record<string, string | number>) =>
    translate(language, key, vars);
}

/**
 * Non-hook version — for use outside React components (event handlers,
 * stores, command processors). Reads language directly from store.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const language = useUIStore.getState().language;
  return translate(language, key, vars);
}

function translate(
  lang: Language,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const dict = translations[lang];
  let str = dict[key];
  if (str === undefined) {
    // Fallback chain: missing in current → try the other → return key
    const otherLang: Language = lang === 'ru' ? 'en' : 'ru';
    str = translations[otherLang][key] ?? key;
  }
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
    }
  }
  return str;
}
