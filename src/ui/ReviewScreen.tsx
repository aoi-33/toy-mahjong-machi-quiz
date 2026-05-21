import styles from './ReviewScreen.module.css';
import { type AnsweredQuestion, type GameState } from '../game/gameReducer';
import { Tile } from './Tile';

interface Props {
  state: GameState;
  onHome: () => void;
  onReplay: () => void;
}

function TileRow({ tiles, label }: { tiles: AnsweredQuestion['correctWaits']; label: string }) {
  return (
    <div className={styles.tileRow}>
      <span className={styles.tileRowLabel}>{label}</span>
      <div className={styles.tiles}>
        {tiles.map((t, i) => (
          <Tile key={i} tile={t} state="normal" size="pad" />
        ))}
        {tiles.length === 0 && <span className={styles.none}>なし</span>}
      </div>
    </div>
  );
}

export function ReviewScreen({ state, onHome, onReplay }: Props) {
  const { history, score, correctCount } = state;
  const total = history.length;

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h2 className={styles.title}>振り返り</h2>
        <p className={styles.summary}>
          {correctCount}/{total}問正解　{score.toLocaleString()}点
        </p>
      </div>

      <div className={styles.list}>
        {history.map((item, idx) => (
          <div key={idx} className={`${styles.card} ${item.wasCorrect ? styles.correct : styles.wrong}`}>
            <div className={styles.cardHeader}>
              <span className={styles.qNum}>Q{item.questionNum}</span>
              <span className={styles.verdict}>{item.wasCorrect ? '✓ 正解' : '✗ 不正解'}</span>
            </div>

            <div className={styles.hand}>
              {item.hand.map((t, i) => (
                <Tile key={i} tile={t} state="normal" size="pad" />
              ))}
            </div>

            <div className={styles.answers}>
              <TileRow tiles={item.correctWaits} label="正解" />
              {!item.wasCorrect && (
                <TileRow
                  tiles={item.userAnswer}
                  label={item.userAnswer.length === 0 ? 'パス' : '自分'}
                />
              )}
            </div>
          </div>
        ))}
        {total === 0 && <p className={styles.empty}>回答履歴がありません</p>}
      </div>

      <div className={styles.actions}>
        <button className={styles.btnHome} onClick={onHome} type="button">トップへ</button>
        <button className={styles.btnReplay} onClick={onReplay} type="button">もう一回</button>
      </div>
    </div>
  );
}
