import styles from './ResultScreen.module.css';
import { type GameState } from '../game/gameReducer';

interface Props {
  state: GameState;
  onReplay: () => void;
  onReplayWithSeed: () => void;
}

export function ResultScreen({ state, onReplay, onReplayWithSeed }: Props) {
  const shareText = `【待ち読み道場】\nスコア: ${state.score.toLocaleString()}点\n正答: ${state.correctCount}問\n最大コンボ: ${state.streak}\n#待ち読み道場`;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h2 className={styles.title}>結果</h2>
        <div className={styles.stamp}>
          {state.correctCount > 5 ? '合格' : '修行中'}
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>スコア</span>
            <span className={styles.statValue}>{state.score.toLocaleString()}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>正答数</span>
            <span className={styles.statValue}>{state.correctCount}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>最大コンボ</span>
            <span className={styles.statValue}>{state.streak}</span>
          </div>
          {state.score > 0 && state.score === state.highScore && (
            <div className={styles.newRecord}>★ NEW RECORD!</div>
          )}
        </div>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={onReplay} type="button">
            もう一回
          </button>
          <button className={styles.btnSecondary} onClick={onReplayWithSeed} type="button">
            同じ問題で再挑戦
          </button>
          <button
            className={styles.btnShare}
            onClick={() => navigator.clipboard.writeText(shareText)}
            type="button"
          >
            結果をコピー
          </button>
        </div>
      </div>
    </div>
  );
}
