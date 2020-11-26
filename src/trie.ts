import { Letter, Word } from './dictionary';

type TrieEdges = {
  [k in Letter]?: TrieNode;
};

export class TrieNode {
  private accept: boolean = false;
  private edges: TrieEdges = {};

  public search(word: Word): TrieNode | undefined {
    return word
      .reduce(
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

// import { Letter, Word } from './dictionary';
//
// class DawgEdge {
//   readonly letter: Letter;
//   readonly to: DawgNode;
//
//   constructor(letter: Letter, to: DawgNode) {
//     this.letter = letter;
//     this.to = to;
//   }
// }
//
// type DawgCombiner = DawgEdge[][];
//
// export class DawgNode {
//   private accept: boolean = false;
//   private edges: DawgEdge[] = [];
//   private combiner: DawgCombiner;
//   private finalized: boolean = false;
//
//   private constructor(combiner: DawgCombiner) {
//     this.combiner = combiner;
//   }
//
//   public static createRoot(): DawgNode {
//     return new DawgNode([]);
//   }
//
//   public finalize(): void {
//     this.combiner = [];
//     this.finalized = true;
//   }
//
//   public search(word: Word): DawgNode | undefined {
//     if (word.isEmpty()) {
//       return this;
//     }
//     const letter = word.get(0)!;
//     return this.edges.find(edge => edge.letter === letter)?.to
//       .search(word.slice(1));
//   }
//
//   public insert(word: Word): void {
//     if (this.finalized) {
//       throw new Error('Cannot insert on finalized node.');
//     }
//     return this._insert(word, 0);
//   }
//
//   private _insert(word: Word, i: number): void {
//     if (word.isEmpty()) {
//       this.accept = true;
//       return;
//     }
//     const letter = word.get(0)!;
//     const byLetter = (edge: DawgEdge) => edge.letter === letter;
//     const newEdgeFromCombiner = (): DawgEdge | undefined => {
//       if (i === this.combiner.length) {
//         this.combiner.push([]);
//       }
//       const edge = this.combiner[i].find(byLetter);
//       return edge && this.pushNewEdge(letter, edge.to);
//     };
//     const newNodeAndEdge = (): DawgEdge => {
//       const edge = this.pushNewNodeAndEdge(letter);
//       this.combiner[i].push(edge);
//       return edge;
//     };
//     (this.edges.find(byLetter) || newEdgeFromCombiner() || newNodeAndEdge())
//       .to._insert(word.slice(1), i + 1);
//   }
//
//   private pushNewEdge(letter: Letter, node: DawgNode): DawgEdge {
//     const edge = new DawgEdge(letter, node);
//     this.edges.push(edge);
//     return edge;
//   }
//
//   private pushNewNodeAndEdge(letter: Letter): DawgEdge {
//     return this.pushNewEdge(letter, new DawgNode(this.combiner));
//   }
// }
