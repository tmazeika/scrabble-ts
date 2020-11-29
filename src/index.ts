import * as dict from './dict';
import { Scrabble } from './game';
import { HumanPlayer } from './player';
import './styles.css';
import { TrieNode } from './trie';

(async () => {
  const root = new TrieNode();
  console.log('Loading dictionary...');
  (await dict.load()).forEach(word => root.insert(word));
  console.log('Done!');

  const player1 = new HumanPlayer('TJ');
  const player2 = new HumanPlayer('Justine');
  new Scrabble(root, player1, player2).play();
})();
