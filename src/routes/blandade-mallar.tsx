import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, FileDown, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfPagesPreview } from "@/components/PdfPagesPreview";
import {
  PrintContentChoice,
  keySuffix,
  showKey,
  showSheet,
  type PrintContent,
} from "@/components/PrintContentChoice";
import { SheetMixed } from "@/components/SheetMixed";
import { SheetPyramids } from "@/components/SheetPyramids";
import { SheetProbability, type ProbabilityProtocol } from "@/components/SheetProbability";
import { useSheetZoom, ZoomControls } from "@/components/ZoomControls";
import { genMixed, type MixedLevel, type MixedTasks } from "@/lib/mixed";
import {
  DEFAULT_TOP_TOTAL,
  genNumberPyramids,
  TOP_TOTAL_OPTIONS,
  type NumberPyramid,
  type PyramidMode,
} from "@/lib/number-pyramids";
import {
  genNumberSystemTasks,
  type ConversionMode,
  type NumberBase,
  type NumberSystemTask,
} from "@/lib/number-systems";
import { SheetNumberSystems } from "@/components/SheetNumberSystems";
import { SetupStyleToggle } from "@/components/SetupStyleToggle";

type WorksheetKind = "daily" | "pyramids" | "probability" | "number-systems";

function parseWorksheetKind(value: unknown): WorksheetKind | undefined {
  return value === "daily" ||
    value === "pyramids" ||
    value === "probability" ||
    value === "number-systems"
    ? value
    : undefined;
}

function parseProtocol(value: unknown): ProbabilityProtocol {
  return value === "coins" || value === "dice" ? value : "bottles";
}

