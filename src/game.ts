import { List } from 'immutable';
import { Bag } from './bag';
import { Board } from './board';
import { Letter, letterProps, Word } from './dict';
import { Dir, Move } from './move';
import { Player } from './player';
import { TrieNode } from './trie';

export class Scrabble {
  public readonly bag = new Bag();
  public readonly board = new Board();
  public readonly players: List<Player>;

  private readonly dict: TrieNode;

  private round: number = 0;

  public constructor(dict: TrieNode, ...players: Player[]) {
    console.assert(players.length > 0);
    this.dict = dict;
    this.players = List(players);
    this.players.forEach(player =>
      player.drawFrom(this.bag));
  }

  public play(): void {
    let player: Player = this.nextPlayer();
    while (true) {
      console.log(this.toString());
      let board = this.board;
      let move = player.play(board);
      if (move.dir === Dir.Down) {
        board = board.getTransposed();
        move = {
          row: move.col,
          col: move.row,
          dir: Dir.Across,
          word: move.word,
        };
      }
      board.resetYCrossChecks();
      board.setYCrossChecks(this.dict);
      if (!board.fitsAcross(move.row, move.col, move.word.size)) {
        console.log('Move would fall off the board.');
        continue;
      }
      if (!this.isValidOnBoard(board, move)) {
        console.log('Invalid word(s) would be created.');
        continue;
      }
      const neededFromRack = this.getNeededFromRack(board, move);
      if (!player.hasInRack(neededFromRack)) {
        console.log(`You don't have the required letters [${
          neededFromRack.join()}] in your rack.`);
        continue;
      }
      if (this.round === 1 && !this.passesThroughCenter(board, move)) {
        console.log('The first move must pass through the center of the board.');
        continue;
      }
      if (this.round > 1 && !this.touchesAnything(board, move)) {
        console.log('At least one tile must touch an existing tile.');
        continue;
      }
      const points = this.getPoints(board, move);
      console.log(`You scored ${points} points!`);
      player.addPoints(points);
      player.removeFromRack(neededFromRack);
      player.drawFrom(this.bag);
      move.word.forEach((letter, i) =>
        board.setAt(move.row, move.col + i, letter));
      player = this.nextPlayer();
    }
  }

  public toString(): string {
    return this.board.toString() + '\n' +
      this.players.map(player => player.toString()).join('\n');
  }

  private getPoints(board: Board, move: Move): number {
    const sumPoints = (points: number, letter: Letter): number =>
      points + letterProps[letter].points;
    // Sum across word.
    const left = board.gatherLeft(move.row, move.col);
    const right = board.gatherRight(move.row, move.col + move.word.size - 1);
    const acrossWord = left.concat(move.word).concat(right);
    // If the across word size is == 1, then it must simply be an extension to
    // a down word. There are no words of length == 1, so don't count them.
    const across = acrossWord.size > 1 ? acrossWord.reduce(sumPoints, 0) : 0;
    // Sum down words.
    const down = move.word.reduce((points, letter, i) => {
      if (!board.isEmptyAt(move.row, move.col + i)) {
        return points;
      }
      const above = board.gatherAbove(move.row, move.col + i);
      const below = board.gatherBelow(move.row, move.col + i);
      if (!above.isEmpty() || !below.isEmpty()) {
        return points + above.push(letter).concat(below).reduce(sumPoints, 0);
      }
      return points;
    }, 0);
    return across + down;
  }

  private passesThroughCenter(board: Board, move: Move): boolean {
    return move.word.some((letter, i) =>
      board.isCenter(move.row, move.col + i));
  }

  private touchesAnything(board: Board, move: Move): boolean {
    return move.word.some((letter, i) =>
      board.isNotEmptyAround(move.row, move.col + i));
  }

  private isValidOnBoard(board: Board, move: Move): boolean {
    // Valid down.
    return move.word.every((letter, i) => {
        const onBoard = board.getAt(move.row, move.col + i);
        if (onBoard) {
          return onBoard === letter;
        }
        return board.inCrossCheck(move.row, move.col + i, letter);
      }) &&
      // Valid across.
      this.isWord(board.gatherLeft(move.row, move.col)
        .concat(move.word)
        .concat(board.gatherRight(move.row, move.col + move.word.size - 1)));
  }

  private getNeededFromRack(board: Board, move: Move): List<Letter> {
    return move.word.filter((_, i) =>
      board.isEmptyAt(move.row, move.col + i));
  }

  private isWord(word: Word): boolean {
    return this.dict.search(word)?.isAccept() === true;
  }

  private nextPlayer(): Player {
    return this.players.get(this.round++ % this.players.size)!;
  }
}
