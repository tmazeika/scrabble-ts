import { List, Seq, Set } from 'immutable';

export interface LetterProps {
  readonly points: number;
  readonly count: number;
}

export interface LetterMap {
  readonly 'A': LetterProps,
  readonly 'B': LetterProps,
  readonly 'C': LetterProps,
  readonly 'D': LetterProps,
  readonly 'E': LetterProps,
  readonly 'F': LetterProps,
  readonly 'G': LetterProps,
  readonly 'H': LetterProps,
  readonly 'I': LetterProps,
  readonly 'J': LetterProps,
  readonly 'K': LetterProps,
  readonly 'L': LetterProps,
  readonly 'M': LetterProps,
  readonly 'N': LetterProps,
  readonly 'O': LetterProps,
  readonly 'P': LetterProps,
  readonly 'Q': LetterProps,
  readonly 'R': LetterProps,
  readonly 'S': LetterProps,
  readonly 'T': LetterProps,
  readonly 'U': LetterProps,
  readonly 'V': LetterProps,
  readonly 'W': LetterProps,
  readonly 'X': LetterProps,
  readonly 'Y': LetterProps,
  readonly 'Z': LetterProps,
  readonly '_': LetterProps,
}

export type Letter = keyof LetterMap;

export type Word = List<Letter>;

export const letterProps: LetterMap = {
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

  // if (resp.body === null) {
  //   return;
  // }
  //
  // async function* readChunks(): AsyncIterableIterator<string> {
  //   const dec = new TextDecoder('utf-8');
  //   const reader = resp.body!.getReader();
  //
  //   while (true) {
  //     const { value: chunk, done } = await reader.read();
  //     yield chunk ? dec.decode(chunk) : '';
  //     if (done) {
  //       return;
  //     }
  //   }
  // }
  //
  // let partial = '';
  // for await (const chunk of readChunks()) {
  //   partial += chunk;
  //   const lastNL = partial.lastIndexOf('\n');
  //   if (lastNL === -1) {
  //     continue;
  //   }
  //   yield List(partial.substring(0, lastNL).split('\n').map(forceStringToWord));
  //   partial = partial.substring(lastNL + 1);
  // }
  // if (partial !== '') {
  //   // last line didn't end in \n
  //   yield List.of(forceStringToWord(partial));
  // }
}
