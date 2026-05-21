import { type Tile, tilesEqual } from '../domain/tile';
import { type QuizQuestion } from '../domain/problem-generator';
export type { QuizQuestion };
import { calcScore } from '../domain/scoring';

export type GamePhase = 'idle' | 'playing' | 'feedback' | 'finished' | 'review';
export type GameDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface AnsweredQuestion {
  hand: Tile[];
  correctWaits: Tile[];
  userAnswer: Tile[];
  wasCorrect: boolean;
  questionNum: number;
}

export interface GameState {
  phase: GamePhase;
  gameDifficulty: GameDifficulty;
  question: QuizQuestion | null;
  selectedTiles: Tile[];
  timeRemaining: number;
  totalTime: number;
  score: number;
  highScore: number;
  streak: number;
  correctCount: number;
  lastAnswerCorrect: boolean | null;
  questionPool: QuizQuestion[];
  questionIndex: number;
  history: AnsweredQuestion[];
}

export type GameAction =
  | { type: 'START_GAME'; questions: QuizQuestion[]; difficulty: GameDifficulty }
  | { type: 'NEXT_QUESTION'; question: QuizQuestion }
  | { type: 'TOGGLE_TILE'; tile: Tile }
  | { type: 'SUBMIT_ANSWER' }
  | { type: 'PASS' }
  | { type: 'TICK' }
  | { type: 'TIME_UP' }
  | { type: 'SHOW_NEXT' }
  | { type: 'RESET' }
  | { type: 'END_REVIEW' };

export function initialState(highScore = 0): GameState {
  return {
    phase: 'idle',
    gameDifficulty: 'medium',
    question: null,
    selectedTiles: [],
    timeRemaining: 30,
    totalTime: 30,
    score: 0,
    highScore,
    streak: 0,
    correctCount: 0,
    lastAnswerCorrect: null,
    questionPool: [],
    questionIndex: 0,
    history: [],
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const pool = action.questions;
      return {
        ...initialState(state.highScore),
        phase: 'playing',
        gameDifficulty: action.difficulty,
        questionPool: pool,
        question: pool[0] ?? null,
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
      const entry: AnsweredQuestion = {
        hand: state.question.hand,
        correctWaits: correct,
        userAnswer: selected,
        wasCorrect: isCorrect,
        questionNum: state.questionIndex,
      };
      return {
        ...state,
        phase: 'feedback',
        score: newScore,
        highScore: Math.max(state.highScore, newScore),
        streak: newStreak,
        correctCount: state.correctCount + (isCorrect ? 1 : 0),
        lastAnswerCorrect: isCorrect,
        timeRemaining: newTime,
        history: [...state.history, entry],
      };
    }
    case 'PASS': {
      if (state.phase !== 'playing') return state;
      const entry: AnsweredQuestion = {
        hand: state.question!.hand,
        correctWaits: state.question!.correctWaits,
        userAnswer: state.selectedTiles,
        wasCorrect: false,
        questionNum: state.questionIndex,
      };
      return {
        ...state,
        phase: 'feedback',
        streak: 0,
        lastAnswerCorrect: false,
        timeRemaining: Math.max(0, state.timeRemaining - 1),
        history: [...state.history, entry],
      };
    }
    case 'TICK':
      if (state.phase !== 'playing') return state;
      if (state.timeRemaining <= 1) return { ...state, phase: 'finished', timeRemaining: 0 };
      return { ...state, timeRemaining: state.timeRemaining - 1 };
    case 'TIME_UP':
      return { ...state, phase: 'finished', timeRemaining: 0 };
    case 'SHOW_NEXT': {
      const pool = state.questionPool;
      const nextQ = pool[state.questionIndex % pool.length];
      return gameReducer(state, { type: 'NEXT_QUESTION', question: nextQ });
    }
    case 'RESET':
      return { ...initialState(state.highScore) };
    case 'END_REVIEW':
      return { ...state, phase: 'review' };
    default:
      return state;
  }
}
