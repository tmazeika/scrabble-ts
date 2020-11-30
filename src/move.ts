import { Word } from './dict';

export enum Dir {
  Across,
  Down,
}

export interface Move {
  readonly row: number;
  readonly col: number;
  readonly dir: Dir;
  readonly word: Word;
}

export function transposeMove(move: Move): Move {
  return {
    row: move.col,
    col: move.row,
    dir: move.dir === Dir.Across ? Dir.Down : Dir.Across,
    word: move.word,
  };
}
