// Modal Component - PURE JSX ONLY
import { useEffect } from 'react';
import { IconX } from '@/icons';
import styles from './Modal.module.css';
import type { ModalProps, ModalHeaderProps, ModalContentProps, ModalSectionProps } from './types';

export function Modal({ isOpen, onClose, title, maxWidth = 'md', children }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles[maxWidth]}`} onClick={(e) => e.stopPropagation()}>
        {title && <ModalHeader title={title} onClose={onClose} />}
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      <button
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Close modal"
      >
        <IconX size={20} />
      </button>
    </div>
  );
}

export function ModalContent({ children }: ModalContentProps) {
  return <div className={styles.content}>{children}</div>;
}

export function ModalSection({ title, description, children }: ModalSectionProps) {
  return (
    <div className={styles.section}>
      {title && <h3 className={styles.sectionTitle}>{title}</h3>}
      {description && <p className={styles.sectionDescription}>{description}</p>}
      {children}
    </div>
  );
}
