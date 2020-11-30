import { List } from 'immutable';
import { Bag } from './bag';
import { Board, Tile } from './board';
import { Letter, stringToWord, Word } from './dict';
import { Scrabble } from './game';
import { Dir, Move, transposeMove } from './move';
import { TrieNode } from './trie';

const rackSize = 7;

export interface Player {
  readonly name: string;
  readonly rack: List<Letter>;
  readonly points: number;

  allInRack(letters: List<Letter>): boolean;

  drawFrom(bag: Bag): [Bag, Player];

  removeFromRack(letters: List<Letter>): Player;

  addPoints(points: number): Player;

  play(board: Board): Move | undefined;

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

  public abstract play(board: Board): Move | undefined;

  public toString(): string {
    return `${this.name} (${this.points} points): ${this.rack.join()}`;
  }

  protected abstract copy(name: string, rack: List<Letter>, points: number): Player;
}

export class HumanPlayer extends BasePlayer {
  public constructor(name: string, rack?: List<Letter>, points?: number) {
    super(name, rack, points);
  }

  public play(board: Board): Move | undefined {
    let moveStr: string | null = null;
    while (moveStr === null) {
      moveStr = prompt(`Move for ${this.name}: row,col,across|down,word`);
    }
    if (moveStr === '') {
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

export class ComputerPlayer extends BasePlayer {
  private readonly dict: TrieNode;

  public constructor(name: string, dict: TrieNode, rack?: List<Letter>, points?: number) {
    super(name, rack, points);
    this.dict = dict;
  }

  private static inRack(rack: List<Letter>, letter: Letter): boolean {
    return rack.indexOf(letter) !== -1;
  }

  private static removeFromRack(rack: List<Letter>, letter: Letter): List<Letter> {
    return rack.delete(rack.indexOf(letter));
  }

  private static getK(board: Board, anchor: Tile): number {
    return board.getRow(anchor.row)
      .slice(0, anchor.col)
      .reverse()
      .takeUntil(tile => !tile.isEmpty() || !tile.isEmptyAround())
      .size;
  }

  public play(board: Board): Move | undefined {
    const across = this.getAcrossMoves(board
      .setYCrossChecks(this.dict));
    const down = this.getAcrossMoves(board.transpose()
      .setYCrossChecks(this.dict));
    const moves = across.concat(down.map(move => transposeMove(move)));
    console.log(moves.toJS());
    if (moves.isEmpty()) {
      return undefined;
    }
    return moves.reduce((bestMove, move) => {
      if (move.word.size < bestMove.word.size) {
        return move;
      }
      return bestMove;
    }, moves.get(0)!);
    // return moves.reduce((bestMove, move) => {
    //   if (move.word.size > bestMove.word.size) {
    //     return move;
    //   }
    //   return bestMove;
    // }, moves.get(0)!);
    // return moves.reduce((bestMove, move) => {
    //   const points = Scrabble.getPoints(board, move);
    //   if (points > bestMove.points) {
    //     return { move, points };
    //   }
    //   return bestMove;
    // }, { move: firstMove, points: Scrabble.getPoints(board, firstMove) }).move;
  }

  protected copy(name: string, rack: List<Letter>, points: number): Player {
    return new ComputerPlayer(name, this.dict, rack, points);
  }

  private getAcrossMoves(board: Board): List<Move> {
    const moveReducer = (moves: List<Move>, anchor: Tile) => {
      const extendRight = (rack: List<Letter>, partialWord: Word, node: TrieNode, square: Tile) => {
        if (square.isEmpty()) {
          if (node.isAccept() && anchor.col < square.col) {
            moves = moves.push({
              row: square.row,
              col: square.col - partialWord.size,
              dir: Dir.Across,
              word: partialWord,
            });
          }
          node.getEdges()
            .filter((_, letter) =>
              ComputerPlayer.inRack(rack, letter) &&
              board.inCrossCheck(square.row, square.col, letter) &&
              square.getToRight())
            .forEach((node, letter) =>
              extendRight(ComputerPlayer.removeFromRack(rack, letter),
                partialWord.push(letter),
                node,
                square.getToRight()!));
        } else {
          const l = square.letter!;
          const nodePrime = node.getEdges().get(l);
          if (nodePrime && square.getToRight()) {
            extendRight(rack, partialWord.push(l), nodePrime,
              square.getToRight()!);
          }
        }
      };
      const leftPart = (rack: List<Letter>, partialWord: Word, node: TrieNode, limit: number) => {
        extendRight(rack, partialWord, node, anchor);
        if (limit > 0) {
          node.getEdges()
            .filter((_, letter) =>
              ComputerPlayer.inRack(rack, letter))
            .forEach((node, letter) =>
              leftPart(ComputerPlayer.removeFromRack(rack, letter),
                partialWord.push(letter), node, limit - 1));
        }
      };
      if (anchor.isEmptyToLeft()) {
        leftPart(this.rack, List<Letter>(), this.dict,
          ComputerPlayer.getK(board, anchor));
      } else {
        const left = anchor.gatherLeft();
        const node = this.dict.search(left)!;
        extendRight(this.rack, left, node, anchor);
      }
      return moves;
    };
    if (board.getCenter().isEmpty()) {
      return List.of(board.getCenter()).reduce(moveReducer, List<Move>());
    }
    return board.getAnchors().reduce(moveReducer, List<Move>());
  }
}
