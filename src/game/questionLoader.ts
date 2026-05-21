import { type QuizQuestion, generateQuiz } from '../domain/problem-generator';

const TOTAL_CHUNKS = 1000;
const FETCH_COUNT = 10;
const BASE = import.meta.env.BASE_URL;

export async function loadQuestions(): Promise<QuizQuestion[]> {
  try {
    const indices = Array.from({ length: TOTAL_CHUNKS }, (_, i) => i);
    for (let i = indices.length - 1; i > indices.length - FETCH_COUNT - 1; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const selected = indices.slice(indices.length - FETCH_COUNT);

    const chunks = await Promise.all(
      selected.map(i =>
        fetch(`${BASE}questions/chunk-${String(i).padStart(4, '0')}.json`).then(r => {
          if (!r.ok) throw new Error(`fetch failed: ${r.status}`);
          return r.json() as Promise<QuizQuestion[]>;
        })
      )
    );

    const flat = chunks.flat();
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flat[i], flat[j]] = [flat[j], flat[i]];
    }
    return flat;
  } catch {
    // 問題ファイルが未生成の場合はオンデマンド生成にフォールバック
    return Array.from({ length: 100 }, () => generateQuiz());
  }
}
