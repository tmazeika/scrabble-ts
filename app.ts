async function loadDictionary(): Promise<Letter[][]> {
  const resp = await fetch('/scrabble/dictionary.txt');
  const text = await resp.text();
  return text.split('\n')
    .filter(line => line !== '')
    .map(line => [...line].map(letter => letter as Letter));
}

loadDictionary().then(dict => {
  console.log(dict[5]);
});

const MAX_RACK_LEN = 7;
const BOARD_SIZE = 15;

enum Dir {
  ACROSS = 'across',
  DOWN = 'down',
}

interface LetterProps {
  points: number;
  count: number;
}

interface LetterMap {
  'A': LetterProps,
  'B': LetterProps,
  'C': LetterProps,
  'D': LetterProps,
  'E': LetterProps,
  'F': LetterProps,
  'G': LetterProps,
  'H': LetterProps,
  'I': LetterProps,
  'J': LetterProps,
  'K': LetterProps,
  'L': LetterProps,
  'M': LetterProps,
  'N': LetterProps,
  'O': LetterProps,
  'P': LetterProps,
  'Q': LetterProps,
  'R': LetterProps,
  'S': LetterProps,
  'T': LetterProps,
  'U': LetterProps,
  'V': LetterProps,
  'W': LetterProps,
  'X': LetterProps,
  'Y': LetterProps,
  'Z': LetterProps,
  '_': LetterProps,
}

type Letter = keyof LetterMap;

const LETTERS: Readonly<LetterMap> = {
  'A': {points: 1,  count: 9},
  'B': {points: 3,  count: 2},
  'C': {points: 3,  count: 2},
  'D': {points: 2,  count: 4},
  'E': {points: 1,  count: 12},
  'F': {points: 4,  count: 2},
  'G': {points: 2,  count: 3},
  'H': {points: 4,  count: 2},
  'I': {points: 1,  count: 9},
  'J': {points: 8,  count: 1},
  'K': {points: 5,  count: 1},
  'L': {points: 1,  count: 4},
  'M': {points: 3,  count: 2},
  'N': {points: 1,  count: 6},
  'O': {points: 1,  count: 8},
  'P': {points: 3,  count: 2},
  'Q': {points: 10, count: 1},
  'R': {points: 1,  count: 6},
  'S': {points: 1,  count: 4},
  'T': {points: 1,  count: 6},
  'U': {points: 1,  count: 4},
  'V': {points: 4,  count: 2},
  'W': {points: 4,  count: 2},
  'X': {points: 8,  count: 1},
  'Y': {points: 4,  count: 2},
  'Z': {points: 10, count: 1},
  '_': {points: 0,  count: 2},
};

const LETTER_KEYS: Readonly<Letter[]> = Object.keys(LETTERS) as Letter[];

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function removeFirst<T>(arr: T[], e: T): T[] {
  const i = arr.indexOf(e);
  if (i > -1) {
    arr.splice(i, 1);
  }
  return arr;
}

function search<T>(
  arr: T[],
  start: number,
  endMax: number,
  leftPredicate: (e: T, i: number) => boolean,
  rightPredicate: (e: T, i: number) => boolean,
): void {
  for (let i = start; i >= 0; i--) {
    if (!leftPredicate(arr[i], i)) {
      break;
    }
  }
  for (let i = start + 1; i < endMax; i++) {
    if (!rightPredicate(arr[i], i)) {
      break;
    }
  }
}

class Bag {
  private readonly letters: Letter[] = shuffle(Object.entries(LETTERS)
    .reduce(
      (bag, [letter, props]) =>
        [...bag, ...Array(props.count).fill(letter)],
      Array<Letter>()));

  draw(n: number): Letter[] {
    console.assert(n >= 0);
    return this.letters.splice(0, n);
  }

  get isEmpty(): boolean {
    return this.letters.length === 0;
  }

  toString(): string {
    return this.letters.join();
  }
}

class Tile {
  letter: Letter | undefined;

  get isEmpty(): boolean {
    return this.letter === undefined;
  }
}

class Tiles {
  private readonly tiles: Tile[][];

