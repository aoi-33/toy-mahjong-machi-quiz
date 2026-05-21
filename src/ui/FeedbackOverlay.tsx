import styles from './FeedbackOverlay.module.css';
import { type Tile, tileLabel } from '../domain/tile';
import { type WaitType, WAIT_LABELS } from '../domain/wait-calculator';

interface Props {
  isCorrect: boolean | null;
  correctWaits: Tile[];
  waitType: WaitType | null;
}

export function FeedbackOverlay({ isCorrect, correctWaits, waitType }: Props) {
  if (isCorrect === null) return null;
  return (
    <div className={`${styles.overlay} ${isCorrect ? styles.correct : styles.wrong}`} aria-live="assertive">
      <div className={styles.stamp}>
        {isCorrect ? '正' : '誤'}
      </div>
      {!isCorrect && (
        <div className={styles.answer}>
          正解: {correctWaits.map(tileLabel).join(' / ')}
          {waitType && <span className={styles.waitType}> ({WAIT_LABELS[waitType]})</span>}
        </div>
      )}
      {isCorrect && waitType && (
        <div className={styles.waitType}>{WAIT_LABELS[waitType]}</div>
      )}
    </div>
  );
}
