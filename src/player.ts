import { List } from 'immutable';
import { Bag } from './bag';
import { Board, Tile } from './board';
import { Letter, stringToWord, Word } from './dict';
import { Scrabble } from './game';
import { doMCTS, getAcrossMoves, getAllMoves } from './mcts';
import { Dir, Move, transposeMove } from './move';
import { TrieNode } from './trie';
import prompt from 'prompt-sync';

const rackSize = 7;

export interface Player {
  readonly name: string;
  readonly rack: List<Letter>;
  readonly points: number;

  allInRack(letters: List<Letter>): boolean;

  drawFrom(bag: Bag): [Bag, Player];

  removeFromRack(letters: List<Letter>): Player;

  addPoints(points: number): Player;

  play(game: Scrabble): Move | undefined;

  toString(): string;
}

abstract class BasePlayer implements Player {
  public readonly name: string;
  public readonly rack: List<Letter>;
  public readonly points: number;

  protected constructor(name: string, rack?: List<Letter>, points?: number) {
    this.name = name;
    this.rack = rack || List<Letter>();
    this.points = points || 0;
  }

  public allInRack(letters: List<Letter>): boolean {
    let rack = this.rack;
    return letters.every(letter => {
      const i = rack.indexOf(letter);
      if (i === -1) {
        return false;
      }
      rack = rack.delete(i);
      return true;
    });
  }

  public drawFrom(bag: Bag): [Bag, Player] {
    const [drawn, newBag] = bag.draw(rackSize - this.rack.size);
    return [newBag, this.copy(this.name, this.rack.concat(drawn), this.points)];
  }

  public removeFromRack(letters: List<Letter>): Player {
    console.assert(this.allInRack(letters));
    return this.copy(
      this.name,
      this.rack.reduce((rack, letter) =>
        rack.delete(rack.indexOf(letter)), this.rack),
      this.points);
  }

  public addPoints(points: number): Player {
    return this.copy(this.name, this.rack, this.points + points);
  }

  public abstract play(game: Scrabble): Move | undefined;

  public toString(): string {
    return `${this.name} (${this.points} points): ${this.rack.join()}`;
  }

  protected abstract copy(name: string, rack: List<Letter>, points: number): Player;
}

export class HumanPlayer extends BasePlayer {
  public constructor(name: string, rack?: List<Letter>, points?: number) {
    super(name, rack, points);
  }

  public play(game: Scrabble): Move | undefined {
    let moveStr: string | null = null;
    while (moveStr === null) {
      moveStr = prompt()(`Move for ${this.name}: row,col,across|down,word`);
      // moveStr = prompt(`Move for ${this.name}: row,col,across|down,word`);
    }
    if (!moveStr) {
      return undefined;
    }
    const [rowStr, colStr, dirStr, wordStr] = moveStr.split(',', 4);
    return {
      row: parseInt(rowStr, 16),
      col: parseInt(colStr, 16),
      dir: dirStr.toUpperCase() === 'ACROSS' ? Dir.Across : Dir.Down,
      word: stringToWord(wordStr)!,
    };
  }

  protected copy(name: string, rack: List<Letter>, points: number): Player {
    return new HumanPlayer(name, rack, points);
  }
}

export type Strategy = (game: Scrabble, moves: List<Move>) => Move;

export class ComputerPlayer extends BasePlayer {
  private readonly dict: TrieNode;
  private readonly strategy: Strategy;

  public constructor(name: string, dict: TrieNode,
                     strategy: Strategy,
                     rack?: List<Letter>,
                     points?: number) {
    super(name, rack, points);
    this.strategy = strategy;
    this.dict = dict;
  }

  public static firstStrategy(): Strategy {
    return (game, moves) =>
      moves.reduce((first, _) => first, moves.get(0)!);
  }

  public static randomStrategy(): Strategy {
    return (game, moves) =>
      moves.get(Math.floor(Math.random() * moves.size))!;
  }

  public static mctsStrategy(): Strategy {
    return (game, moves) => {
      return doMCTS(game, moves)!;
    };
  }

  public static shortestStrategy(): Strategy {
    return (game, moves) =>
      moves.reduce((bestMove, move) => {
        if (move.word.size < bestMove.word.size) {
          return move;
        }
        return bestMove;
      }, moves.get(0)!);
  }

  public static longestStrategy(): Strategy {
    return (game, moves) =>
      moves.reduce((bestMove, move) => {
        if (move.word.size > bestMove.word.size) {
          return move;
        }
        return bestMove;
      }, moves.get(0)!);
  }

  public static mostPointsStrategy(): Strategy {
    return (game, moves) => {
      const first = moves.get(0)!;
      return moves.reduce((bestMove, move) => {
        const points = Scrabble.getPoints(game.board, move);
        if (points > bestMove.points) {
          return { move, points };
        }
        return bestMove;
      }, { move: first, points: Scrabble.getPoints(game.board, first) }).move;
    };
  }

  public play(game: Scrabble): Move | undefined {
    const moves = getAllMoves(this.dict, this.rack, game.board);
    if (moves.isEmpty()) {
      return undefined;
    }
    return this.strategy(game, moves);
  }

  protected copy(name: string, rack: List<Letter>, points: number): Player {
    return new ComputerPlayer(name, this.dict, this.strategy, rack, points);
  }
}
