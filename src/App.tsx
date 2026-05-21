import { useState } from 'react';
import styles from './App.module.css';
import { useGame } from './game/useGame';
import { type GameDifficulty } from './game/gameReducer';
import { Hand } from './ui/Hand';
import { AnswerPad } from './ui/AnswerPad';
import { Timer } from './ui/Timer';
import { ScoreBoard } from './ui/ScoreBoard';
import { ComboBadge } from './ui/ComboBadge';
import { ResultScreen } from './ui/ResultScreen';
import { ReviewScreen } from './ui/ReviewScreen';
import { FeedbackOverlay } from './ui/FeedbackOverlay';
import { classifyWait } from './domain/wait-calculator';

const DIFF_LABELS: Record<GameDifficulty, string> = {
  easy:   '簡単',
  medium: '中級',
  hard:   '上級',
  expert: '超上級',
};
const DIFF_NOTES: Record<GameDifficulty, string> = {
  easy:   '待ちが少なめ',
  medium: 'バランス型',
  hard:   '複雑な待ち',
  expert: '上級＋理牌なし',
};

const BASE = import.meta.env.BASE_URL;
const FAN_SRCS = [
  'p_ji_e_1.gif', 'p_ji_s_1.gif', 'p_ji_w_1.gif', 'p_ji_n_1.gif',
  'p_no_1.gif', 'p_ji_h_1.gif', 'p_ji_c_1.gif',
].map(f => `${BASE}tiles/${f}`);

export default function App() {
  const { state, loading, startGame, toggleTile, submitAnswer, pass, reset, endReview } = useGame();
  const { phase, question, selectedTiles, timeRemaining, totalTime, score, highScore, streak, correctCount, lastAnswerCorrect } = state;
  const [selectedDiff, setSelectedDiff] = useState<GameDifficulty>('medium');
  const [selectedTime, setSelectedTime] = useState(30);
  const TIME_OPTIONS = [30, 60, 120];

  const waitType = question
    ? classifyWait(question.hand, question.correctWaits)
    : null;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>待ち読み道場</h1>
        {phase === 'playing' || phase === 'feedback' ? (
          <ScoreBoard score={score} highScore={highScore} correctCount={correctCount} />
        ) : null}
      </header>

      {(phase === 'playing' || phase === 'feedback') && (
        <main className={styles.main}>
          <div className={styles.timerRow}>
            <Timer timeRemaining={timeRemaining} total={totalTime} />
            <ComboBadge streak={streak} />
          </div>

          <section className={styles.gameArea}>
            <p className={styles.instruction}>待ち牌をすべて選んで確定してください</p>

            {question && <Hand tiles={question.hand} />}

            <div className={styles.padWrapper}>
              {question && (
                <AnswerPad
                  selected={selectedTiles}
                  correctWaits={question.correctWaits}
                  phase={phase}
                  onToggle={toggleTile}
                  onSubmit={submitAnswer}
                  onPass={pass}
                />
              )}
              {phase === 'feedback' && question && (
                <FeedbackOverlay
                  isCorrect={lastAnswerCorrect}
                  correctWaits={question.correctWaits}
                  waitType={waitType}
                />
              )}
            </div>
          </section>

          <div className={styles.gameControls}>
            <button className={styles.btnControl} onClick={reset} type="button">
              トップに戻る
            </button>
            <button className={styles.btnControlAccent} onClick={endReview} type="button">
              終了して振り返る
            </button>
          </div>
        </main>
      )}

      {phase === 'idle' && (
        <div className={styles.idlePage}>
          {/* ヒーロービジュアル */}
          <div className={styles.hero}>
            <p className={styles.heroEyebrow}>麻雀テンパイ練習</p>
            <h2 className={styles.heroHeadline}>この手牌、<br />何待ち？</h2>
            <div className={styles.heroFan}>
              {FAN_SRCS.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  aria-hidden="true"
                  className={styles.fanTile}
                  style={{ '--i': i } as React.CSSProperties}
                />
              ))}
            </div>
            <p className={styles.heroSub}>30秒間で何問正解できるか挑戦！</p>
          </div>

          {/* コントロール */}
          <div className={styles.controls}>
            <p className={styles.diffTitle}>難易度</p>
            <div className={styles.diffGrid}>
              {(Object.keys(DIFF_LABELS) as GameDifficulty[]).map(d => (
                <button
                  key={d}
                  type="button"
                  className={`${styles.btnDiff} ${selectedDiff === d ? styles.diffActive : ''}`}
                  onClick={() => setSelectedDiff(d)}
                >
                  <span className={styles.diffLabel}>{DIFF_LABELS[d]}</span>
                  <span className={styles.diffNote}>{DIFF_NOTES[d]}</span>
                </button>
              ))}
            </div>

            <p className={styles.diffTitle}>制限時間</p>
            <div className={styles.timeGrid}>
              {TIME_OPTIONS.map(t => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.btnTime} ${selectedTime === t ? styles.timeActive : ''}`}
                  onClick={() => setSelectedTime(t)}
                >
                  {t}秒
                </button>
              ))}
            </div>

            <button
              className={styles.btnStart}
              onClick={() => { void startGame(selectedDiff, selectedTime); }}
              type="button"
              disabled={loading}
            >
              {loading ? '読込中…' : '稽古開始'}
            </button>
            <p className={styles.hint}>不正解 −3秒　パス −1秒</p>
          </div>
        </div>
      )}

      {phase === 'finished' && (
        <ResultScreen
          state={state}
          onReplay={() => { void startGame(state.gameDifficulty, state.totalTime); }}
          onReplayWithSeed={() => { void startGame(state.gameDifficulty, state.totalTime, state.questionPool); }}
          onReview={endReview}
        />
      )}

      <footer className={styles.footer}>
        <a
          href="https://github.com/aoi-33/toy-mahjong-machi-quiz"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
        >
          © 2026 aoi-33
        </a>
      </footer>

      {phase === 'review' && (
        <ReviewScreen
          state={state}
          onHome={reset}
          onReplay={() => { void startGame(state.gameDifficulty, state.totalTime); }}
        />
      )}
    </div>
  );
}
