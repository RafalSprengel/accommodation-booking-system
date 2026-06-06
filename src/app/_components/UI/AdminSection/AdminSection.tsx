import type { ReactNode } from 'react';
import styles from './AdminSection.module.css';

interface AdminSectionProps {
  title: string;
  badge?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function AdminSection({ title, badge, description, children, className }: AdminSectionProps) {
  return (
    <section className={`${styles.section}${className ? ` ${className}` : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>{title}</h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
      <div className={styles.body}>
        {children}
      </div>
    </section>
  );
}
