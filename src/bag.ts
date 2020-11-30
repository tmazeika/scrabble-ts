import { List } from 'immutable';
import { Letter } from './dict';
import * as dict from './dict';
import { shuffled } from './util';

export class Bag {
  public readonly letters: List<Letter>;

  public constructor(letters?: List<Letter>) {
    this.letters = letters || shuffled(dict.letters.reduce(
      (list, letter) =>
        list.push(...Array(dict.letterProps[letter].count).fill(letter)),
      List<Letter>()));
  }

  public draw(n: number): [List<Letter>, Bag] {
    console.assert(n >= 0);
    return [this.letters.take(n), new Bag(this.letters.skip(n))];
  }

  public isEmpty(): boolean {
    return this.letters.isEmpty();
  }

  public toString(): string {
    return this.letters.join();
  }
}
