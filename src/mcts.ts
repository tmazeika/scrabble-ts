import { List } from 'immutable';
import { Board, Tile } from './board';
import { Letter, Word } from './dict';
import { Scrabble } from './game';
import { Dir, Move, transposeMove } from './move';
import { ComputerPlayer, Player } from './player';
import { TrieNode } from './trie';

function inRack(rack: List<Letter>, letter: Letter): boolean {
  return rack.indexOf(letter) !== -1;
}

function removeFromRack(rack: List<Letter>, letter: Letter): List<Letter> {
  return rack.delete(rack.indexOf(letter));
}

function getK(board: Board, anchor: Tile): number {
  return board.getRow(anchor.row)
    .slice(0, anchor.col)
    .reverse()
    .takeUntil(tile => !tile.isEmpty() || !tile.isEmptyAround())
    .size;
}

export function getAcrossMoves(dict: TrieNode, rack: List<Letter>, board: Board): List<Move> {
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
            inRack(rack, letter) &&
            board.inCrossCheck(square.row, square.col, letter) &&
            square.getToRight())
          .forEach((node, letter) =>
            extendRight(removeFromRack(rack, letter),
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
          .filter((_, letter) => inRack(rack, letter))
          .forEach((node, letter) =>
            leftPart(removeFromRack(rack, letter),
              partialWord.push(letter), node, limit - 1));
      }
    };
    if (anchor.isEmptyToLeft()) {
      leftPart(rack, List<Letter>(), dict, getK(board, anchor));
    } else {
      const left = anchor.gatherLeft();
      const node = dict.search(left)!;
      extendRight(rack, left, node, anchor);
    }
    return moves;
  };
  if (board.getCenter().isEmpty()) {
    return List.of(board.getCenter()).reduce(moveReducer, List<Move>());
  }
  return board.getAnchors().reduce(moveReducer, List<Move>());
}

export function getAllMoves(dict: TrieNode, rack: List<Letter>, board: Board): List<Move> {
  const across = getAcrossMoves(dict, rack, board
    .setYCrossChecks(dict));
  const down = getAcrossMoves(dict, rack, board.transpose()
    .setYCrossChecks(dict));
  return across.concat(down.map(move => transposeMove(move)));
}

export function doMCTS(game: Scrabble, moves: List<Move>): Move | undefined {
  game = new Scrabble(game.players.map(player => {
    return new ComputerPlayer(player.name, game.dict,
      ComputerPlayer.randomStrategy(), player.rack, player.points);
  }), game.dict, game.round, game.bag, game.board);

  const player = game.players.get(game.round % game.players.size)!;
  const root = new MCTSNode(game.board, undefined, undefined, player, 0, 0, List<MCTSNode>());
  const end = Date.now() + 10000;

  while (Date.now() < end) {
    const node = selectPromisingNode(root);
    if (game.isOver()) {
      return undefined;
    }
    expandNode(game, player, node, moves);
    let nodeToExplore = node;
    if (!node.children.isEmpty()) {
      nodeToExplore = node.children
        .get(Math.floor(Math.random() * node.children.size))!;
    } else {
      return undefined;
    }
    const result = simulatePlayout(game, player);
    backpropagate(nodeToExplore, result);
  }
  const bestChild = root.children.reduce(
    (bestChild: MCTSNode | undefined, child: MCTSNode) =>
      !bestChild || child.winCount > bestChild.winCount ? child : bestChild,
    undefined);
  return bestChild!.move;
}

function backpropagate(node: MCTSNode, result: number) {
  let tmp: MCTSNode | undefined = node;
  while (tmp) {
    tmp.visitCount++;
    tmp.winCount += result;
    tmp = tmp.parent;
  }
}

function simulatePlayout(game: Scrabble, player: Player): number {
  while (!game.isOver()) {
    game = game.playRound();
  }
  const winners = game.getWinners()!;
  winners.forEach(winner => {
    console.log('Winner this simulation was ', winner.name)
  })
  const isWinner = winners.some(winner => winner.name === player.name);
  if (isWinner && winners.size > 1) {
    return 0;
  }
  return isWinner ? 1 : -1;
}

function expandNode(game: Scrabble, player: Player, node: MCTSNode, moves: List<Move>): void {
  node.children = moves.map(move =>
    new MCTSNode(game.board, move, node, player, 0, 0, List<MCTSNode>()));
}

function selectPromisingNode(node: MCTSNode): MCTSNode {
  while (!node.children.isEmpty()) {
    node = findBestNodeWithUCT(node);
  }
  return node;
}

type BestUCT = { node: MCTSNode, uct: number }

function findBestNodeWithUCT(node: MCTSNode): MCTSNode {
  const visitCount = node.visitCount;
  return node.children.reduce((bestChild: BestUCT | undefined, child) => {
    const uctVal = uct(visitCount, child.winCount, child.visitCount);
    if (!bestChild || uctVal > bestChild.uct) {
      return { node: child, uct: uctVal };
    }
    return bestChild;
  }, undefined)!.node;
}

function uct(totalVisit: number, nodeWinScore: number, nodeVisit: number): number {
  if (nodeVisit == 0) {
    return Number.MAX_SAFE_INTEGER;
  }
  return (nodeWinScore / nodeVisit) +
    1.41 * Math.sqrt(Math.log(totalVisit) / nodeVisit);
}

class MCTSNode {
  readonly board: Board;
  readonly move: Move | undefined;
  readonly parent: MCTSNode | undefined;
  readonly player: Player;
  visitCount: number;
  winCount: number;
  children: List<MCTSNode>;

  constructor(board: Board, move: Move | undefined, parent: MCTSNode | undefined, player: Player,
              visitCount: number, winCount: number, children: List<MCTSNode>) {
    this.board = board;
    this.move = move;
    this.parent = parent;
    this.player = player;
    this.visitCount = visitCount;
    this.winCount = winCount;
    this.children = children;
  }
}
