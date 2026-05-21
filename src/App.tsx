import styles from './App.module.css';
import { useGame } from './game/useGame';
import { Hand } from './ui/Hand';
import { AnswerPad } from './ui/AnswerPad';
import { Timer } from './ui/Timer';
import { ScoreBoard } from './ui/ScoreBoard';
import { ComboBadge } from './ui/ComboBadge';
import { ResultScreen } from './ui/ResultScreen';
import { FeedbackOverlay } from './ui/FeedbackOverlay';
import { classifyWait } from './domain/wait-calculator';

export default function App() {
  const { state, startGame, toggleTile, submitAnswer, pass } = useGame();
  const { phase, question, selectedTiles, timeRemaining, totalTime, score, highScore, streak, correctCount, lastAnswerCorrect } = state;

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
        </main>
      )}

      {phase === 'idle' && (
        <div className={styles.start}>
          <p className={styles.desc}>13枚の手牌から待ち牌を当てるタイムアタック！<br />90秒間で何問正解できるか？</p>
          <button className={styles.btnStart} onClick={() => startGame()} type="button">
            稽古開始
          </button>
          <p className={styles.hint}>不正解は -3秒、パスは -1秒</p>
        </div>
      )}

      {phase === 'finished' && (
        <ResultScreen
          state={state}
          onReplay={() => startGame()}
          onReplayWithSeed={() => startGame(state.seedBase)}
        />
      )}
    </div>
  );
}
