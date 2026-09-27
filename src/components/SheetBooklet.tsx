import type { ReactNode } from "react";

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

function pairsFor(s: number): [number, number][] {
  const out: [number, number][] = [];
  for (let a = s; a >= Math.ceil(s / 2); a--) out.push([a, s - a]);
  return out;
}

function PageContent({ page, showPairs }: { page: number; showPairs: boolean }): ReactNode {
  if (page === 1) return <div className="booklet-cover">
    <p className="booklet-kicker">Mitt häfte</p>
    <h2 className="booklet-cover-title">Talkamrater</h2>
    <p className="booklet-cover-sub">2–20</p>
    <p className="booklet-name">Namn: <span /></p>
  </div>;
  if (page >= 2 && page <= 20) {
    const pairs = pairsFor(page);
    return <div className="booklet-num">
      <h3 className="booklet-num-title"><span>{page}</span>-kamrater</h3>
      <table className="booklet-table" style={{ fontSize: pairs.length > 8 ? "4.2mm" : "5mm" }}>
        <tbody>{pairs.map(([a, b]) => <tr key={a}><td>{showPairs ? `${a} + ${b}` : ""}</td><td>=</td><td>{page}</td></tr>)}</tbody>
      </table>
      <span className="booklet-folio">{page}</span>
    </div>;
  }
  if (page === BOOKLET_PAGES) return <div className="booklet-back"><p>Räknebladet</p></div>;
  return <div className="booklet-notes"><p>Egna anteckningar</p><span className="booklet-folio">{page}</span></div>;
}

function Side({ pages, showPairs, label }: { pages: number[]; showPairs: boolean; label: string }) {
  return <div className="a4-page booklet-sheet" aria-label={label}>
    {pages.map((p, i) => <div key={p} className={`booklet-cell${i < 2 ? " is-flipped" : ""}`}><PageContent page={p} showPairs={showPairs} /></div>)}
  </div>;
}

export function SheetBooklet({ showPairs }: { showPairs: boolean }) {
  return <>{bookletSheets().map((s, i) => <div key={i} className="contents">
    <Side pages={s.front} showPairs={showPairs} label={`Ark ${i + 1} framsida`} />
    <Side pages={s.back} showPairs={showPairs} label={`Ark ${i + 1} baksida`} />
  </div>)}</>;
}

function Diagram({ step }: { step: number }) {
  const c = "var(--sheet-ink)";
  return <svg viewBox="0 0 120 90" className="fold-svg" aria-hidden="true">
    {step === 1 && <><rect x="35" y="5" width="50" height="80" fill="none" stroke={c} strokeWidth="1.2" /><line x1="35" y1="45" x2="85" y2="45" stroke={c} strokeDasharray="3 2" /><path d="M92 20 q12 25 0 45" fill="none" stroke={c} markerEnd="url(#a)" /></>}
    {step === 2 && <><rect x="20" y="25" width="80" height="40" fill="none" stroke={c} strokeWidth="1.2" /><line x1="60" y1="25" x2="60" y2="65" stroke={c} strokeDasharray="3 2" /><path d="M30 20 q30 -14 60 0" fill="none" stroke={c} markerEnd="url(#a)" /><text x="60" y="80" fontSize="7" textAnchor="middle" fill={c}>vikt kant uppåt</text></>}
    {step === 3 && <><rect x="40" y="20" width="40" height="55" fill="none" stroke={c} strokeWidth="1.2" /><text x="60" y="50" fontSize="9" textAnchor="middle" fill={c}>1</text><line x1="40" y1="20" x2="80" y2="20" stroke={c} strokeWidth="2.5" /><text x="60" y="14" fontSize="7" textAnchor="middle" fill={c}>skär här</text></>}
    {step === 4 && <><rect x="30" y="15" width="60" height="60" fill="none" stroke={c} strokeWidth="1.2" /><rect x="34" y="19" width="52" height="52" fill="none" stroke={c} strokeWidth="0.8" /><rect x="38" y="23" width="44" height="44" fill="none" stroke={c} strokeWidth="0.8" /><text x="60" y="87" fontSize="7" textAnchor="middle" fill={c}>ark 3 innerst, ark 1 ytterst</text></>}
    {step === 5 && <><rect x="40" y="15" width="40" height="60" fill="none" stroke={c} strokeWidth="1.2" /><line x1="40" y1="30" x2="46" y2="30" stroke={c} strokeWidth="2" /><line x1="40" y1="60" x2="46" y2="60" stroke={c} strokeWidth="2" /><text x="60" y="87" fontSize="7" textAnchor="middle" fill={c}>häfta i vänsterkanten</text></>}
    <defs><marker id="a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill={c} /></marker></defs>
  </svg>;
}

const STEPS = [
  { t: "Skriv ut dubbelsidigt", d: "Välj dubbelsidig utskrift med vändning längs långsidan och 100 % storlek (inte ”anpassa till sida”). Du får 3 ark. Övre halvan av varje sida ska stå upp och ner – det är rätt." },
  { t: "Vik på bredden", d: "Lägg arket med framsidan (sidan med ”1” nere till höger) mot dig. Vik den övre halvan bakåt längs den vågräta mittlinjen." },
  { t: "Vik på längden", d: "Vik den vänstra halvan bakåt längs den lodräta mittlinjen. Nu syns sidan 1 (ark 1) eller sidan 5 respektive 9 (ark 2 och 3) framme." },
  { t: "Skär upp överkanten", d: "Skär eller riv försiktigt upp den vikta kanten upptill så att sidorna går att bläddra. Låt vänsterkanten (ryggen) vara hel." },
  { t: "Lägg i varandra och häfta", d: "Lägg ark 3 inuti ark 2 och ark 2 inuti ark 1, med ryggarna mot varandra. Häfta två gånger i ryggen – nu är A6-häftet klart." },
];

export function SheetFoldGuide() {
  return <div className="a4-page fold-guide">
    <h2 className="fold-guide-title">Så viker du talkamratshäftet</h2>
    <p className="fold-guide-lead">Häftet blir A6 med 24 sidor: framsida, en sida för varje tal 2–20, anteckningssidor och baksida.</p>
    <ol className="fold-steps">{STEPS.map((s, i) => <li key={i}><Diagram step={i + 1} /><div><h3>{i + 1}. {s.t}</h3><p>{s.d}</p></div></li>)}</ol>
    <p className="fold-guide-tip">Tips: Skriv först ut ett ark som prov och kontrollera att siffran på baksidan står åt samma håll som på framsidan.</p>
  </div>;
}
