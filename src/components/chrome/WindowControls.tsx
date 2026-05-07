import { useEffect, useState } from 'react';
import { windowControls } from '@/lib/window/controls';
import {
  WinMinimizeIcon,
  WinMaximizeIcon,
  WinRestoreIcon,
  WinCloseIcon,
} from '@/components/ui/Icons';

export function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    (async () => {
      setIsMaximized(await windowControls.isMaximized());
      unlisten = await windowControls.onResize(async () => {
        setIsMaximized(await windowControls.isMaximized());
      });
    })();
    return () => unlisten?.();
  }, []);

  return (
    <div className="flex h-full items-stretch">
      <WinButton onClick={() => windowControls.minimize()} aria-label="Minimize">
        <WinMinimizeIcon />
      </WinButton>
      <WinButton onClick={() => windowControls.toggleMaximize()} aria-label={isMaximized ? 'Restore' : 'Maximize'}>
        {isMaximized ? <WinRestoreIcon /> : <WinMaximizeIcon />}
      </WinButton>
      <WinButton onClick={() => windowControls.close()} aria-label="Close" isClose>
        <WinCloseIcon />
      </WinButton>
    </div>
  );
}

function WinButton({
  onClick,
  children,
  isClose,
  ...props
}: {
  onClick: () => void;
  children: React.ReactNode;
  isClose?: boolean;
  'aria-label': string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-full w-11 items-center justify-center text-muted transition-colors duration-100 ${
        isClose
          ? 'hover:bg-[#E81123] hover:text-white'
          : 'hover:bg-surface hover:text-text'
      }`}
      {...props}
    >
      {children}
    </button>
  );
}
