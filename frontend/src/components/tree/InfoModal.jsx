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

  return createPortal(
    modal,
    document.getElementById('modal-root'), // <-- body 바로 아래로
  );
}
