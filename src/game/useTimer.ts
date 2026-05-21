import { useEffect, type Dispatch } from 'react';
import { type GameAction, type GamePhase } from './gameReducer';

export function useTimer(phase: GamePhase, dispatch: Dispatch<GameAction>) {
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, [phase, dispatch]);
}
