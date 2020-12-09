import { List, Repeat, Set } from 'immutable';
import { Letter, Word } from './dict';
import { TrieNode } from './trie';

const boardSize = 15;

export class Tile {
  public readonly row: number;
  public readonly col: number;
  public readonly letter?: Letter;
  public readonly crossCheck?: Set<Letter>;

  board: Board;

  public constructor(board: Board, row: number, col: number, letter?: Letter,
                     crossCheck?: Set<Letter>) {
    this.board = board;
    this.row = row;
    this.col = col;
    this.letter = letter;
    this.crossCheck = crossCheck;
  }

  transpose(): Tile {
    return new Tile(this.board, this.col, this.row, this.letter, this.crossCheck);
  }

  public setLetter(letter: Letter): Tile {
    return new Tile(this.board, this.row, this.col, letter, undefined);
  }

  public setCrossCheck(crossCheck?: Set<Letter>): Tile {
    return new Tile(this.board, this.row, this.col, this.letter, crossCheck);
  }

  public getToRight(): Tile | undefined {
    return this.col < boardSize - 1
      ? this.board.getAt(this.row, this.col + 1)
      : undefined;
  }

  public gatherAbove(): List<Letter> {
    return this.board.tiles
      .reverse()
      .slice(boardSize - this.row)
      .map(row => row.get(this.col)!)
      .takeUntil(tile => tile.isEmpty())
      .map(tile => tile.letter!)
      .reverse();
  }

  public gatherBelow(): List<Letter> {
    return this.board.tiles
      .slice(this.row + 1)
      .map(row => row.get(this.col)!)
      .takeUntil(tile => tile.isEmpty())
      .map(tile => tile.letter!);
  }

  public gatherLeft(): List<Letter> {
    return this.board.tiles.get(this.row)!
      .slice(0, this.col)
      .reverse()
      .takeUntil(tile => tile.isEmpty())
      .map(tile => tile.letter!)
      .reverse();
  }

  public gatherRight(): List<Letter> {
    return this.board.tiles.get(this.row)!
      .slice(this.col + 1)
      .takeUntil(tile => tile.isEmpty())
      .map(tile => tile.letter!);
  }

  public isCenter(): boolean {
    const mid = Math.floor(boardSize / 2);
    return this.row === mid && this.col === mid;
  }

  public isXAnchor(): boolean {
    return this.isEmpty() && (!this.isEmptyToLeft() || !this.isEmptyToRight());
  }

  public isYAnchor(): boolean {
    return this.isEmpty() && (!this.isEmptyAbove() || !this.isEmptyBelow());
  }

  public isEmpty(): boolean {
    return this.letter === undefined;
  }

  public isEmptyAround(): boolean {
    return this.isEmptyAbove() && this.isEmptyToRight() &&
      this.isEmptyBelow() && this.isEmptyToLeft();
  }

  public isEmptyAbove(): boolean {
    return this.row === 0 ||
      this.board.isEmptyAt(this.row - 1, this.col);
  }

  public isEmptyBelow(): boolean {
    return this.row === boardSize - 1 ||
      this.board.isEmptyAt(this.row + 1, this.col);
  }

  public isEmptyToLeft(): boolean {
    return this.col === 0 ||
      this.board.isEmptyAt(this.row, this.col - 1);
  }

  public isEmptyToRight(): boolean {
    return this.col === boardSize - 1 ||
      this.board.isEmptyAt(this.row, this.col + 1);
  }
}

export class Board {
  readonly tiles: List<List<Tile>>;

  public constructor(tiles?: List<List<Tile>>) {
    this.tiles = tiles || Repeat(undefined, boardSize)
      .map((_, row) => Repeat(undefined, boardSize)
        .map((_, col) => new Tile(this, row, col))
        .toList())
      .toList();
    // Since this is a cyclic reference, mutation would be easiest here.
    this.tiles.forEach(row => row.forEach(tile => tile.board = this));
    // Assert that the board is (boardSize * boardSize).
    console.assert(this.tiles.size === boardSize);
    this.tiles.forEach(row => console.assert(row.size === boardSize));
  }

  public transpose(): Board {
    return new Board(this.tiles.get(0)!.map((_, colIdx) =>
      this.tiles.map(row =>
        row.get(colIdx)!.transpose())));
  }

  public setYCrossChecks(dict: TrieNode): Board {
    return new Board(this.tiles.map(row =>
      row.map(tile => {
        if (!tile.isYAnchor()) {
          return tile;
        }
        const above = tile.gatherAbove();
        const below = tile.gatherBelow();
        // TODO:
        if (dict.search(above) === undefined) {
          console.log(above);
        }
        return tile.setCrossCheck(Set(dict.search(above)!
          .getEdges()
          .filter(node => node.search(below)?.isAccept())
          .keys()));
      })));
  }

  public getCenter(): Tile {
    const i = Math.floor(boardSize / 2);
    return this.getAt(i, i);
  }

  public getAt(row: number, col: number): Tile {
    console.assert(row >= 0 && row < boardSize && col >= 0 && col < boardSize);
    return this.tiles.get(row)!.get(col)!;
  }

  public isEmptyAt(row: number, col: number): boolean {
    return this.getAt(row, col).isEmpty();
  }

  public setAcross(row: number, col: number, word: Word): Board | undefined {
    if (!this.fitsAcross(row, col, word.size)) {
      return undefined;
    }
    return new Board(this.tiles.set(row, this.tiles.get(row)!.map(tile => {
      if (tile.col >= col && tile.col < col + word.size) {
        return tile.setLetter(word.get(tile.col - col)!);
      }
      return tile;
    })));
  }

  public fitsAcross(row: number, col: number, n: number): boolean {
    return row >= 0 && row < boardSize && col >= 0 && col < boardSize &&
      col + n <= boardSize;
  }

  public inCrossCheck(row: number, col: number, letter: Letter): boolean {
    const tile = this.tiles.get(row)?.get(col);
    return !!tile && (!tile.crossCheck || tile.crossCheck.contains(letter));
  }

  public getAnchors(): List<Tile> {
    return this.tiles.flatMap(row =>
      row.filter(tile =>
        tile.isXAnchor() || tile.isYAnchor()));
  }

  public getRow(row: number): List<Tile> {
    console.assert(row >= 0 && row < boardSize);
    return this.tiles.get(row)!;
  }

  public getCol(col: number): List<Tile> {
    console.assert(col >= 0 && col < boardSize);
    return this.tiles.map(row => row.get(col)!);
  }

  public getAllRows(): List<List<Tile>> {
    return this.tiles;
  }

  public getAllCols(): List<List<Tile>> {
    return this.tiles.map((_, row) =>
      // This only works because we know that the board is square.
      this.getCol(row));
  }

  public toString(): string {
    let str = '  ';
    for (let i = 0; i < boardSize; i++) {
      str += i.toString(16) + ' ';
    }
    str += '\n';
    for (let i = 0; i < boardSize; i++) {
      str += i.toString(16) + ' ';
      this.tiles.get(i)!.forEach(tile =>
        str += (tile.letter || '-') + ' ');
      str += '\n';
    }
    return str;
  }
}
