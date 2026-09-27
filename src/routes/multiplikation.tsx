import { PdfPagesPreview } from "@/components/PdfPagesPreview";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Printer, RefreshCw, FileDown, ArrowLeft } from "lucide-react";
import { PrintContentChoice, keySuffix, pagesLabel, showKey, showSheet, type PrintContent } from "@/components/PrintContentChoice";
import { gen102, genSetup, genSnabba, type MulTask, type SetupTask } from "@/lib/worksheets";
import { Sheet102 } from "@/components/Sheet102";
import { SheetSetup, type SetupFit } from "@/components/SheetSetup";
import { SheetOwnSetup } from "@/components/SheetOwnSetup";
import { SheetSnabba } from "@/components/SheetSnabba";

export const Route = createFileRoute("/multiplikation")({
  head: () => ({
    meta: [
      { title: "Multiplikation – Räknebladet" },
      { name: "description", content: "Generera och skriv ut multiplikationsdiagnoser (102 tal) och uppställningar på A4, med facit." },
      { property: "og:title", content: "Multiplikation – Räknebladet" },
      { property: "og:description", content: "Slumpade diagnoser och uppställningar i multiplikation, utskriftsklara på A4 med facit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MultiplikationPage,
});

type Tab = "102" | "setup" | "snabba";

function MultiplikationPage() {
  const [tab, setTab] = useState<Tab>("102");
  const [ownSetup, setOwnSetup] = useState(false);
  const [f1, setF1] = useState<[number, number]>([2, 9]);
  const [f2, setF2] = useState<[number, number]>([3, 9]);
  const [sd, setSd] = useState<[number, number]>([3, 3]);
  const [sb, setSb] = useState<[number, number]>([1, 1]);
  const [dt, setDt] = useState(0);
  const [db, setDb] = useState(0);
  const [t102, setT102] = useState<MulTask[] | null>(null);
  const [tSetup, setTSetup] = useState<SetupTask[] | null>(null);
  const [sr, setSr] = useState<[number, number]>([2, 9]);
  const [tSnabba, setTSnabba] = useState<MulTask[][] | null>(null);
  const [content, setContent] = useState<PrintContent>("both");
  const [exporting, setExporting] = useState(false);
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
  useEffect(() => setTSetup(genSetup(sd, sb, SETUP_POOL, dt, db)), [sd, sb, dt, db]);
  useEffect(() => setTSnabba(genSnabba(sr)), [sr]);

  const regenerate = () => {
    if (tab === "102") setT102(gen102(f1, f2));
    else if (tab === "setup") setTSetup(genSetup(sd, sb, SETUP_POOL, dt, db));
    else setTSnabba(genSnabba(sr));
  };

  const [preview, setPreview] = useState<{ url: string; blob: Blob; pages: number; images: string[] } | null>(null);
  const [fileName, setFileName] = useState("");

  const suggestName = () => {
    const d = new Date().toISOString().slice(0, 10);
    if (tab === "102") return `multiplikation-102-tal-${f1[0]}-${f1[1]}x${f2[0]}-${f2[1]}-${d}`;
    if (tab === "snabba") return `snabba-tal-multiplikation-${sr[0]}-${sr[1]}-${d}`;
    const top = sd[0] === sd[1] ? `${sd[0]}` : `${sd[0]}-${sd[1]}`;
    const bot = sb[0] === sb[1] ? `${sb[0]}` : `${sb[0]}-${sb[1]}`;
    return `multiplikation-${ownSetup ? "egen-uppstallning" : "uppstallning"}-${top}x${bot}-siffror${dt || db ? `-decimaler-${dt}x${db}` : ""}-${d}`;
  };

  const downloadPdf = async () => {
    setExporting(true);
    try {
      const { buildSheetsPdf } = await import("@/lib/exportPdf");
      const r = await buildSheetsPdf("portrait");
      if (r) {
        setFileName(suggestName() + keySuffix(content));
        setPreview({ url: URL.createObjectURL(r.blob), blob: r.blob, pages: r.pages, images: r.images });
      }
    } finally {
      setExporting(false);
    }
  };

  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const savePreview = async () => {
    if (!preview) return;
    const { saveBlob } = await import("@/lib/exportPdf");
    saveBlob(preview.blob, fileName);
    closePreview();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-6 py-4">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Alla räknesätt
            </Link>
            <h1 className="font-display text-2xl font-semibold text-foreground">Multiplikation</h1>
            <p className="text-sm text-muted-foreground">Arbetsblad & diagnoser · A4</p>
          </div>
          <nav className="ml-auto flex rounded-lg bg-muted p-1">
            {([
              ["102", "102 tal (6 min)"],
              ["setup", "Mult. uppställning"],
              ["snabba", "Snabba tal"],
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
          ) : tab === "snabba" ? (
            <>
              <RangeInput label="Faktorer mellan" value={sr} onChange={setSr} min={1} />
              <p className="-mt-3 text-xs text-muted-foreground">Båda faktorerna slumpas ur samma talområde. 4 olika övningar per A4-sida, 10 tal i varje.</p>
            </>
          ) : (
            <>
              <RangeInput label="Siffror i övre talet mellan" value={sd} onChange={applySd} min={1} max={3} />
              <RangeInput label="Siffror i undre talet mellan" value={sb} onChange={applySb} min={1} max={Math.max(...sd)} />
              <p className="-mt-3 text-xs text-muted-foreground">Undre talet får ha högst lika många siffror som övre talet, och gränserna korrigeras automatiskt.</p>
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Decimaler</legend>
                <div className="flex gap-3">
                  {([["Övre talet", dt, setDt], ["Undre talet", db, setDb]] as const).map(([label, v, set]) => (
                    <label key={label} className="text-sm">
                      {label}
                      <select value={v} onChange={(e) => set(Number(e.target.value))} className="mt-1 block w-28 rounded-md border border-input bg-background px-2 py-1.5">
                        <option value={0}>Heltal</option>
                        <option value={1}>1 decimal</option>
                        <option value={2}>2 decimaler</option>
                      </select>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Decimaltalen slutar aldrig på 0. På elevbladet sätter eleven själv ut kommat i svaret.</p>
              </fieldset>
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium">Utformning av elevblad</legend>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="setup-style" checked={!ownSetup} onChange={() => { setOwnSetup(false); setFitInfo(null); }} />
                  Med uppställning
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="setup-style" checked={ownSetup} onChange={() => { setOwnSetup(true); setFitInfo(null); }} />
                  Egen uppställning i tom ruta
                </label>
                {ownSetup && <p className="text-sm text-muted-foreground">Åtta uppgifter per blad med gott om skrivutrymme. Facit visar uppställningarna.</p>}
              </fieldset>
            </>
          )}
          <PrintContentChoice value={content} onChange={setContent} />
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            {tab === "setup" &&
              (fitInfo
                ? `Förhandsgranskning: ${fitInfo.count} uppgifter ryms på A4-sidan (${fitInfo.rows} rader × ${fitInfo.cols} kolumner). `
                : "Förhandsgranskning: beräknar… ")}
            PDF: {pagesLabel(content)} ·{" "}
            {tab === "102" ? 102 : tab === "snabba" ? "40 (4 övningar à 10 tal)" : fitInfo ? `${fitInfo.count}` : "…"} uppgifter · A4 stående.
          </p>
          <div className="space-y-2 pt-2">
            <button onClick={regenerate} className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
              <RefreshCw className="h-4 w-4" /> Ny slumpad variant
            </button>
            <button onClick={downloadPdf} disabled={exporting} className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60">
              <FileDown className="h-4 w-4" /> {exporting ? "Skapar förhandsgranskning…" : "Förhandsgranska & ladda ner PDF"}
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
              {showSheet(content) && <Sheet102 tasks={t102} answers={false} />}
              {showKey(content) && <Sheet102 tasks={t102} answers />}
            </>
          )}
          {tab === "snabba" && tSnabba && (
            <>
              {showSheet(content) && <SheetSnabba exercises={tSnabba} answers={false} />}
              {showKey(content) && <SheetSnabba exercises={tSnabba} answers />}
            </>
          )}
          {tab === "setup" && tSetup && !ownSetup && (
            <>
              {showSheet(content) && <SheetSetup tasks={tSetup} answers={false} topDigits={sd} bottomDigits={sb} onFit={applyFit} />}
              {showKey(content) && (
                <SheetSetup tasks={tSetup} answers topDigits={sd} bottomDigits={sb} onFit={applyFit} />
              )}
            </>
          )}
          {tab === "setup" && tSetup && ownSetup && (
            <>
              {showSheet(content) && <SheetOwnSetup tasks={tSetup} answers={false} onFit={applyFit} />}
              {showKey(content) && <SheetOwnSetup tasks={tSetup} answers {...(content === "key" ? { onFit: applyFit } : {})} />}
            </>
          )}
        </main>
      </div>
      {preview && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" role="dialog" aria-label="Förhandsgranskning av PDF">
          <div className="flex h-full max-h-[95vh] w-full max-w-4xl flex-col gap-3 rounded-xl bg-background p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Förhandsgranskning av PDF · {preview.pages} {preview.pages === 1 ? "sida" : "sidor"}</h2>
              <button onClick={closePreview} className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent">Stäng</button>
            </div>
            <PdfPagesPreview images={preview.images} />
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex-1 text-sm font-medium text-foreground">
                Filnamn
                <div className="mt-1 flex items-center gap-1">
                  <input value={fileName} onChange={(e) => setFileName(e.target.value)} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
                  <span className="text-sm text-muted-foreground">.pdf</span>
                </div>
              </label>
              <button onClick={closePreview} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-accent">Avbryt</button>
              <button onClick={savePreview} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <FileDown className="h-4 w-4" /> Ladda ner
              </button>
            </div>
          </div>
        </div>
      )}
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
    // Den undre gränsen får aldrig överstiga den övre – den korrigeras automatiskt
    if (next[0] > next[1]) next[0] = next[1];
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
