import { type Tile, tilesEqual } from '../domain/tile';
import { type QuizQuestion, generateQuiz } from '../domain/problem-generator';
import { calcScore } from '../domain/scoring';

export type GamePhase = 'idle' | 'playing' | 'feedback' | 'finished';

export interface GameState {
  phase: GamePhase;
  question: QuizQuestion | null;
  selectedTiles: Tile[];
  timeRemaining: number;
  totalTime: number;
  score: number;
  highScore: number;
  streak: number;
  correctCount: number;
  lastAnswerCorrect: boolean | null;
  seedBase: number;
  questionIndex: number;
}

export type GameAction =
  | { type: 'START_GAME'; seed?: number }
  | { type: 'NEXT_QUESTION'; question: QuizQuestion }
  | { type: 'TOGGLE_TILE'; tile: Tile }
  | { type: 'SUBMIT_ANSWER' }
  | { type: 'PASS' }
  | { type: 'TICK' }
  | { type: 'TIME_UP' }
  | { type: 'SHOW_NEXT' };

export function initialState(highScore = 0): GameState {
  return {
    phase: 'idle',
    question: null,
    selectedTiles: [],
    timeRemaining: 90,
    totalTime: 90,
    score: 0,
    highScore,
    streak: 0,
    correctCount: 0,
    lastAnswerCorrect: null,
    seedBase: Date.now(),
    questionIndex: 0,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const seed = action.seed ?? Date.now();
      return {
        ...initialState(state.highScore),
        phase: 'playing',
        seedBase: seed,
        question: generateQuiz(seed),
        questionIndex: 1,
      };
    }
    case 'NEXT_QUESTION':
      return {
        ...state,
        phase: 'playing',
        question: action.question,
        selectedTiles: [],
        lastAnswerCorrect: null,
        questionIndex: state.questionIndex + 1,
      };
    case 'TOGGLE_TILE': {
      if (state.phase !== 'playing') return state;
      const exists = state.selectedTiles.some(t => tilesEqual(t, action.tile));
      return {
        ...state,
        selectedTiles: exists
          ? state.selectedTiles.filter(t => !tilesEqual(t, action.tile))
          : [...state.selectedTiles, action.tile],
      };
    }
    case 'SUBMIT_ANSWER': {
      if (!state.question || state.phase !== 'playing') return state;
      const correct = state.question.correctWaits;
      const selected = state.selectedTiles;
      const isCorrect =
        selected.length === correct.length &&
        selected.every(s => correct.some(c => tilesEqual(s, c)));
      const newStreak = isCorrect ? state.streak + 1 : 0;
      const gained = isCorrect ? calcScore(state.question.difficulty, newStreak) : 0;
      const newScore = state.score + gained;
      const newTime = isCorrect
        ? state.timeRemaining
        : Math.max(0, state.timeRemaining - 3);
      return {
        ...state,
        phase: 'feedback',
        score: newScore,
        highScore: Math.max(state.highScore, newScore),
        streak: newStreak,
        correctCount: state.correctCount + (isCorrect ? 1 : 0),
        lastAnswerCorrect: isCorrect,
        timeRemaining: newTime,
      };
    }
    case 'PASS': {
      if (state.phase !== 'playing') return state;
      return {
        ...state,
        phase: 'feedback',
        streak: 0,
        lastAnswerCorrect: false,
        timeRemaining: Math.max(0, state.timeRemaining - 1),
      };
    }
    case 'TICK':
      if (state.phase !== 'playing') return state;
      if (state.timeRemaining <= 1) return { ...state, phase: 'finished', timeRemaining: 0 };
      return { ...state, timeRemaining: state.timeRemaining - 1 };
    case 'TIME_UP':
      return { ...state, phase: 'finished', timeRemaining: 0 };
    case 'SHOW_NEXT': {
      const nextQ = generateQuiz(state.seedBase + state.questionIndex);
      return gameReducer(state, { type: 'NEXT_QUESTION', question: nextQ });
    }
    default:
      return state;
  }
}
