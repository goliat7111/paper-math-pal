import { FLEET, type Ship } from "@/lib/battleship";

const letters = "ABCDEFGHIJ".split("");

function Board({ ships, compact, enemy = false }: { ships?: Ship[]; compact: boolean; enemy?: boolean }) {

  return <div className="bship-board-wrap">
    <div className="bship-board-title">{enemy ? "Fiendens skepp" : "Mina skepp"}</div>
    <div className="bship-coord-grid">
      <div />{Array.from({length:10},(_,i)=><div className="bship-col" key={i}>{i+1}</div>)}
      {letters.flatMap((letter,r) => [
        <div className="bship-row" key={`r${r}`}>{letter}</div>,
        ...Array.from({length:10},(_,c) => {
          const ship = !enemy && ships?.find(s => s.cells.some(([sr, sc]) => sr === r && sc === c));
          const hasCell = (row: number, col: number) => ship && ship.cells.some(([sr, sc]) => sr === row && sc === col);
          const edges = ship ? [
            !hasCell(r - 1, c) && "inset 0 .6mm 0 #111",
            !hasCell(r + 1, c) && "inset 0 -.6mm 0 #111",
            !hasCell(r, c - 1) && "inset .6mm 0 0 #111",
            !hasCell(r, c + 1) && "inset -.6mm 0 0 #111",
          ].filter(Boolean).join(", ") : undefined;
          return <div key={`${r}-${c}`} className={`bship-cell ${ship ? "is-ship" : ""}`} style={ship ? { boxShadow: edges || "none" } : undefined} />;
        })
      ])}
    </div>
  </div>;
}

function Fleet({ compact }: { compact: boolean }) {
  return <div className={`bship-fleet ${compact ? "is-compact" : ""}`}>
    <strong>Min flotta:</strong>
    {FLEET.map(s => <span key={s.name} className="bship-fleet-item">
      {Array.from({length:s.count},(_,i)=><span key={i} className="bship-ship" aria-label={`${s.name}: ${s.size} rutor`}>{Array.from({length:s.size},(_,cell)=><span key={cell} className="bship-check" />)}</span>)}
      <span>{compact ? `${s.size} rutor` : `${s.name} – ${s.size} ${s.size === 1 ? "ruta" : "rutor"}`}</span>
    </span>)}
  </div>;
}

function PlayerCard({ ships, compact }: { ships?: Ship[]; compact: boolean }) {
  return <section className={`bship-card ${compact ? "is-compact" : ""}`}>
    <div className="bship-card-head"><strong>Sänka skepp</strong><span>Namn: <i /></span></div>
    <div className="bship-boards"><Board ships={ships} compact={compact}/><Board compact={compact} enemy/></div>
    <Fleet compact={compact}/>
  </section>;
}

export function SheetBattleship({ count, fleets, rules }: { count: 1|2|4; fleets: Ship[][] | null; rules: boolean }) {
  const compact = count === 4;
  return <div className={`a4-page bship-page bship-count-${count} ${count !== 2 ? "landscape" : ""}`}>
    <h1 className="bship-page-title">Sänka skepp</h1>
    <div className="bship-cards">
      {Array.from({length:count},(_,i)=><PlayerCard key={i} compact={compact} ships={fleets?.[i]} />)}
    </div>
    {rules && <div className="bship-rules"><strong>Enkla regler:</strong> Placera hela din flotta på ”Mina skepp”. Skeppen får ligga vågrätt eller lodrätt. Det måste finnas minst en tom ruta mellan skeppen, även diagonalt. De får inte överlappa eller röra vid varandra. Turas om att säga en koordinat, till exempel C7. Motståndaren svarar ”bom”, ”träff” eller ”sänkt”. Markera dina skott på ”Fiendens skepp”. Den som först sänker motståndarens alla skepp vinner.</div>}
  </div>;
}
