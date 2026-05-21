import styles from './Hand.module.css';
import { Tile } from './Tile';
import { type Tile as TileData } from '../domain/tile';

interface Props {
  tiles: TileData[];
}

export function Hand({ tiles }: Props) {
  return (
    <div className={styles.hand} role="group" aria-label="手牌">
      {tiles.map((tile, i) => (
        <Tile key={i} tile={tile} state="normal" size="hand" />
      ))}
    </div>
  );
}
