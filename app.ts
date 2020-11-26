// async function loadDictionary(): Promise<Letter[][]> {
//   const resp = await fetch('/scrabble/dictionary.txt');
//   const text = await resp.text();
//   return text.split('\n')
//     .filter(line => line !== '')
//     .map(line => [...line].map(letter => letter as Letter));
// }
//
// class DictNode {
//
//   private accept = false;
//   private edges = new Map<Letter, DictNode>();
//
//   search(word: Letter[]): DictNode | undefined {
//     if (word.length === 0) {
//       return this;
//     }
//     const to = this.edges.get(word[0]);
//     if (to !== undefined) {
//       return to.search(word.slice(1));
//     } else {
//       return undefined;
//     }
//   }
//
//   get nextPossible(): [Letter, DictNode][] {
//     return Array.from(this.edges.entries());
//   }
//
//   insert(word: Letter[]) {
//     if (word.length === 0) {
//       this.accept = true;
//     } else {
//       const to = this.edges.get(word[0]);
//       if (to !== undefined) {
//         to.insert(word.slice(1));
//       } else {
//         const to = new DictNode();
//         this.edges.set(word[0], to);
//         to.insert(word.slice(1));
//       }
//     }
//   }
//
//   get isAccept(): boolean {
//     return this.accept;
//   }
// }
//
// const rootDictNode = new DictNode();
//
// loadDictionary().then(dict => {
//   dict.forEach((word) => {
//     rootDictNode.insert(word);
//   });
// });
//
// const MAX_RACK_LEN = 7;
// const BOARD_SIZE = 15;
//
// enum Dir {
//   ACROSS = 'across',
//   DOWN = 'down',
// }
//

