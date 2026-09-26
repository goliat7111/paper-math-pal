import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Printer, RefreshCw } from "lucide-react";
import { gen102, genSetup, type MulTask, type SetupTask } from "@/lib/worksheets";
import { Sheet102 } from "@/components/Sheet102";
import { SheetSetup, type SetupFit } from "@/components/SheetSetup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Räknebladet – arbetsblad i matematik för lärare" },
      { name: "description", content: "Generera och skriv ut anpassade multiplikationsdiagnoser och arbetsblad på A4, med facit." },
      { property: "og:title", content: "Räknebladet – arbetsblad i matematik" },
      { property: "og:description", content: "Slumpade diagnoser och uppställningar i multiplikation, utskriftsklara på A4 med facit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Tab = "102" | "setup";

function Index() {
  const [tab, setTab] = useState<Tab>("102");
  const [f1, setF1] = useState<[number, number]>([2, 9]);
  const [f2, setF2] = useState<[number, number]>([3, 9]);
  const [sd, setSd] = useState<[number, number]>([3, 3]);
  const [sb, setSb] = useState<[number, number]>([1, 1]);
  const [t102, setT102] = useState<MulTask[] | null>(null);
  const [tSetup, setTSetup] = useState<SetupTask[] | null>(null);
  const [withKey, setWithKey] = useState(true);
  const [fitInfo, setFitInfo] = useState<SetupFit | null>(null);
  const applyFit = (f: SetupFit) =>
    setFitInfo((p) =>
      p && p.count === f.count && p.cols === f.cols && p.rows === f.rows ? p : f,
    );

  // Den undre faktorn får aldrig ha fler siffror än det övre talet
  const applySd = (v: [number, number]) => {
    setSd(v);
    const topHi = Math.max(...v);
    setSb(([lo, hi]) => [Math.min(lo, topHi), Math.min(hi, topHi)]);
  };
  const applySb = (v: [number, number]) => {
    const topHi = Math.max(...sd);
    setSb([Math.min(v[0], topHi), Math.min(v[1], topHi)]);
  };

  // Stor pool: bladet visar själv så många uppgifter som ryms på A4-sidan
  const SETUP_POOL = 40;
  useEffect(() => setT102(gen102(f1, f2)), [f1, f2]);
  useEffect(() => setTSetup(genSetup(sd, sb, SETUP_POOL)), [sd, sb]);

  const regenerate = () =>
    tab === "102" ? setT102(gen102(f1, f2)) : setTSetup(genSetup(sd, sb, SETUP_POOL));

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-6 py-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">Räknebladet</h1>
            <p className="text-sm text-muted-foreground">Arbetsblad & diagnoser i matematik · A4</p>
          </div>
          <nav className="ml-auto flex rounded-lg bg-muted p-1">
            {([
              ["102", "102 tal (5 min)"],
              ["setup", "Mult. uppställning"],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  tab === k ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start">
        <aside className="no-print w-full shrink-0 space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6 lg:w-72">
          <h2 className="font-display text-lg font-semibold text-foreground">Inställningar</h2>
          {tab === "102" ? (
            <>
              <RangeInput label="Faktor 1 mellan" value={f1} onChange={setF1} />
              <RangeInput label="Faktor 2 mellan" value={f2} onChange={setF2} />
            </>
          ) : (
            <>
              <RangeInput label="Siffror i övre talet mellan" value={sd} onChange={applySd} min={1} max={3} />
              <RangeInput label="Siffror i undre talet mellan" value={sb} onChange={applySb} min={1} max={3} />
              <p className="-mt-3 text-xs text-muted-foreground">Undre talet får ha högst lika många siffror som övre talet.</p>
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                {fitInfo
                  ? `Förhandsgranskning: ${fitInfo.count} uppgifter ryms på A4-sidan (${fitInfo.rows} rader × ${fitInfo.cols} kolumner).`
                  : "Förhandsgranskning: beräknar…"}
              </p>
            </>
          )}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={withKey} onChange={(e) => setWithKey(e.target.checked)} className="h-4 w-4 accent-primary" />
            Skriv ut med facit (extra sida)
          </label>
          <div className="space-y-2 pt-2">
            <button onClick={regenerate} className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
              <RefreshCw className="h-4 w-4" /> Ny slumpad variant
            </button>
            <button onClick={() => window.print()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Printer className="h-4 w-4" /> Skriv ut
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Tips: välj A4, stående och marginaler "Inga" eller "Standard" i utskriftsdialogen.</p>
        </aside>

        <main className="print-area flex flex-1 flex-col items-center gap-8">
          {tab === "102" && t102 && (
            <>
              <Sheet102 tasks={t102} answers={false} />
              {withKey && <Sheet102 tasks={t102} answers />}
            </>
          )}
          {tab === "setup" && tSetup && (
            <>
              <SheetSetup tasks={tSetup} answers={false} topDigits={sd} bottomDigits={sb} onFit={applyFit} />
              {withKey && (
                <SheetSetup tasks={tSetup} answers topDigits={sd} bottomDigits={sb} onFit={applyFit} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function RangeInput({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  label: string;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  min?: number;
  max?: number;
}) {
  const set = (i: 0 | 1, s: string) => {
    const n = Math.max(min, Math.min(max, Number(s) || 0));
    const next: [number, number] = [...value] as [number, number];
    next[i] = n;
    onChange(next);
  };
  return (
    <div>
      <div className="mb-1.5 text-sm font-medium text-foreground">{label}</div>
      <div className="flex items-center gap-2">
        <input type="number" value={value[0]} onChange={(e) => set(0, e.target.value)} className="w-16 rounded-md border border-input bg-background px-2 py-1.5 text-center text-sm" />
        <span className="text-sm text-muted-foreground">och</span>
        <input type="number" value={value[1]} onChange={(e) => set(1, e.target.value)} className="w-16 rounded-md border border-input bg-background px-2 py-1.5 text-center text-sm" />
      </div>
    </div>
  );
}
