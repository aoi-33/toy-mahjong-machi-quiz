import styles from './Timer.module.css';

interface Props {
  timeRemaining: number;
  total: number;
}

export function Timer({ timeRemaining, total }: Props) {
  const ratio = timeRemaining / total;
  const warning = timeRemaining <= 10;
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.digits} ${warning ? styles.warning : ''}`}>
        {String(timeRemaining).padStart(2, '0')}
      </div>
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${warning ? styles.barWarning : ''}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
