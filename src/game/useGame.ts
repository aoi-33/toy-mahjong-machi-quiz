import { useReducer, useCallback, useEffect, useRef } from 'react';
import { gameReducer, initialState } from './gameReducer';
import { useTimer } from './useTimer';
import { loadHighScore, saveHighScore } from '../storage/ranking';
import { type Tile } from '../domain/tile';

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState(loadHighScore()));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useTimer(state.phase, dispatch);

  useEffect(() => {
    if (state.phase === 'finished' && state.score > loadHighScore()) {
      saveHighScore(state.score);
    }
  }, [state.phase, state.score]);

  const startGame = useCallback((seed?: number) => {
    dispatch({ type: 'START_GAME', seed });
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { state, startGame, toggleTile, submitAnswer, pass };
}
