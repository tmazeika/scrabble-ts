import * as chai from 'chai';
import { expect } from 'chai';
// @ts-ignore
import chaiImmutable from 'chai-immutable';
import { List } from 'immutable';
import { Board } from './board';
import { stringToWord } from './dict';

chai.use(chaiImmutable);

describe('Board', () => {
  describe('transpose', () => {
    it('should return the transpose', () => {
      const board = new Board();
      const transposed = board.setAcross(0, 1, stringToWord('AA')!)?.transpose();
      expect(transposed).to.not.be.undefined;
      expect(transposed?.getCol(0).slice(1, 3).map(tile => tile.letter))
        .to.equal(List.of('A', 'A'));
    });
  });

  describe('setAcross', () => {
    it('should place a word across', () => {
      const board = new Board();
      const newBoard = board.setAcross(0, 1, stringToWord('AA')!);
      expect(newBoard).to.not.be.undefined;
      expect(newBoard?.getRow(0).slice(1, 3).map(tile => tile.letter))
        .to.equal(List.of('A', 'A'));
    });
  });
});
