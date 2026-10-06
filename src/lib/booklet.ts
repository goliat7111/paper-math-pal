/** Antal sidor i häftet: 3 ark × 8 A6-sidor. */
export const BOOKLET_PAGES = 24;

/**
 * Utskjutning för ett A4-ark som viks två gånger (först övre halvan bakåt, sedan vänster halva bakåt).
 * Lokala sidor 1–8; övre raden skrivs ut upp och ner. Framsida: [5,4 / 8,1], baksida: [3,6 / 2,7].
 * Arken läggs i varandra, så ark k (yttersta = 0) får sidorna 4k+1…4k+4 och de fyra motsvarande sista.
 */
export function bookletSheets(total = BOOKLET_PAGES): { front: number[]; back: number[] }[] {
  const sheets = total / 8;
  return Array.from({ length: sheets }, (_, k) => {
    const g = (p: number) => (p <= 4 ? 4 * k + p : total - 4 * k - (8 - p));
    return { front: [5, 4, 8, 1].map(g), back: [3, 6, 2, 7].map(g) };
  });
}
