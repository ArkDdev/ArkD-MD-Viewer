import { getCurrentWindow } from '@tauri-apps/api/window';

const win = getCurrentWindow();

export const windowControls = {
  minimize: () => win.minimize(),
  toggleMaximize: () => win.toggleMaximize(),
  close: () => win.close(),
  startDragging: () => win.startDragging(),
  isMaximized: () => win.isMaximized(),
  onResize: (cb: () => void) => win.onResized(cb),
};
