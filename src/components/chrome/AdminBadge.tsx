import { useT } from '@/lib/i18n/useT';

/**
 * Visual indicator that the current process is running with admin/root
 * privileges. Used to remind the user that any save/modification has
 * elevated scope. Only renders when `isAdmin` is true.
 *
 * Styled like ModeBadge (compact, same height as TopBar chrome buttons)
 * but in a distinct accent colour so it stands out from the "Read only /
 * Editing" indicator next to it.
 */
export function AdminBadge() {
  const t = useT();
  return (
    <div
      className="flex h-7 items-center gap-1.5 rounded-md bg-amber-500/15 px-2 text-[11px] font-medium text-amber-700 dark:text-amber-400"
      title={t('elevation.adminBadge')}
    >
      <ShieldFilledIcon />
      <span className="whitespace-nowrap">{t('elevation.adminBadge')}</span>
    </div>
  );
}

function ShieldFilledIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
