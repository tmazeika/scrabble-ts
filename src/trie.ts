import { List, Map } from 'immutable';
import { Letter, Word } from './dict';

export type TrieEdges = {
  [k in Letter]?: TrieNode;
};

export class TrieNode {
  private accept: boolean = false;
  private edges: TrieEdges = {};

  public isAccept(): boolean {
    return this.accept;
  }

  public getEdges(): Map<Letter, TrieNode> {
    return Map(Object.entries(this.edges))
      .filter(node => node !== undefined)
      .map(node => node!)
      .mapKeys(letter => letter as Letter);
  }

  public search(word: Word): TrieNode | undefined {
    return word.reduce(
      (node: TrieNode | undefined, letter) =>
        node?.edges[letter],
      this);
  }

  public insert(word: Word): void {
    word
      .reduce(
        (node: TrieNode, letter) =>
          node.edges[letter] || (node.edges[letter] = new TrieNode()),
        this)
      .accept = true;
  }
}
