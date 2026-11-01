import { describe, expect, it } from 'vitest';
import { GAP, positionBefore } from './position';

const col = [
  { id: 1, position: 1024 },
  { id: 2, position: 2048 },
  { id: 3, position: 3072 },
];

describe('positionBefore', () => {
  it('uses the midpoint between the target and its predecessor', () => {
    expect(positionBefore(col, 3, 99)).toBe(2560);
  });

  it('goes before the first card', () => {
    expect(positionBefore(col, 1, 99)).toBe(1024 - GAP);
  });

  it('ignores the moving card itself when reordering within a column', () => {
    // moving card 1 before card 3: predecessor of 3 (without 1) is 2
    expect(positionBefore(col, 3, 1)).toBe(2560);
  });

  it('appends when the target is missing', () => {
    expect(positionBefore(col, 42, 99)).toBe(3072 + GAP);
  });
});
