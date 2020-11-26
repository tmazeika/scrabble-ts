import './styles.css';
import { TrieNode } from './trie';
import { stringToWord } from './dictionary';
import * as dictionary from './dictionary';

(async () => {
  const root = new TrieNode();
  console.log('Loading dictionary...');
  const start = Date.now();
  (await dictionary.load()).forEach(word => root.insert(word));
  console.log(`Done in ${Date.now() - start}ms!`);
  console.log(root.search(stringToWord('SWARTHIE')!));
})()
