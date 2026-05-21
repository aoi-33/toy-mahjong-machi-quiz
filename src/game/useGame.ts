import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { gameReducer, initialState, type QuizQuestion, type GameDifficulty } from './gameReducer';
import { useTimer } from './useTimer';
import { loadHighScore, saveHighScore } from '../storage/ranking';
import { loadQuestions } from './questionLoader';
import { type Tile } from '../domain/tile';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function filterQuestions(questions: QuizQuestion[], difficulty: GameDifficulty): QuizQuestion[] {
  switch (difficulty) {
    case 'easy':   return questions.filter(q => q.difficulty <= 2);
    case 'medium': return questions;
    case 'hard':   return questions.filter(q => q.difficulty >= 3);
    case 'expert': return questions.filter(q => q.difficulty >= 3).map(q => ({ ...q, hand: shuffleArray(q.hand) as Tile[] }));
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState(loadHighScore()));
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useTimer(state.phase, dispatch);

  useEffect(() => {
    if (state.phase === 'finished' && state.score > loadHighScore()) {
      saveHighScore(state.score);
    }
  }, [state.phase, state.score]);

  const startGame = useCallback(async (difficulty: GameDifficulty = 'medium', pool?: QuizQuestion[]) => {
    setLoading(true);
    const raw = pool ?? await loadQuestions();
    const filtered = filterQuestions(raw, difficulty);
    const questions = filtered.length >= 10 ? filtered : raw;
    dispatch({ type: 'START_GAME', questions, difficulty });
    setLoading(false);
  }, []);

  const toggleTile = useCallback((tile: Tile) => {
    dispatch({ type: 'TOGGLE_TILE', tile });
  }, []);

  const submitAnswer = useCallback(() => {
    dispatch({ type: 'SUBMIT_ANSWER' });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => dispatch({ type: 'SHOW_NEXT' }), 1200);
  }, []);

  const pass = useCallback(() => {
    dispatch({ type: 'PASS' });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => dispatch({ type: 'SHOW_NEXT' }), 800);
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    dispatch({ type: 'RESET' });
  }, []);

  const endReview = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    dispatch({ type: 'END_REVIEW' });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { state, loading, startGame, toggleTile, submitAnswer, pass, reset, endReview };
}
