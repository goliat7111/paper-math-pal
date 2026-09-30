import { describe, expect, it } from "vitest";
import { FLEET, randomFleet } from "./battleship";

describe("randomFleet", () => {
  it("places complete fleets with a gap between every pair of ships, including diagonally", () => {
    for (let sample = 0; sample < 250; sample++) {
      const ships = randomFleet();
      expect(ships).toHaveLength(FLEET.reduce((sum, spec) => sum + spec.count, 0));
      for (const spec of FLEET) {
        expect(ships.filter(ship => ship.name === spec.name)).toHaveLength(spec.count);
      }
      for (const [index, ship] of ships.entries()) {
        expect(ship.cells).toHaveLength(ship.size);
        ship.cells.forEach(([r, c], cellIndex) => {
          expect(r >= 0 && r < 10 && c >= 0 && c < 10).toBe(true);
          if (cellIndex > 0) {
            const [pr, pc] = ship.cells[cellIndex - 1];
            expect(Math.abs(r - pr) + Math.abs(c - pc)).toBe(1);
          }
          for (const other of ships.slice(index + 1)) {
            for (const [otherRow, otherCol] of other.cells) {
              expect(Math.max(Math.abs(r - otherRow), Math.abs(c - otherCol))).toBeGreaterThan(1);
            }
          }
        });
        expect(new Set(ship.cells.map(([r]) => r)).size === 1 || new Set(ship.cells.map(([, c]) => c)).size === 1).toBe(true);
      }
    }
  });
});