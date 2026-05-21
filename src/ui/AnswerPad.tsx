import styles from './AnswerPad.module.css';
import { Tile, type TileState } from './Tile';
import { ALL_TILES, type Tile as TileData, tilesEqual } from '../domain/tile';
import { type GamePhase } from '../game/gameReducer';

interface Props {
  selected: TileData[];
  correctWaits: TileData[];
  phase: GamePhase;
  onToggle: (tile: TileData) => void;
  onSubmit: () => void;
  onPass: () => void;
}

export function AnswerPad({ selected, correctWaits, phase, onToggle, onSubmit, onPass }: Props) {
  const suits = ['m', 'p', 's'] as const;

  function getTileState(tile: TileData): TileState {
    if (phase === 'feedback') {
      if (correctWaits.some(c => tilesEqual(c, tile))) return 'correct';
      if (selected.some(s => tilesEqual(s, tile))) return 'wrong';
      return 'normal';
    }
    if (selected.some(s => tilesEqual(s, tile))) return 'selected';
    return 'normal';
  }

  return (
    <div className={styles.pad}>
      {suits.map(suit => (
        <div key={suit} className={styles.row}>
          {ALL_TILES.filter(t => t.suit === suit).map((tile, i) => (
            <Tile
              key={i}
              tile={tile}
              state={getTileState(tile)}
              size="pad"
              onClick={phase === 'playing' ? () => onToggle(tile) : undefined}
            />
          ))}
        </div>
      ))}
      <div className={styles.row}>
        {ALL_TILES.filter(t => t.suit === 'z').map((tile, i) => (
          <Tile
            key={i}
            tile={tile}
            state={getTileState(tile)}
            size="pad"
            onClick={phase === 'playing' ? () => onToggle(tile) : undefined}
          />
        ))}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.btnPass}
          onClick={onPass}
          disabled={phase !== 'playing'}
          type="button"
        >
          パス <span className={styles.penalty}>(-1秒)</span>
        </button>
        <button
          className={styles.btnSubmit}
          onClick={onSubmit}
          disabled={phase !== 'playing' || selected.length === 0}
          type="button"
        >
          確定
        </button>
      </div>
    </div>
  );
}
