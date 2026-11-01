export interface Positioned {
  id: number;
  position: number;
}

export const GAP = 1024;

/**
 * Sort key for dropping `movingId` right before `targetId` within a column: the midpoint between
 * the target and its predecessor, so only the moved card is updated.
 */
export function positionBefore(column: Positioned[], targetId: number, movingId: number): number {
  const list = column.filter((c) => c.id !== movingId).sort((a, b) => a.position - b.position);
  const idx = list.findIndex((c) => c.id === targetId);
  if (idx < 0) return (list.at(-1)?.position ?? 0) + GAP;
  const target = list[idx];
  const prev = list[idx - 1];
  return prev ? (prev.position + target.position) / 2 : target.position - GAP;
}
