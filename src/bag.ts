import { List } from 'immutable';
import { Letter, letterProps, letters } from './dict';
import { shuffled } from './util';

export class Bag {
  private letters: List<Letter> = shuffled(letters.reduce(
    (list, letter) =>
      list.push(...Array(letterProps[letter].count).fill(letter)),
    List<Letter>()));

  public draw(n: number): List<Letter> {
    console.assert(n >= 0);
    const drawn = this.letters.take(n);
    this.letters = this.letters.skip(n);
    return drawn;
  }

  public isEmpty(): boolean {
    return this.letters.isEmpty();
  }

  public toString(): string {
    return this.letters.join();
  }
}
