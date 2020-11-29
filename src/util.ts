import { List } from 'immutable';

export function shuffled<T>(list: List<T>): List<T> {
  return list.withMutations(mutable => {
    for (let i = mutable.size - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = mutable.get(i)!;
      mutable.set(i, mutable.get(j)!);
      mutable.set(j, tmp);
    }
  });
}
