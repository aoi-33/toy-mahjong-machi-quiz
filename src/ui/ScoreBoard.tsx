import styles from './ScoreBoard.module.css';

interface Props {
  score: number;
  highScore: number;
  correctCount: number;
}

export function ScoreBoard({ score, highScore, correctCount }: Props) {
  return (
    <div className={styles.board}>
      <div className={styles.item}>
        <span className={styles.label}>スコア</span>
        <span className={styles.value}>{score.toLocaleString()}</span>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>正答</span>
        <span className={styles.value}>{correctCount}</span>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>ベスト</span>
        <span className={`${styles.value} ${styles.best}`}>{highScore.toLocaleString()}</span>
      </div>
    </div>
  );
}
