import { List } from 'immutable';
import * as dict from './dict';
import { Scrabble } from './game';
import { ComputerPlayer, HumanPlayer, Player } from './player';
// import './styles.css';
import { MutableTrieNode } from './trie';

(async () => {
  const root = new MutableTrieNode();
  console.log('Loading dictionary...');
  (await dict.load()).forEach(word => root.insert(word));
  console.log('Done!');

  const player1 = new ComputerPlayer('TJ', root,
    ComputerPlayer.mostPointsStrategy());
  const player2 = new ComputerPlayer('Justine', root,
    ComputerPlayer.mctsStrategy());
  let game = new Scrabble(List.of<Player>(player1, player2), root).dealTiles();
  while (!game.isOver()) {
    console.log(game.toString());
    try {
      game = game.playRound();
    } catch (e) {
      console.error(e);
    }
  }
  console.log(game.toString());
  console.log(`Game over! ${
    game.players.get(0)!.points > game.players.get(1)!.points
      ? game.players.get(0)!.name
      : game.players.get(1)!.name} won!`);
})();
