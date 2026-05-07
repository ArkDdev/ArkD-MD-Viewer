/**
 * Icon components — stroke-based, weight 1.8, currentColor.
 * Match Claude Desktop's clean linework.
 */

type IconProps = { size?: number; className?: string };

const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
});

export const MenuIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size, className)}>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
);

export const FileIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <polyline points="14 3 14 9 20 9" />
  </svg>
);

export const FolderIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  </svg>
);

/**
 * Save icon — classic floppy disk (full-bleed shape, visually weighty).
 */
export const SaveIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

/**
 * Save As icon — same floppy silhouette as Save (so they read as a pair),
 * but with a small pencil/edit stroke in the corner indicating "modify".
 *
 * Visually weighted to match Save: same outer shape, same proportions.
 */
export const SaveAsIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M19 13.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" />
    <polyline points="15 21 15 13 7 13 7 21" />
    <polyline points="7 3 7 8 13 8" />
    {/* Pencil mark in corner indicating "save under different name" */}
    <path d="M16 16l5 5M19 13l3 3-2 2-3-3z" />
  </svg>
);

export const SettingsIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const SlidersIcon = ({ size = 18, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
    <circle cx="9" cy="7" r="2.2" fill="rgb(var(--bg))" />
    <circle cx="15" cy="12" r="2.2" fill="rgb(var(--bg))" />
    <circle cx="11" cy="17" r="2.2" fill="rgb(var(--bg))" />
  </svg>
);

export const SunIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

export const MoonIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const MonitorIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size, className)}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </svg>
);

export const PencilIcon = ({ size = 14, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

export const EyeIcon = ({ size = 14, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const PanelIcon = ({ size = 14, className }: IconProps) => (
  <svg {...base(size, className)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

export const MaximizeIcon = ({ size = 14, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M3 9V5a2 2 0 0 1 2-2h4M21 9V5a2 2 0 0 0-2-2h-4M3 15v4a2 2 0 0 0 2 2h4M21 15v4a2 2 0 0 1-2 2h-4" />
  </svg>
);

export const PlusIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size, className)}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const CloseIcon = ({ size = 14, className }: IconProps) => (
  <svg {...base(size, className)}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ─── Window control icons (precise, pixel-aligned) ─────────────────── */

export const WinMinimizeIcon = ({ size = 10 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 10 10">
    <line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1" />
  </svg>
);

export const WinMaximizeIcon = ({ size = 10 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none">
    <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="1" />
  </svg>
);

export const WinRestoreIcon = ({ size = 10 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none">
    <rect x="0.5" y="2.5" width="7" height="7" stroke="currentColor" strokeWidth="1" />
    <path d="M2.5 2.5 V0.5 H9.5 V7.5 H7.5" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

export const WinCloseIcon = ({ size = 10 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 10 10">
    <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1" />
    <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1" />
  </svg>
);
