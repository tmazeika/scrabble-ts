import { List, Repeat, Set } from 'immutable';
import { Letter } from './dict';
import { TrieNode } from './trie';

const boardSize = 15;

export class Tile {
  public letter?: Letter;
  public crossCheck?: Set<Letter>;

  public isEmpty(): boolean {
    return this.letter === undefined;
  }
}

export class Board {
  private readonly tiles: List<List<Tile>>;

  public constructor(tiles?: List<List<Tile>>) {
    this.tiles = tiles || Repeat(undefined, boardSize)
      .map(() => Repeat(undefined, boardSize)
        .map(() => new Tile())
        .toList())
      .toList();
    // Assert that the board is (boardSize * boardSize).
    console.assert(this.tiles.size === boardSize);
    this.tiles.forEach(row => console.assert(row.size === boardSize));
  }

  public getTransposed(): Board {
    return new Board(this.tiles.get(0)!.map((_, col) =>
      this.tiles.map(row => row.get(col)!)));
  }

  public resetYCrossChecks() {
    this.tiles.forEach(row => row.forEach(tile => tile.crossCheck = undefined));
  }

  public setYCrossChecks(dict: TrieNode) {
    this.getAllCols().forEach((col, colIdx) =>
      col.filter((_, rowIdx) => this.isYAnchor(rowIdx, colIdx))
        .forEach((tile, rowIdx) => {
          const above = this.gatherAbove(rowIdx, colIdx);
          const below = this.gatherBelow(rowIdx, colIdx);
          tile.crossCheck = Set(dict.search(above)!.getEdges()
            .filter(node => node.search(below)!.isAccept())
            .keys());
        }));
  }

  public getAt(row: number, col: number): Letter | undefined {
    return this.tiles.get(row)?.get(col)?.letter;
  }

  public setAt(row: number, col: number, letter: Letter): void {
    const tile = this.tiles.get(row)?.get(col);
    if (tile) {
      tile.letter = letter;
      tile.crossCheck = undefined;
    }
  }

  public gatherAbove(row: number, col: number): List<Letter> {
    return this.tiles
      .reverse()
      .slice(boardSize - row)
      .map(row => row.get(col)!)
      .takeUntil(tile => tile.isEmpty())
      .map(tile => tile.letter!)
      .reverse();
  }

  public gatherRight(row: number, col: number): List<Letter> {
    return this.tiles.get(row)!
      .slice(col + 1)
      .takeUntil(tile => tile.isEmpty())
      .map(tile => tile.letter!);
  }

  public gatherBelow(row: number, col: number): List<Letter> {
    return this.tiles
      .slice(row + 1)
      .map(row => row.get(col)!)
      .takeUntil(tile => tile.isEmpty())
      .map(tile => tile.letter!);
  }

  public gatherLeft(row: number, col: number): List<Letter> {
    return this.tiles.get(row)!
      .slice(0, col)
      .reverse()
      .takeUntil(tile => tile.isEmpty())
      .map(tile => tile.letter!)
      .reverse();
  }

  public fitsAcross(row: number, col: number, n: number): boolean {
    return row >= 0 && row < boardSize && col >= 0 && col < boardSize &&
      col + n < boardSize;
  }

  public isCenter(row: number, col: number): boolean {
    const mid = Math.floor(boardSize / 2);
    return row === mid && col === mid;
  }

  public isEmptyAt(row: number, col: number): boolean {
    return this.getAt(row, col) === undefined;
  }

  public isNotEmptyAround(row: number, col: number): boolean {
    return !this.isEmptyAbove(row, col) || !this.isEmptyToRight(row, col) ||
      !this.isEmptyBelow(row, col) || !this.isEmptyToLeft(row, col);
  }

  public isEmptyToLeft(row: number, col: number): boolean {
    return this.isEmptyAt(row, col - 1);
  }

  public isEmptyToRight(row: number, col: number): boolean {
    return this.isEmptyAt(row, col + 1);
  }

  public isEmptyAbove(row: number, col: number): boolean {
    return this.isEmptyAt(row - 1, col);
  }

  public isEmptyBelow(row: number, col: number): boolean {
    return this.isEmptyAt(row + 1, col);
  }

  public isXAnchor(row: number, col: number): boolean {
    return this.isEmptyAt(row, col) &&
      (!this.isEmptyToLeft(row, col) || !this.isEmptyToRight(row, col));
  }

  public isYAnchor(row: number, col: number): boolean {
    return this.isEmptyAt(row, col) &&
      (!this.isEmptyAbove(row, col) || !this.isEmptyBelow(row, col));
  }

  public inCrossCheck(row: number, col: number, letter: Letter): boolean {
    const tile = this.tiles.get(row)?.get(col);
    return !!tile && (!tile.crossCheck || tile.crossCheck.contains(letter));
  }

  public getRow(row: number): List<Tile> {
    return this.tiles.get(row)!;
  }

  public getCol(col: number): List<Tile> {
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
