import * as chai from 'chai';
import { expect } from 'chai';
// @ts-ignore
import chaiImmutable from 'chai-immutable';
import { List } from 'immutable';
import { Bag } from './bag';

chai.use(chaiImmutable);

describe('Bag', () => {
  describe('draw', () => {
    it('should return drawn letters and a bag without those letters', () => {
      const bag = new Bag(List.of('A', 'A', 'B', 'D', 'C'));
      const [drawn, newBag] = bag.draw(3);
      expect(drawn).to.equal(List.of('A', 'A', 'B'));
      expect(newBag.letters).to.equal(List.of('D', 'C'));
    });

    it('should return all letters and an empty bag', () => {
      const bag = new Bag(List.of('B', 'A', 'B'));
      const [drawn, newBag] = bag.draw(4);
      expect(drawn).to.equal(List.of('B', 'A', 'B'));
      expect(newBag.letters).to.be.empty;
    });
  });

  describe('isEmpty', () => {
    it('should return true when the bag is empty', () => {
      const bag = new Bag(List.of());
      expect(bag.isEmpty()).to.be.true;
    });

    it('should return false when the bag is not empty', () => {
      const bag = new Bag(List.of('A', 'B'));
      expect(bag.isEmpty()).to.be.false;
    });
  });

  describe('toString', () => {
    it('should return an empty string for an empty bag', () => {
      const bag = new Bag(List.of());
      expect(bag.toString()).to.equal('');
    });

    it('should return a CSV string', () => {
      const bag = new Bag(List.of('A', 'B', 'C'));
      expect(bag.toString()).to.equal('A,B,C');
    });
  });
});
