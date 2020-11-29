import { List, Seq } from 'immutable';

export type Letter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'
  | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W'
  | 'X' | 'Y' | 'Z' | '_';

export type Word = List<Letter>;

export interface LetterProps {
  readonly points: number;
  readonly count: number;
}

export const letterProps: { readonly [k in Letter]: LetterProps } = {
  'A': { points: 1, count: 9 },
  'B': { points: 3, count: 2 },
  'C': { points: 3, count: 2 },
  'D': { points: 2, count: 4 },
  'E': { points: 1, count: 12 },
  'F': { points: 4, count: 2 },
  'G': { points: 2, count: 3 },
  'H': { points: 4, count: 2 },
  'I': { points: 1, count: 9 },
  'J': { points: 8, count: 1 },
  'K': { points: 5, count: 1 },
  'L': { points: 1, count: 4 },
  'M': { points: 3, count: 2 },
  'N': { points: 1, count: 6 },
  'O': { points: 1, count: 8 },
  'P': { points: 3, count: 2 },
  'Q': { points: 10, count: 1 },
  'R': { points: 1, count: 6 },
  'S': { points: 1, count: 4 },
  'T': { points: 1, count: 6 },
  'U': { points: 1, count: 4 },
  'V': { points: 4, count: 2 },
  'W': { points: 4, count: 2 },
  'X': { points: 8, count: 1 },
  'Y': { points: 4, count: 2 },
  'Z': { points: 10, count: 1 },
  '_': { points: 0, count: 2 },
};

export const letters: List<Letter> = List(Object.keys(letterProps) as Letter[]);

export function wordToString(w: Word): string {
  return w.join('');
}

function forceStringToWord(s: string): Word {
  return List(s.split('') as Letter[]);
}

export function stringToWord(s: string): Word | undefined {
  if (!/^[a-z_]*$/i.test(s)) {
    return undefined;
  }
  return forceStringToWord(s.toUpperCase());
}

export async function load(): Promise<Seq<unknown, Word>> {
  const resp = await fetch('/dictionary.txt');
  return Seq((await resp.text()).split('\n'))
    .filter(word => word)
    .map(forceStringToWord);
}
