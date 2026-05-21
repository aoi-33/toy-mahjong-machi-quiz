import styles from './Tile.module.css';
import { type Tile as TileData, tileLabel } from '../domain/tile';

export type TileState = 'normal' | 'selected' | 'correct' | 'wrong';

interface Props {
  tile: TileData;
  state?: TileState;
  size?: 'hand' | 'pad';
  onClick?: () => void;
}

const HONOR_FILENAMES: Record<number, string> = {
  1: 'p_ji_e_1.gif',
  2: 'p_ji_s_1.gif',
  3: 'p_ji_w_1.gif',
  4: 'p_ji_n_1.gif',
  5: 'p_no_1.gif',
  6: 'p_ji_h_1.gif',
  7: 'p_ji_c_1.gif',
};

const SUIT_PREFIX: Record<string, string> = { m: 'p_ms', p: 'p_ps', s: 'p_ss' };

function tileFilename(tile: TileData): string {
  if (tile.suit === 'z') return HONOR_FILENAMES[tile.num];
  return `${SUIT_PREFIX[tile.suit]}${tile.num}_1.gif`;
}

const BASE = import.meta.env.BASE_URL;

export function Tile({ tile, state = 'normal', size = 'pad', onClick }: Props) {
  const label = tileLabel(tile);
  const src = `${BASE}tiles/${tileFilename(tile)}`;

  return (
    <button
      className={`${styles.tile} ${styles[state]} ${styles[size]}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={state === 'selected'}
      type="button"
    >
      <img src={src} alt={label} aria-hidden="true" />
    </button>
  );
}
