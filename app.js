import { dictionary } from './dictionary.js';

const rng = new Math.seedrandom('hello.');

const ACROSS = 'across';
const DOWN = 'down';

const points = {
  a: 1,
  b: 3,
  c: 3,
  d: 2,
  e: 1,
  f: 4,
  g: 2,
  h: 4,
  i: 1,
  j: 8,
  k: 5,
  l: 1,
  m: 3,
  n: 1,
  o: 1,
  p: 3,
  q: 10,
  r: 1,
  s: 1,
  t: 1,
  u: 1,
  v: 4,
  w: 4,
  x: 8,
  y: 4,
  z: 10,
}

class Scrabble {
  constructor(...players) {
    this.bag = {
      a: 9,
      b: 2,
      c: 2,
      d: 4,
      e: 12,
      f: 2,
      g: 3,
      h: 2,
      i: 9,
      j: 1,
      k: 1,
      l: 4,
      m: 2,
      n: 6,
      o: 8,
      p: 2,
      q: 1,
      r: 6,
      s: 4,
      t: 6,
      u: 4,
      v: 2,
      w: 2,
      x: 1,
      y: 2,
      z: 1,
      _: 2,
    };
    this.turn = false;
    this.players = players;
    this.board = new Array(15);
    for (let i = 0; i < this.board.length; i++) {
      this.board[i] = new Array(15);
    }
    this.board[7][7] = { val: '+', };
    players.forEach(this.dealTiles.bind(this));
  }

  getAllMoves(player) {
  }

  dealTiles(player) {
    let n = 7 - player.rack.length;
    const bag = this.bagToArray();
    for (; n > 0; n--) {
      if (bag.length === 0) {
        return false;
      }
      const letter = bag[Math.floor(rng.quick() * bag.length)];
      this.bag[letter]--;
      player.rack.push(letter);
    }
    return true;
  }

  bagToArray() {
    return Object.entries(this.bag).reduce((acc, [letter, count]) => {
      for (; count > 0; count--) {
        acc.push(letter);
      }
      return acc;
    }, []);
  }

  toString() {
    let str = '  '
    for (let i = 0; i < this.board.length; i++) {
      str += i.toString(16) + ' ';
    }
    str += '\n';
    for (let i = 0; i < this.board.length; i++) {
      const row = this.board[i];
      str += i.toString(16) + ' ';
      for (const tile of row) {
        str += (tile ? tile.val : '-') + ' ';
      }
      str += '\n';
    }
    return str;
  }
}

class Player {
  constructor(name, turn) {
    this.name = name;
    this.turn = turn;
    this.rack = [];
    this.points = 0;
  }

  play(game, word, row, col, dir) {
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];

      if (game.board[row][col]?.val !== letter) {
        this.rack.splice(this.rack.indexOf(letter), 1);
        game.board[row][col] = { val: letter };
      }
      this.points += points[letter];

      switch (dir) {
        case DOWN:
          row++;
          break;
        case ACROSS:
          col++;
          break;
      }
    }
    game.dealTiles(this);
    game.turn = !game.turn;
  }

  toString() {
    let str = 'Name: ' + this.name + '\n';
    str += 'Points: ' + this.points + '\n';
    str += 'Rack: ' + this.rack.join(', ');
    return str;
  }
}

const player1 = new Player('TJ', false);
const player2 = new Player('Justine', true);
const game = new Scrabble(player1, player2);

console.log(game.toString());
console.log(player1.toString());
console.log(player2.toString());

window.play1 = function(row, col, dir, word) {
  play(player1, row, col, dir, word);
}

window.play2 = function(row, col, dir, word) {
  play(player2, row, col, dir, word);
}

function play(player, row, col, dir, word) {
  player.play(game, word, row, col, dir);
  console.log(game.toString());
  console.log(player1.toString());
  console.log(player2.toString());
}

window.dictionary = dictionary;
