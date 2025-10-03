import { HTMLAttributes, forwardRef } from 'react';
import styles from './Message.module.css';

export interface MessageProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'error' | 'success';
  message: string;
}

export const Message = forwardRef<HTMLDivElement, MessageProps>(
  ({ variant = 'default', message, className = '', ...props }, ref) => {
    const messageClass = [
      styles.message,
      styles[variant],
      className
    ].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={messageClass} {...props}>
        {message}
      </div>
    );
  }
);

Message.displayName = 'Message';
