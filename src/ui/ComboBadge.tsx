import styles from './ComboBadge.module.css';

interface Props { streak: number; }

export function ComboBadge({ streak }: Props) {
  if (streak < 2) return null;
  return (
    <div className={styles.badge} aria-live="polite">
      <span className={styles.label}>連</span>
      <span className={styles.count}>{streak}</span>
    </div>
  );
}
