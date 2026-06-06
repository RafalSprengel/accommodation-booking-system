import type { ReactNode } from 'react';
import styles from './SettingRow.module.css';

interface SettingRowProps {
  label: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function SettingRow({ label, description, children, className }: SettingRowProps) {
  return (
    <div className={`${styles.row}${className ? ` ${className}` : ''}`}>
      <div className={styles.content}>
        <div className={styles.labelWrapper}>{label}</div>
        {description && <div className={styles.description}>{description}</div>}
      </div>
      <div className={styles.control}>
        {children}
      </div>
    </div>
  );
}
