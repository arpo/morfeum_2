import { HTMLAttributes, forwardRef } from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', ...props }, ref) => {
    const cardClass = [styles.card, className].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={cardClass} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
