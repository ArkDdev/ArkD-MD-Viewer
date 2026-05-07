import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/store/uiStore';

export function DisplayModal() {
  const { isDisplayOpen, closeDisplay } = useUIStore();

  return (
    <Modal isOpen={isDisplayOpen} onClose={closeDisplay} title="Отображение" width="md">
      <div className="space-y-3 py-2 text-sm">
        <p className="text-muted">
          Здесь появятся параметры отображения документа.
        </p>
        <ul className="space-y-1.5 pl-1 text-muted">
          <li>• Семейство шрифта (с засечками / без / моноширинный)</li>
          <li>• Размер шрифта</li>
          <li>• Высота строки</li>
          <li>• Ширина поля чтения</li>
          <li>• Акцентный цвет</li>
        </ul>
      </div>
    </Modal>
  );
}