//
// function shuffle<T>(arr: T[]): T[] {
//   for (let i = arr.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [arr[i], arr[j]] = [arr[j], arr[i]];
//   }
//   return arr;
// }
//
// function removeFirst<T>(arr: T[], e: T): T[] {
//   const i = arr.indexOf(e);
//   if (i > -1) {
//     arr.splice(i, 1);
//   }
//   return arr;
// }
//
// function search<T>(
//   arr: T[],
//   start: number,
//   endMax: number,
//   leftPredicate: (e: T, i: number) => boolean,
//   rightPredicate: (e: T, i: number) => boolean,
// ): void {
//   for (let i = start; i >= 0; i--) {
//     if (!leftPredicate(arr[i], i)) {
//       break;
//     }
//   }
//   for (let i = start + 1; i < endMax; i++) {
//     if (!rightPredicate(arr[i], i)) {
//       break;
//     }
//   }
// }
//
// class Bag {
//
//   private readonly letters: Letter[] = shuffle(Object.entries(LETTERS)
//     .reduce(
//       (bag, [letter, props]) =>
//         [...bag, ...Array(props.count).fill(letter)],
//       Array<Letter>()));
//
//   draw(n: number): Letter[] {
//     console.assert(n >= 0);
//     return this.letters.splice(0, n);
//   }
//
//   get isEmpty(): boolean {
//     return this.letters.length === 0;
//   }
//
//   toString(): string {
//     return this.letters.join();
//   }
// }
//
// class Tile {
//
//   // TODO
//   anchor: boolean = false;
//   letter: Letter | undefined;
//   crossCheck: Letter[] | undefined;
//
//   get isEmpty(): boolean {
//     return this.letter === undefined;
//   }
// }
//
// class Tiles {
//
//   private readonly tiles: Tile[][];
//
//   constructor(tiles?: Tile[][]) {
//     this.tiles = (tiles !== undefined)
//       ? tiles
//       : Array(BOARD_SIZE)
//         .fill(undefined)
//         .map(() => Array(BOARD_SIZE)
//           .fill(undefined)
//           .map(() => new Tile()));
//   }
//
//   get transposed(): Tiles {
//     return new Tiles(this.tiles[0].map((_, col) =>
//       this.tiles.map(row => row[col])));
//   }
//
//   isEmpty(row: number, col: number): boolean {
//     return this.tiles[row][col].isEmpty;
//   }
//
//   inCrossCheck(row: number, col: number, letter: Letter): boolean {
//     return this.tiles[row][col].crossCheck?.indexOf(letter) !== -1;
//   }
//
//   getAt(row: number, col: number): Letter | undefined {
//     return this.tiles[row][col].letter;
//   }
//
//   getAllRows(): Tile[][] {
//     return this.tiles;
//   }
//
//   getAllCols(): Tile[][] {
//     const cols = [];
//     for (let col = 0; col < BOARD_SIZE; col++) {
//       cols.push(this.getCol(col));
//     }
//     return cols;
//   }
//
//   generateCrossChecks() {
//     this.getAllCols().forEach((col, colIdx) => {
//       col.forEach((tile, row) => {
//         tile.crossCheck = undefined;
//         if (tile.isEmpty) {
//           if (row > 0 && row < BOARD_SIZE - 1 &&
//             !col[row - 1].isEmpty && !col[row + 1].isEmpty) {
//             const upWord = [] as Letter[];
//             const downWord = [] as Letter[];
//             search(col, row - 1, BOARD_SIZE, tile => {
//               if (tile.isEmpty) {
//                 return false;
//               }
//               upWord.unshift(tile.letter!);
//               return true;
//             }, (tile, i) => {
//               if (i === row) {
//                 return true;
//               }
//               if (tile.isEmpty) {
//                 return false;
//               }
//               downWord.push(tile.letter!);
//               return true;
//             });
//             tile.crossCheck = rootDictNode.search(upWord)!.nextPossible
//               .filter(([_, to]) => to.search(downWord)?.isAccept)
//               .map(([letter, _]) => letter);
//           } else if (row > 0 && !col[row - 1].isEmpty) {
//             const upWord = [] as Letter[];
//             search(col, row - 1, BOARD_SIZE, tile => {
//               if (tile.isEmpty) {
//                 return false;
//               }
//               upWord.unshift(tile.letter!);
//               return true;
//             }, () => false);
//             tile.crossCheck = rootDictNode.search(upWord)!.nextPossible
//               .map(([letter, _]) => letter);
//           } else if (row < BOARD_SIZE - 1 && !col[row + 1].isEmpty) {
//             const downWord = [] as Letter[];
//             search(col, row, BOARD_SIZE, () => false, tile => {
//               if (tile.isEmpty) {
//                 return false;
//               }
//               downWord.push(tile.letter!);
//               return true;
//             });
//             tile.crossCheck = rootDictNode.nextPossible
//               .filter(([_, to]) => to.search(downWord)?.isAccept)
//               .map(([letter, _]) => letter);
//           }
//         }
//       });
//     });
//   }
//
//   getRow(row: number): Tile[] {
//     console.assert(row >= 0);
//     console.assert(row < BOARD_SIZE);
//     return this.tiles[row];
//   }
//
//   getCol(col: number): Tile[] {
//     console.assert(col >= 0);
//     console.assert(col < BOARD_SIZE);
//     return this.tiles.map(row => row[col]);
//   }
//
//   toString(): string {
//     let str = '  ';
//     for (let i = 0; i < BOARD_SIZE; i++) {
//       str += i.toString(16) + ' ';
//     }
//     str += '\n';
//     for (let i = 0; i < BOARD_SIZE; i++) {
//       const row = this.tiles[i];
//       str += i.toString(16) + ' ';
//       for (const tile of row) {
//         str += (tile.letter || (tile.anchor ? '*' : '-')) + ' ';
//       }
//       str += '\n';
//     }
//     return str;
//   }
// }
//
// class Move {
//   row: number;
//   col: number;
//   dir: Dir | undefined;
//   letters: Letter[];
//
//   constructor(row: number, col: number, letters: Letter[], dir?: Dir) {
//     this.row = row;
//     this.col = col;
//     this.dir = dir;
//     this.letters = letters;
//   }
// }
//
// class Board {
//   private tiles = new Tiles();
//
//   getMoves(rack: Letter[]): Move[] {
//     const result: Move[] = [];
//     let tiles = this.tiles;
//     tiles.getAllRows().forEach((row, rowIdx) => {
//       row.forEach((tile, colIdx) => {
//         tile.anchor = false;
//         if (tile.isEmpty && (colIdx !== 0 && !row[colIdx - 1].isEmpty ||
//           colIdx !== BOARD_SIZE - 1 && !row[colIdx + 1].isEmpty)) {
//           tile.anchor = true;
//           const moves = this.generateMoves(tiles, rack, rowIdx, colIdx);
//           moves.forEach(move => {
//             move.dir = Dir.ACROSS;
//             result.push(move);
//           })
//         }
//       });
//     });
//     tiles = this.tiles.transposed;
//     tiles.getAllRows().forEach((row, rowIdx) => {
//       row.forEach((tile, colIdx) => {
//         if (tile.isEmpty && (colIdx !== 0 && !row[colIdx - 1].isEmpty ||
//           colIdx !== BOARD_SIZE - 1 && !row[colIdx + 1].isEmpty)) {
//           tile.anchor = true;
//           const moves = this.generateMoves(tiles, rack, rowIdx, colIdx);
//           moves.forEach(move => {
//             move.dir = Dir.DOWN;
//             [move.row, move.col] = [move.col, move.row];
//             result.push(move);
//           })
//         }
//       });
//     });
//     return result;
//   }
//
//   leftPart(tiles: Tiles, acc: Move[], rack: Letter[], row: number, col: number, partialWord: Letter[], n: DictNode, limit: number): void {
//     if (col < 0) {
//       return;
//     }
//     this.extendRight(tiles, acc, rack, partialWord, partialWord.length, n, row, col);
//     if (limit > 0) {
//       n.nextPossible.forEach(([letter, to]) => {
//         if (rack.indexOf(letter) !== -1) {
//           removeFirst(rack, letter);
//           this.leftPart(tiles, acc, rack, row, col, partialWord.concat(letter), to, limit - 1);
//           rack.push(letter);
//         }
//       });
//     }
//   }
//
//   extendRight(tiles: Tiles, acc: Move[], rack: Letter[], partialWord: Letter[], origLen: number, n: DictNode, row: number, col: number): void {
//     if (col >= BOARD_SIZE) {
//       return;
//     }
//     if (tiles.isEmpty(row, col)) {
//       if (n.isAccept) {
//         acc.push(new Move(row, col - partialWord.length + origLen, partialWord));
//       }
//       n.nextPossible.forEach(([letter, to]) => {
//         if (rack.indexOf(letter) !== -1 && tiles.inCrossCheck(row, col, letter)) {
//           removeFirst(rack, letter);
//           this.extendRight(tiles, acc, rack, partialWord.concat(letter), origLen, to, row, col + 1);
//           rack.push(letter);
//         }
//       });
//     } else {
//       const letter = tiles.getAt(row, col);
//       n.nextPossible
//         .filter(([l, _]) => l === letter)
//         .forEach(([letter, to]) => {
//           this.extendRight(tiles, acc, rack, partialWord.concat(letter), origLen, to, row, col + 1);
//         });
//     }
//   }
//
//   generateMoves(tiles: Tiles, rack: Letter[], row: number, col: number): Move[] {
//     let k = 0;
//     search(tiles.getRow(row), col - 1, BOARD_SIZE, (tile, col) => {
//       if (!tile.isEmpty || (col > 0 && tiles.getAt(row, col - 1) !== undefined)) {
//         return false;
//       }
//       k++;
//       return true;
//     }, () => false);
//     const moves = [] as Move[];
//     this.leftPart(tiles, moves, rack, row, col, [], rootDictNode, k);
//     return moves;
//   }
//
//   place(row: number, col: number, letters: Letter[], dir: Dir): number {
//     const tiles = (dir === Dir.DOWN) ? this.tiles.transposed : this.tiles;
//     if (dir === Dir.DOWN) [row, col] = [col, row];
//     tiles.generateCrossChecks();
//     const rowTiles = tiles.getRow(row);
//
//     let points = 0;
//     const addPointsUntilBlank = (t: Tile) => {
//       if (t.isEmpty) {
//         return false;
//       }
//       points += LETTERS[t.letter!].points;
//       return true;
//     };
//     let letterIdx = 0;
//     search(rowTiles, col - 1, BOARD_SIZE, addPointsUntilBlank,
//       (t, col) => {
//         if (t.isEmpty && letterIdx === letters.length) {
//           return false;
//         }
//         const letter = letters[letterIdx++];
//         if (t.isEmpty) {
//           t.letter = letter;
//           search(tiles.getCol(col), row, BOARD_SIZE,
//             addPointsUntilBlank, addPointsUntilBlank);
//         } else {
//           points += LETTERS[t.letter!].points;
//         }
//         return true;
//       });
//     return points;
//   }
//
//   toString(): string {
//     return this.tiles.toString();
//   }
// }
//
// class Scrabble {
//   readonly bag = new Bag();
//   readonly board = new Board();
//   readonly players: Player[];
//
//   constructor(...players: Player[]) {
//     this.players = players;
//     players.forEach(player => player.drawFrom(this.bag));
//   }
//
//   toString(): string {
//     return this.board.toString();
//   }
// }
//
// class Player {
//   readonly name: string;
//   readonly rack: Letter[] = [];
//
//   private points: number = 0;
//
//   constructor(name: string) {
//     this.name = name;
//   }
//
//   drawFrom(bag: Bag) {
//     this.rack.push(...bag.draw(MAX_RACK_LEN - this.rack.length));
//   }
//
//   play(
//     game: Scrabble,
//     row: number,
//     col: number,
//     letters: Letter[],
//     dir: Dir,
//   ): void {
//     this.points += game.board.place(row, col, letters, dir);
//     letters.forEach(letter => removeFirst(this.rack, letter));
//     this.drawFrom(game.bag);
//   }
//
//   toString(): string {
//     return `${this.name} (${this.points} points) ${this.rack.join()}`;
//   }
// }
//
// const player1 = new Player('TJ');
// const player2 = new Player('Justine');
// const game = new Scrabble(player1, player2);
//
// console.log(game.toString());
// console.log(player1.toString());
// console.log(player2.toString());
//
// function play(
//   player: Player,
//   row: number,
//   col: number,
//   word: string,
//   dir: Dir,
// ) {
//   const letters = [...word].map(letter => letter as Letter);
//   player.play(game, row, col, letters, dir);
//   console.log(game.toString());
//   console.log(player1.toString());
//   console.log(player2.toString());
// }
//
// (window as any).play1 = function (
//   row: number,
//   col: number,
//   word: string,
//   dir: Dir) {
//   play(player1, row, col, word, dir);
// };
//
// (window as any).play2 = function (
//   row: number,
//   col: number,
//   word: string,
//   dir: Dir,
// ) {
//   play(player2, row, col, word, dir);
// };
//
// (window as any).possibleMoves1 = function () {
//   game.board.getMoves(player1.rack).forEach(move => {
//     console.log(`(${move.row}, ${move.col}) ${move.dir}: "${move.letters.join('')}"`);
//   })
// };
//
// (window as any).possibleMoves2 = function () {
//   game.board.getMoves(player2.rack).forEach(move => {
//     console.log(`(${move.row}, ${move.col}) ${move.dir}: "${move.letters.join('')}"`);
//   })
// };
//
// (window as any).printBoard = function () {
//   console.log(game.toString());
// };
