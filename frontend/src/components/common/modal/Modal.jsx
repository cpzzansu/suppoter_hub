import commonModalStyles from './Modal.module.css';
import useLockBodyScroll from './useLockBodyScroll.js';

export default function Modal({ setModalOpen, children, ...props }) {
  useLockBodyScroll(); // 스크롤 잠금

  const handleOverlayClick = () => {
    setModalOpen(false);
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className={commonModalStyles.modalOverlay}
      onMouseDown={handleOverlayClick}
    >
      <div {...props} onMouseDown={handleContentClick}>
        {children}
      </div>
    </div>
  );
}