  constructor(tiles?: Tile[][]) {
    this.tiles = (tiles !== undefined)
      ? tiles
      : Array(BOARD_SIZE)
        .fill(undefined)
        .map(() => Array(BOARD_SIZE)
          .fill(undefined)
          .map(() => new Tile()));
  }

  get transposed(): Tiles {
    return new Tiles(this.tiles[0].map((_, col) =>
      this.tiles.map(row => row[col])));
  }

  getRow(row: number): Tile[] {
    console.assert(row >= 0);
    console.assert(row < BOARD_SIZE);
    return this.tiles[row];
  }

  getCol(col: number): Tile[] {
    console.assert(col >= 0);
    console.assert(col < BOARD_SIZE);
    return this.tiles.map(row => row[col]);
  }

  toString(): string {
    let str = '  ';
    for (let i = 0; i < BOARD_SIZE; i++) {
      str += i.toString(16) + ' ';
    }
    str += '\n';
    for (let i = 0; i < BOARD_SIZE; i++) {
      const row = this.tiles[i];
      str += i.toString(16) + ' ';
      for (const tile of row) {
        str += (tile.letter || '-') + ' ';
      }
      str += '\n';
    }
    return str;
  }
}

class Board {
  private tiles = new Tiles();

  place(row: number, col: number, letters: Letter[], dir: Dir): number {
    const tiles = (dir === Dir.DOWN) ? this.tiles.transposed : this.tiles;
    if (dir === Dir.DOWN) [row, col] = [col, row];
    const rowTiles = tiles.getRow(row);

    let points = 0;
    const addPointsUntilBlank = (t: Tile) => {
      if (t.isEmpty) {
        return false;
      }
      points += LETTERS[t.letter!].points;
      return true;
    };
    let letterIdx = 0;
    search(rowTiles, col - 1, BOARD_SIZE, addPointsUntilBlank,
      (t, col) => {
        if (t.isEmpty && letterIdx === letters.length) {
          return false;
        }
        const letter = letters[letterIdx++];
        if (t.isEmpty) {
          t.letter = letter;
          search(tiles.getCol(col), row, BOARD_SIZE,
            addPointsUntilBlank, addPointsUntilBlank);
        } else {
          points += LETTERS[t.letter!].points;
        }
        return true;
      });
    return points;
  }

  toString(): string {
    return this.tiles.toString();
  }
}

class Scrabble {
  readonly bag = new Bag();
  readonly board = new Board();
  readonly players: Player[];

  constructor(...players: Player[]) {
    this.players = players;
    players.forEach(player => player.drawFrom(this.bag));
  }

  toString(): string {
    return this.board.toString();
  }
}

class Player {
  readonly name: string;

  private points: number = 0;
  private rack: Letter[] = [];

  constructor(name: string) {
    this.name = name;
  }

  drawFrom(bag: Bag) {
    this.rack.push(...bag.draw(MAX_RACK_LEN - this.rack.length));
  }

  play(
    game: Scrabble,
    row: number,
    col: number,
    letters: Letter[],
    dir: Dir,
  ): void {
    this.points += game.board.place(row, col, letters, dir);
    letters.forEach(letter => removeFirst(this.rack, letter));
    this.drawFrom(game.bag);
  }

  toString(): string {
    return `${this.name} (${this.points} points) ${this.rack.join()}`;
  }
}

const player1 = new Player('TJ');
const player2 = new Player('Justine');
const game = new Scrabble(player1, player2);

console.log(game.toString());
console.log(player1.toString());
console.log(player2.toString());

function play(
  player: Player,
  row: number,
  col: number,
  word: string,
  dir: Dir,
) {
  const letters = [...word].map(letter => letter as Letter);
  player.play(game, row, col, letters, dir);
  console.log(game.toString());
  console.log(player1.toString());
  console.log(player2.toString());
}

(window as any).play1 = function (
  row: number,
  col: number,
  word: string,
  dir: Dir) {
  play(player1, row, col, word, dir);
};

(window as any).play2 = function (
  row: number,
  col: number,
  word: string,
  dir: Dir,
) {
  play(player2, row, col, word, dir);
};
