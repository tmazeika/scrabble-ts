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
