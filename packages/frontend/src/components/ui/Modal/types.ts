// Modal Component Types

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

export interface ModalContentProps {
  children: React.ReactNode;
}

export interface ModalSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}