export const Route = createFileRoute("/blandade-mallar")({
  validateSearch: (search: Record<string, unknown>) => ({
    worksheet: parseWorksheetKind(search["worksheet"]),
    protocol: parseProtocol(search["protocol"]),
  }),
  head: () => ({
    meta: [
      { title: "Blandade övningar – Räknebladet" },
      {
        name: "description",
        content: "Skapa blandade räkneövningar, talpyramider och talsystemblad med facit.",
      },
      { property: "og:title", content: "Blandade övningar – Räknebladet" },
      {
        property: "og:description",
        content: "Skapa blandade räkneövningar, talpyramider och talsystemblad med facit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlandadeMallarPage,
});

function BlandadeMallarPage() {
  const { worksheet, protocol } = Route.useSearch();
  const [level, setLevel] = useState<MixedLevel>(1);
  const [randomDec, setRandomDec] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [tasks, setTasks] = useState<MixedTasks | null>(null);
  const [pyramidRows, setPyramidRows] = useState<3 | 4 | 5>(3);
  const [pyramidMode, setPyramidMode] = useState<PyramidMode>("bottom");
  const [topTotal, setTopTotal] = useState(DEFAULT_TOP_TOTAL[3]);
  const [pyramids, setPyramids] = useState<NumberPyramid[]>(() =>
    genNumberPyramids(3, "bottom", 12),
  );
  const [cleanPyramids, setCleanPyramids] = useState(false);
  const [numberBase, setNumberBase] = useState<NumberBase>(2);
  const [numberMode, setNumberMode] = useState<ConversionMode>("both");
  const [numberMax, setNumberMax] = useState(255);
  const [numberTasks, setNumberTasks] = useState<NumberSystemTask[]>(() =>
    Array.from({ length: 20 }, (_, index) => ({
      value: index + 1,
      direction: index % 2 === 0 ? "to-base" : "to-decimal",
    })),
  );
  const [content, setContent] = useState<PrintContent>("sheet");
  const { mainProps, zoom, setZoom, zoomStep } = useSheetZoom();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    url: string;
    blob: Blob;
    pages: number;
    images: string[];
  } | null>(null);
  const [fileName, setFileName] = useState("");
  const previewUrl = useRef<string | null>(null);
  const hasTasks =
    worksheet === "daily"
      ? tasks !== null
      : worksheet === "pyramids"
        ? pyramids.length > 0
        : worksheet === "number-systems"
          ? numberTasks.length > 0
          : worksheet === "probability";
  const createPyramids = (rowCount: 3 | 4 | 5, mode: PyramidMode, total = topTotal) =>
    genNumberPyramids(rowCount, mode, rowCount === 3 ? 12 : 8, total);
  const createNumberTasks = (mode = numberMode, max = numberMax) =>
    genNumberSystemTasks(20, mode, max);
  useEffect(() => {
    setTasks(genMixed(1));
    setNumberTasks(genNumberSystemTasks());
  }, []);
  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    [],
  );
  const closePreview = () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    setPreview(null);
  };
  const downloadPdf = async () => {
    setExporting(true);
    setError("");
    try {
      const { buildSheetsPdf } = await import("@/lib/exportPdf");
      const result = await buildSheetsPdf(worksheet === "probability" ? "landscape" : "portrait");
      if (!result) throw new Error("Inget blad");
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      const url = URL.createObjectURL(result.blob);
      previewUrl.current = url;
      setPreview({ ...result, url });
      const baseName =
        worksheet === "pyramids"
          ? `talpyramider-${pyramidRows}-rader-${pyramidMode === "bottom" ? "botten" : `topp-${topTotal}`}`
          : worksheet === "probability"
            ? `sannolikhet-statistik-${protocol}`
            : `dagens-tal-niva-${level}${randomDec ? "-slumpade-decimaler" : ""}`;
      const selectedName =
        worksheet === "number-systems"
          ? `talsystem-bas-${numberBase}-${numberMode}-${numberMax}`
          : baseName;
      setFileName(
        `${selectedName}${worksheet === "probability" ? "" : keySuffix(content)}-${new Date().toISOString().slice(0, 10)}`,
      );
    } catch {
      setError("PDF-filen kunde inte skapas. Försök igen eller använd Skriv ut.");
    } finally {
      setExporting(false);
    }
  };
  const savePreview = async () => {
    if (!preview) return;
    const { saveBlob } = await import("@/lib/exportPdf");
    saveBlob(preview.blob, fileName);
    closePreview();
  };
  if (!worksheet) return <MixedWorksheetChooser />;

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link
            to="/blandade-mallar"
            search={{ worksheet: undefined, protocol: "bottles" }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Till Blandade övningar
          </Link>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {worksheet === "daily"
              ? "Dagens tal"
              : worksheet === "pyramids"
                ? "Talpyramider"
                : worksheet === "number-systems"
                  ? "Talsorter i olika talsystem"
                  : "Sannolikhet och statistik"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {worksheet === "daily"
              ? "Fyra räknesätt · A4"
              : worksheet === "pyramids"
                ? "Talpyramider · A4"
                : worksheet === "number-systems"
                  ? "Omvandla tal · A4"
                  : "Protokoll · A4 liggande"}
          </p>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start">
        <aside className="no-print w-full shrink-0 space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6 lg:w-72">
          <h2 className="font-display text-lg font-semibold">
            {worksheet === "daily"
              ? "Inställningar"
              : worksheet === "pyramids"
                ? "Talpyramider"
                : worksheet === "number-systems"
                  ? "Talsystem"
                  : protocol === "bottles"
                    ? "Flaskor"
                    : protocol === "coins"
                      ? "Mynt"
                      : "Tärningar"}
          </h2>
          {worksheet === "daily" ? (
            <>
              <label className="block text-sm font-medium">
                Svårighetsgrad
                <select
                  className="mt-1 block w-auto rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  value={level}
                  onChange={(e) => {
                    const next = Number(e.target.value) as MixedLevel;
                    setLevel(next);
                    setTasks(genMixed(next, randomDec));
                  }}
                >
                  <option value={1}>1 – Mycket enkel</option>
                  <option value={2}>2 – Enkel</option>
                  <option value={3}>3 – Medel</option>
                  <option value={4}>4 – Svår</option>
                  <option value={5}>5 – Mycket svår</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={randomDec}
                  onChange={(e) => {
                    setRandomDec(e.target.checked);
                    setTasks(genMixed(level, e.target.checked));
                  }}
                />
                Slumpade decimaler
              </label>
              {randomDec && (
                <p className="text-xs text-muted-foreground">
                  Uppgifterna får olika antal decimaler på samma blad.
                </p>
              )}
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Rutnät på elevbladet</legend>
                <Button
                  type="button"
                  size="sm"
                  className="bg-green-600 text-white hover:bg-green-700"
                  aria-label="Rutnät på elevbladet"
                  aria-pressed={showGrid}
                  onClick={() => setShowGrid(!showGrid)}
                >
                  {showGrid ? "Tom ruta" : "Rutnät"}
                </Button>
              </fieldset>
            </>
          ) : worksheet === "pyramids" ? (
            <>
              {pyramidRows === 3 && (
                <SetupStyleToggle
                  showSetupStyle={false}
                  showClean={pyramids.length === 12}
                  clean={cleanPyramids}
                  onCleanChange={setCleanPyramids}
                />
              )}
              <label className="block text-sm font-medium">
                Antal rader
                <select
                  className="mt-1 block w-auto rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  value={pyramidRows}
                  onChange={(e) => {
                    const next = Number(e.target.value) as 3 | 4 | 5;
                    setPyramidRows(next);
                    const nextTotal = TOP_TOTAL_OPTIONS[next].includes(topTotal)
                      ? topTotal
                      : DEFAULT_TOP_TOTAL[next];
                    setTopTotal(nextTotal);
                    setPyramids(createPyramids(next, pyramidMode, nextTotal));
                  }}
                >
                  <option value={3}>3 rader</option>
                  <option value={4}>4 rader</option>
                  <option value={5}>5 rader</option>
                </select>
              </label>
              {pyramidMode === "top" && (
                <label className="block text-sm font-medium">
                  Topptal
                  <select
                    className="mt-1 block w-auto rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                    value={topTotal}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setTopTotal(next);
                      setPyramids(createPyramids(pyramidRows, "top", next));
                    }}
                  >
                    {TOP_TOTAL_OPTIONS[pyramidRows].map((total) => (
                      <option key={total} value={total}>
                        {total}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Givna tal</legend>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={pyramidMode === "bottom" ? "default" : "outline"}
                    aria-pressed={pyramidMode === "bottom"}
                    onClick={() => {
                      setPyramidMode("bottom");
                      setPyramids(createPyramids(pyramidRows, "bottom"));
                    }}
                  >
                    Botten-tal
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={pyramidMode === "top" ? "default" : "outline"}
                    aria-pressed={pyramidMode === "top"}
                    onClick={() => {
                      setPyramidMode("top");
                      setPyramids(createPyramids(pyramidRows, "top"));
                    }}
                  >
                    Topp-tal
                  </Button>
                </div>
              </fieldset>
            </>
          ) : worksheet === "number-systems" ? (
            <>
              <label className="block text-sm font-medium">
                Talbas
                <select
                  className="mt-1 block w-auto rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  value={numberBase}
                  onChange={(e) => {
                    const next = Number(e.target.value) as NumberBase;
                    setNumberBase(next);
                  }}
                >
                  <option value={2}>Binärt (bas 2)</option>
                  <option value={4}>Bas 4</option>
                  <option value={16}>Hexadecimalt (bas 16)</option>
                </select>
              </label>
              <label className="block text-sm font-medium">
                Övning
                <select
                  className="mt-1 block w-auto rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  value={numberMode}
                  onChange={(e) => {
                    const next = e.target.value as ConversionMode;
                    setNumberMode(next);
                    setNumberTasks(createNumberTasks(next, numberMax));
                  }}
                >
                  <option value="both">Båda riktningarna</option>
                  <option value="to-base">Från bas 10</option>
                  <option value="to-decimal">Till bas 10</option>
                </select>
              </label>
              <label className="block text-sm font-medium">
                Största tal i bas 10
                <select
                  className="mt-1 block w-auto rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  value={numberMax}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setNumberMax(next);
                    setNumberTasks(createNumberTasks(numberMode, next));
                  }}
                >
                  <option value={31}>31</option>
                  <option value={255}>255</option>
                  <option value={4095}>4 095</option>
                  <option value={65535}>65 535</option>
                </select>
              </label>
              <p className="text-sm text-muted-foreground">
                Omvandla mellan bas 10 och vald bas. Visa gärna talets talsorter som potenser av
                basen. Hexadecimala tal använder A–F.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Fyll i resultat, andel, procent och sannolikhet efter försöket.
            </p>
          )}
          {worksheet !== "probability" && (
            <PrintContentChoice value={content} onChange={setContent} />
          )}
          <ZoomControls zoom={zoom} setZoom={setZoom} zoomStep={zoomStep} />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="space-y-2">
            {worksheet !== "probability" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  worksheet === "daily"
                    ? setTasks(genMixed(level, randomDec))
                    : worksheet === "pyramids"
                      ? setPyramids(createPyramids(pyramidRows, pyramidMode))
                      : setNumberTasks(createNumberTasks())
                }
              >
                <RefreshCw className="h-4 w-4" />
                Ny slumpad variant
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              disabled={exporting || !hasTasks}
              onClick={downloadPdf}
            >
              <FileDown className="h-4 w-4" />
              {exporting ? "Skapar förhandsgranskning…" : "Förhandsgranska & ladda ner PDF"}
            </Button>
            <Button className="w-full" disabled={!hasTasks} onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Skriv ut
            </Button>
          </div>
        </aside>
        <main {...mainProps} className="print-area flex min-w-0 flex-1 flex-col items-center gap-8">
          {worksheet === "daily" && tasks && showSheet(content) && (
            <SheetMixed tasks={tasks} level={level} showGrid={showGrid} answers={false} />
          )}
          {worksheet === "daily" && tasks && showKey(content) && (
            <SheetMixed tasks={tasks} level={level} showGrid={showGrid} answers />
          )}
          {worksheet === "pyramids" &&
            showSheet(content) &&
            (cleanPyramids && pyramidRows === 3 ? (
              Array.from({ length: Math.ceil(pyramids.length / 6) }, (_, page) => (
                <SheetPyramids
                  key={`clean-${page}`}
                  pyramids={pyramids.slice(page * 6, (page + 1) * 6)}
                  rowCount={pyramidRows}
                  mode={pyramidMode}
                  topTotal={topTotal}
                  answers={false}
                  clean
                  showHeader={page === 0}
                  startIndex={page * 6}
                  scoreTotal={pyramids.length}
                />
              ))
            ) : (
              <SheetPyramids
                pyramids={pyramids}
                rowCount={pyramidRows}
                mode={pyramidMode}
                topTotal={topTotal}
                answers={false}
              />
            ))}
          {worksheet === "pyramids" && showKey(content) && (
            <SheetPyramids
              pyramids={pyramids}
              rowCount={pyramidRows}
              mode={pyramidMode}
              topTotal={topTotal}
              answers
            />
          )}
          {worksheet === "number-systems" && showSheet(content) && (
            <SheetNumberSystems tasks={numberTasks} base={numberBase} answers={false} />
          )}
          {worksheet === "number-systems" && showKey(content) && (
            <SheetNumberSystems tasks={numberTasks} base={numberBase} answers />
          )}
          {worksheet === "probability" && <SheetProbability protocol={protocol} />}
        </main>
      </div>
      {preview && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
          role="dialog"
          aria-label="Förhandsgranskning av PDF"
          aria-modal="true"
        >
          <div className="flex h-full max-h-[95vh] w-full max-w-4xl flex-col gap-3 rounded-xl bg-background p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Förhandsgranskning av PDF · {preview.pages} {preview.pages === 1 ? "sida" : "sidor"}
              </h2>
              <Button variant="ghost" onClick={closePreview}>
                Stäng
              </Button>
            </div>
            <PdfPagesPreview images={preview.images} />
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex-1 text-sm font-medium">
                Filnamn
                <div className="mt-1 flex items-center gap-1">
                  <input
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                  <span>.pdf</span>
                </div>
              </label>
              <Button variant="outline" onClick={closePreview}>
                Avbryt
              </Button>
              <Button onClick={savePreview}>Ladda ner</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MixedWorksheetChooser() {
  const cardClass =
    "group flex min-h-32 items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md";
  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Alla räknesätt
          </Link>
          <h1 className="font-display text-2xl font-semibold text-foreground">Blandade övningar</h1>
          <p className="text-sm text-muted-foreground">
            Välj ett arbetsblad eller protokoll att skriva ut.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold">Räkneövningar</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/blandade-mallar"
              search={{ worksheet: "daily", protocol: "bottles" }}
              className={cardClass}
            >
              <span>
                <strong className="block font-display text-xl">Dagens tal</strong>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Fyra räknesätt på samma arbetsblad.
                </span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
            <Link
              to="/blandade-mallar"
              search={{ worksheet: "pyramids", protocol: "bottles" }}
              className={cardClass}
            >
              <span>
                <strong className="block font-display text-xl">Talpyramider</strong>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Välj antal rader och givna topp- eller bottental.
                </span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
            <Link
              to="/blandade-mallar"
              search={{ worksheet: "number-systems", protocol: "bottles" }}
              className={cardClass}
            >
              <span>
                <strong className="block font-display text-xl">Talsorter i olika talsystem</strong>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Omvandla mellan bas 10, binärt, bas 4 och bas 16.
                </span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          </div>
        </section>
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">Sannolikhet och statistik</h2>
            <p className="mt-1 text-muted-foreground">
              Välj ett utskrivbart protokoll för försöket.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/blandade-mallar"
              search={{ worksheet: "probability", protocol: "bottles" }}
              className={cardClass}
            >
              <span>
                <strong className="block font-display text-xl">Flaskor</strong>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Registrera färger och räkna andelar.
                </span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
            <Link
              to="/blandade-mallar"
              search={{ worksheet: "probability", protocol: "coins" }}
              className={cardClass}
            >
              <span>
                <strong className="block font-display text-xl">Mynt</strong>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Protokoll för kast med ett eller två mynt.
                </span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
            <Link
              to="/blandade-mallar"
              search={{ worksheet: "probability", protocol: "dice" }}
              className={cardClass}
            >
              <span>
                <strong className="block font-display text-xl">Tärningar</strong>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Protokoll för en tärning eller summan av två.
                </span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
