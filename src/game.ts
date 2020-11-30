import { List } from 'immutable';
import { Bag } from './bag';
import { Board } from './board';
import { Letter, letterProps, Word } from './dict';
import { Dir, Move, transposeMove } from './move';
import { Player } from './player';
import { TrieNode } from './trie';

export class Scrabble {
  public readonly bag: Bag;
  public readonly board: Board;
  public readonly players: List<Player>;

  private readonly dict: TrieNode;
  private readonly round: number;

  public constructor(players: List<Player>, dict: TrieNode, round?: number, bag?: Bag, board?: Board) {
    console.assert(!players.isEmpty());
    this.players = players;
    this.dict = dict;
    this.round = round || 0;
    this.bag = bag || new Bag();
    this.board = board || new Board();
  }

  private get currentPlayer(): number {
    return this.round % this.players.size;
  }

  public playRound(): Promise<Scrabble> {
    const player = this.players.get(this.currentPlayer)!;
    let board = this.board;
    let move = player.play(board);
    if (move === undefined) {
      return Promise.resolve(new Scrabble(
        this.players,
        this.dict,
        this.round + 1,
        this.bag,
        this.board));
    }
    let transposed = false;
    if (move.dir === Dir.Down) {
      board = board.transpose();
      move = transposeMove(move);
      transposed = true;
    }

    // Validity checks.
    if (!board.fitsAcross(move.row, move.col, move.word.size)) {
      return Promise.reject('Move would fall off the board.');
    }
    console.log(board.setYCrossChecks(this.dict));
    if (!this.makesValidWords(board.setYCrossChecks(this.dict), move)) {
      return Promise.reject('Invalid word(s) would be created.');
    }
    const neededFromRack = this.getNeededFromRack(board, move);
    if (!player.allInRack(neededFromRack)) {
      return Promise.reject(`You don't have the required letters [${
        neededFromRack.join()}] in your rack.`);
    }
    if (this.round === 0 && !this.passesThroughCenter(board, move)) {
      return Promise.reject('The first move must pass through the center of the board.');
    }
    if (this.round > 0 && !this.touchesAnything(board, move)) {
      return Promise.reject('At least one tile must touch an existing tile.');
    }

    // Perform move.
    const points = Scrabble.getPoints(board, move);
    const [newBag, newPlayer] = player.removeFromRack(neededFromRack)
      .addPoints(points)
      .drawFrom(this.bag);
    board = board.setAcross(move.row, move.col, move.word)!;
    return Promise.resolve(new Scrabble(
      this.players.set(this.currentPlayer, newPlayer),
      this.dict,
      this.round + 1,
      newBag,
      transposed ? board.transpose() : board));
  }

  public toString(): string {
    return this.board.toString() + '\n' +
      this.players.map(player => player.toString()).join('\n');
  }

  public dealTiles(): Scrabble {
    return this.players.reduce((game: Scrabble, player, i) => {
      const [newBag, newPlayer] = player.drawFrom(game.bag);
      return new Scrabble(game.players.set(i, newPlayer), game.dict, game.round,
        newBag, game.board);
    }, this);
  }

  public static getPoints(board: Board, move: Move): number {
    if (move.dir === Dir.Down) {
      board = board.transpose();
      move = transposeMove(move);
    }
    const sumPoints = (points: number, letter: Letter): number =>
      points + letterProps[letter].points;
    // Sum across word.
    const left = board.getAt(move.row, move.col)
      .gatherLeft();
    const right = board.getAt(move.row, move.col + move.word.size - 1)
      .gatherRight();
    const acrossWord = left.concat(move.word).concat(right);
    // If the across word size is == 1, then it must simply be an extension to
    // a down word. There are no words of length == 1, so don't count them.
    const across = acrossWord.size > 1 ? acrossWord.reduce(sumPoints, 0) : 0;
    // Sum down words.
    const down = move.word.reduce((points, letter, i) => {
      if (!board.isEmptyAt(move.row, move.col + i)) {
        return points;
      }
      const above = board.getAt(move.row, move.col + i).gatherAbove();
      const below = board.getAt(move.row, move.col + i).gatherBelow();
      if (above.isEmpty() && below.isEmpty()) {
        return points;
      }
      return points + above.push(letter).concat(below).reduce(sumPoints, 0);
    }, 0);
    return across + down;
  }

  public isOver(): boolean {
    // TODO: Also check if there are any more plays possible.
    return this.bag.isEmpty() &&
      this.players.every(player => player.rack.isEmpty());
  }

  private passesThroughCenter(board: Board, move: Move): boolean {
    return move.word.some((letter, i) =>
      board.getAt(move.row, move.col + i).isCenter());
  }

  private touchesAnything(board: Board, move: Move): boolean {
    return move.word.some((letter, i) =>
      !board.getAt(move.row, move.col + i).isEmptyAround());
  }

  private makesValidWords(board: Board, move: Move): boolean {
    // Valid down.
    return move.word.every((letter, i) => {
        const onBoard = board.getAt(move.row, move.col + i).letter;
        if (onBoard) {
          return onBoard === letter;
        }
        return board.inCrossCheck(move.row, move.col + i, letter);
      }) &&
      // Valid across.
      this.isWord(board.getAt(move.row, move.col).gatherLeft()
        .concat(move.word)
        .concat(board.getAt(move.row, move.col + move.word.size - 1)
          .gatherRight()));
  }

  private getNeededFromRack(board: Board, move: Move): List<Letter> {
    return move.word.filter((_, i) =>
      board.isEmptyAt(move.row, move.col + i));
  }

  private isWord(word: Word): boolean {
    return !!this.dict.search(word)?.isAccept();
  }
}
