import styles from './Tile.module.css';
import { type Tile as TileData, tileLabel } from '../domain/tile';

export type TileState = 'normal' | 'selected' | 'correct' | 'wrong';

interface Props {
  tile: TileData;
  state?: TileState;
  size?: 'hand' | 'pad';
  onClick?: () => void;
}

const SUIT_COLOR: Record<string, string> = {
  m: '#1a1612',
  p: '#1f4ea1',
  s: '#1b3a2e',
  z: '#1a1612',
};

const RED_TILES = new Set(['z7', '5m', '1s']);

function getSuitSymbol(suit: string): string {
  return { m: '萬', p: '筒', s: '索', z: '' }[suit] ?? '';
}

export function Tile({ tile, state = 'normal', size = 'pad', onClick }: Props) {
  const isHonor = tile.suit === 'z';
  const label = tileLabel(tile);
  const color = RED_TILES.has(`${tile.num}${tile.suit}`) ? '#c23b22' : SUIT_COLOR[tile.suit];
  const w = size === 'hand' ? 48 : 38;
  const h = size === 'hand' ? 64 : 52;

  return (
    <button
      className={`${styles.tile} ${styles[state]} ${styles[size]}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={state === 'selected'}
      type="button"
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* 牌の地 */}
        <rect x="1" y="1" width={w - 2} height={h - 2} rx="3" fill="#fbf6ec" />
        {/* 内側の影 */}
        <rect x="2" y="2" width={w - 4} height={h - 4} rx="2" fill="none"
          stroke="rgba(26,22,18,0.08)" strokeWidth="1.5" />

        {isHonor ? (
          <text
            x={w / 2} y={h / 2 + 7}
            textAnchor="middle"
            fontSize={size === 'hand' ? 22 : 18}
            fontFamily="'Noto Serif JP', serif"
            fontWeight="700"
            fill={color}
          >
            {label}
          </text>
        ) : (
          <>
            <text
              x={w / 2} y={size === 'hand' ? 34 : 27}
              textAnchor="middle"
              fontSize={size === 'hand' ? 24 : 19}
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="700"
              fill={color}
            >
              {tile.num}
            </text>
            <text
              x={w / 2} y={size === 'hand' ? 52 : 43}
              textAnchor="middle"
              fontSize={size === 'hand' ? 12 : 10}
              fontFamily="'Noto Serif JP', serif"
              fontWeight="500"
              fill={color}
              opacity="0.75"
            >
              {getSuitSymbol(tile.suit)}
            </text>
          </>
        )}
      </svg>
    </button>
  );
}
