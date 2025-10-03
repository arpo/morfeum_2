import { HTMLAttributes, forwardRef } from 'react';
import { IconLoader2 } from '@/icons';
import styles from './LoadingSpinner.module.css';

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ message = 'Loading...', className = '', ...props }, ref) => {
    const spinnerClass = [styles.loading, className].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={spinnerClass} {...props}>
        <IconLoader2 className={styles.spinner} />
        {message}
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';
