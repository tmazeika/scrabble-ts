import { List } from 'immutable';
import { Bag } from './bag';
import { Board } from './board';
import { Letter, stringToWord } from './dict';
import { Dir, Move } from './move';

const rackSize = 7;

export interface Player {
  readonly name: string;
  readonly rack: List<Letter>;
  readonly points: number;

  hasInRack(letters: List<Letter>): boolean;

  removeFromRack(letters: List<Letter>): void;

  drawFrom(bag: Bag): void;

  addPoints(points: number): void;

  play(board: Board): Move;

  toString(): string;
}

abstract class BasePlayer implements Player {
  public readonly name: string;

  public constructor(name: string) {
    this.name = name;
  }

  protected _points: number = 0;

  public get points(): number {
    return this._points;
  }

  private _rack: List<Letter> = List.of();

  public get rack(): List<Letter> {
    return this._rack;
  }

  public hasInRack(letters: List<Letter>): boolean {
    let rack = this._rack;
    return letters.every(letter => {
      const i = rack.indexOf(letter);
      if (i === -1) {
        return false;
      }
      rack = rack.delete(i);
      return true;
    });
  }

  public removeFromRack(letters: List<Letter>): void {
    console.assert(this.hasInRack(letters));
    letters.forEach(letter => {
      this._rack = this._rack.delete(this._rack.indexOf(letter));
    });
  }

  public drawFrom(bag: Bag): void {
    this._rack = this._rack
      .concat(bag.draw(rackSize - this._rack.size));
  }

  public addPoints(points: number) {
    this._points += points;
  }

  abstract play(board: Board): Move;

  public toString(): string {
    return `${this.name} (${this.points} points): ${this._rack.join()}`;
  }
}

export class HumanPlayer extends BasePlayer {
  public constructor(name: string) {
    super(name);
  }

  play(board: Board): Move {
    let moveStr: string | null = null;
    while (!moveStr) {
      moveStr = prompt(`Move for ${this.name}: row,col,across|down,word`);
    }
    const [rowStr, colStr, dirStr, wordStr] = moveStr.split(',', 4);
    return {
      row: Number(rowStr),
      col: Number(colStr),
      dir: dirStr === 'across' ? Dir.Across : Dir.Down,
      word: stringToWord(wordStr)!,
    };
  }
}
