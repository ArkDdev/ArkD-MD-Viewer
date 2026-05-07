import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/store/uiStore';

export function SettingsModal() {
  const { isSettingsOpen, closeSettings } = useUIStore();

  return (
    <Modal isOpen={isSettingsOpen} onClose={closeSettings} title="Настройки приложения" width="md">
      <div className="space-y-3 py-2 text-sm">
        <p className="text-muted">
          Этот раздел будет реализован в следующей итерации.
        </p>
        <ul className="space-y-1.5 pl-1 text-muted">
          <li>• Язык интерфейса</li>
          <li>• Обновление приложения (автоматически / вручную)</li>
          <li>• О приложении</li>
        </ul>
      </div>
    </Modal>
  );
}
