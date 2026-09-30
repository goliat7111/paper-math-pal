export type Ship = { id: string; name: string; size: number; cells: [number, number][] };

export const FLEET = [
  { name: "Hangarfartyg", size: 5, count: 1 },
  { name: "Kryssare", size: 4, count: 1 },
  { name: "Jagare", size: 3, count: 2 },
  { name: "Korvetter", size: 2, count: 3 },
  { name: "U-båtar", size: 1, count: 4 },
] as const;

export function randomFleet(): Ship[] {
  const ships: Ship[] = [];
  const blocked = new Set<string>();
  for (const spec of FLEET) {
    for (let n = 0; n < spec.count; n++) {
      let placed = false;
      for (let tries = 0; tries < 1000 && !placed; tries++) {
        const horizontal = Math.random() < 0.5;
        const maxRow = horizontal ? 9 : 10 - spec.size;
        const maxCol = horizontal ? 10 - spec.size : 9;
        const row = Math.floor(Math.random() * (maxRow + 1));
        const col = Math.floor(Math.random() * (maxCol + 1));
        const cells: [number, number][] = Array.from({ length: spec.size }, (_, i) => [row + (horizontal ? 0 : i), col + (horizontal ? i : 0)]);
        if (cells.every(([r, c]) => !blocked.has(`${r},${c}`))) {
          cells.forEach(([r, c]) => {
            // Reserve the ship and its surrounding cells, including diagonals.
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                blocked.add(`${r + dr},${c + dc}`);
              }
            }
          });
          ships.push({ id: `${spec.name}-${n}`, name: spec.name, size: spec.size, cells });
          placed = true;
        }
      }
      if (!placed) return randomFleet();
    }
  }
  return ships;
}
