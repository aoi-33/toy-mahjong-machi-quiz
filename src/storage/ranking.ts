const KEY = 'mahjong-machi-quiz:highscore';

export function loadHighScore(): number {
  try {
    return parseInt(localStorage.getItem(KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number): void {
  try {
    localStorage.setItem(KEY, String(score));
  } catch {
    // ignore
  }
}
