import { createPortal } from 'react-dom';
import styles from './Tree.module.css';

export default function InfoModal({ isOpen, children, onClose }) {
  if (!isOpen) return null;

  const modal = (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  // removeChild 오류 방지: body가 가장 안정적인 Portal 대상
  return createPortal(modal, document.body);
}
