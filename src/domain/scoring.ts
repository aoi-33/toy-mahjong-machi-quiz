export function calcScore(difficulty: number, streak: number): number {
  const base = 100 + difficulty * 20;
  const combo = Math.min(streak * 10, 100);
  return base + combo;
}

export function calcDifficulty(waitCount: number): number {
  if (waitCount >= 5) return 9;
  if (waitCount >= 3) return 7;
  if (waitCount === 2) return 4;
  return 2;
}
