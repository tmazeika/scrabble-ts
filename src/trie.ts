import { Map } from 'immutable';
import { Letter, Word } from './dict';

export interface TrieNode {
  isAccept(): boolean;

  getEdges(): Map<Letter, TrieNode>;

  search(word: Word): TrieNode | undefined;
}

type TrieEdges = {
  [k in Letter]?: MutableTrieNode;
};

export class MutableTrieNode implements TrieNode {
  private accept: boolean = false;
  private edges: TrieEdges = {};

  public isAccept(): boolean {
    return this.accept;
  }

  public getEdges(): Map<Letter, MutableTrieNode> {
    return Map(Object.entries(this.edges))
      .filter(node => node)
      .map(node => node!)
      .mapKeys(letter => letter as Letter);
  }

  public search(word: Word): TrieNode | undefined {
    return word.reduce(
      (node: MutableTrieNode | undefined, letter) =>
        node?.edges[letter],
      this);
  }

  public insert(word: Word): void {
    word
      .reduce(
        (node: MutableTrieNode, letter) =>
          node.edges[letter] || (node.edges[letter] = new MutableTrieNode()),
        this)
      .accept = true;
  }
}
