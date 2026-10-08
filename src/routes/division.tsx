import { PdfPagesPreview } from "@/components/PdfPagesPreview";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileDown, Printer, RefreshCw } from "lucide-react";
import { PrintContentChoice } from "@/components/PrintContentChoice";
import { keySuffix, showKey, showSheet, type PrintContent } from "@/lib/print-content";
import { genDivision, genExtendDivision, type DivisionTask } from "@/lib/division";
import { formatDecimal } from "@/lib/worksheets";
import { divisionProgression, genDivisionProgression } from "@/lib/division-complexity";
import { genChallengeDivision, randomizeSheetDecimals } from "@/lib/mixed-division";
import type { MixedLevel } from "@/lib/mixed";
import { SheetDivision } from "@/components/SheetDivision";
import { SheetHundred } from "@/components/SheetHundred";
import { ZoomControls } from "@/components/ZoomControls";
import { useSheetZoom } from "@/hooks/use-sheet-zoom";
import { SetupStyleToggle } from "@/components/SetupStyleToggle";

export const Route = createFileRoute("/division")({
  head: () => ({
    meta: [
      { title: "Division – Räknebladet" },
      {
        name: "description",
        content:
          "Skapa divisionsblad med kort division eller 100 huvudräkningsuppgifter på sex minuter.",
      },
      { property: "og:title", content: "Division – Räknebladet" },
      {
        property: "og:description",
        content:
          "Skapa och skriv ut divisionsblad med uppställning eller sexminutersprov med facit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DivisionPage,
});

function DivisionPage() {
  const [divMin, setDivMin] = useState("10");
  const [divMax, setDivMax] = useState("99");
  const [min, setMin] = useState("2");
  const [max, setMax] = useState("9");
  const [mode, setMode] = useState<
    "even" | "rest" | "extra" | "extend" | "challenges" | "progression" | "quick100"
  >("even");
  const [generatedMode, setGeneratedMode] = useState(mode);
  const tasksPerPage = generatedMode === "quick100" ? 100 : 12;
  const [level, setLevel] = useState<MixedLevel>(3);
  const withRemainder = mode === "rest";
  const [dec, setDec] = useState(0);
  const [extra, setExtra] = useState(1);
  const [ownSetup, setOwnSetup] = useState(true);
  const [showComplexityMatrix, setShowComplexityMatrix] = useState(false);
  const [clean, setClean] = useState(false);
  const cleanLayout = generatedMode !== "quick100" && clean;
  const cleanTasksPerPage = cleanLayout ? 6 : tasksPerPage;
  const [content, setContent] = useState<PrintContent>("sheet");
  const { mainProps, zoom, setZoom, zoomStep } = useSheetZoom();
  const [tasks, setTasks] = useState<DivisionTask[]>([]);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<{
    url: string;
    blob: Blob;
    pages: number;
    images: string[];
  } | null>(null);
  const [fileName, setFileName] = useState("");
  const [challengeDec, setChallengeDec] = useState(false);
  const [includeRest, setIncludeRest] = useState(true);
  const previewUrl = useRef<string | null>(null);

  useEffect(() => {
    try {
      const result =
        mode === "quick100"
          ? genDivision(Number(divMin), Number(divMax), Number(min), Number(max), 100)
          : mode === "progression"
            ? genDivisionProgression(Math.random, includeRest)
            : mode === "extend"
              ? genExtendDivision(12)
              : mode === "challenges"
                ? (challengeDec
                    ? randomizeSheetDecimals(genChallengeDivision(level, 12, includeRest))
                    : genChallengeDivision(level, 12, includeRest)
                  ).map((t) => {
                    const { shown, ...rest } = t;
                    if (!shown) return rest;
                    const scale = Math.round(Math.log10(rest.dividend / shown.dividend));
                    return {
                      ...rest,
                      shownDecimals: {
                        dividend: shown.dividendDecimals + scale,
                        divisor: shown.divisorDecimals,
                      },
                    };
                  })
                : genDivision(
                    Number(divMin),
                    Number(divMax),
                    Number(min),
                    Number(max),
                    12,
                    withRemainder,
                    dec,
                    mode === "extra" ? extra : 0,
                  );
      setTasks(result);
      setGeneratedMode(mode);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kontrollera inställningarna.");
    }
  }, [challengeDec, dec, divMax, divMin, extra, includeRest, level, max, min, mode, withRemainder]);
  const generate = () => {
    try {
      const result =
        mode === "quick100"
          ? genDivision(Number(divMin), Number(divMax), Number(min), Number(max), 100)
          : mode === "progression"
            ? genDivisionProgression(Math.random, includeRest)
            : mode === "extend"
              ? genExtendDivision(12)
              : mode === "challenges"
                ? (challengeDec
                    ? randomizeSheetDecimals(genChallengeDivision(level, 12, includeRest))
                    : genChallengeDivision(level, 12, includeRest)
                  ).map((t) => {
                    const { shown, ...rest } = t;
                    if (!shown) return rest;
                    const scale = Math.round(Math.log10(rest.dividend / shown.dividend));
                    return {
                      ...rest,
                      shownDecimals: {
                        dividend: shown.dividendDecimals + scale,
                        divisor: shown.divisorDecimals,
                      },
                    };
                  })
                : genDivision(
                    Number(divMin),
                    Number(divMax),
                    Number(min),
                    Number(max),
                    12,
                    withRemainder,
                    dec,
                    mode === "extra" ? extra : 0,
                  );
      setTasks(result);
      setGeneratedMode(mode);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kontrollera inställningarna.");
    }
  };
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
      const result = await buildSheetsPdf("portrait");
      if (!result) throw new Error("Inga blad att spara. Skapa uppgifter först.");
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      const url = URL.createObjectURL(result.blob);
      previewUrl.current = url;
      setPreview({ ...result, url });
      setFileName(
        `division-${generatedMode === "quick100" ? "100-tal-6-min" : `${ownSetup ? "egen-uppstallning" : "kort-division"}-${generatedMode === "progression" ? "progressionsserie" : mode === "extend" ? "forlanga-forkorta" : mode === "challenges" ? `utmaningar-niva-${level}${challengeDec ? "-slumpade-decimaler" : ""}` : tasks.some((t) => t.remainder > 0) ? "med-rest" : mode === "extra" ? (extra === -1 ? "slumpade-extra-decimaler" : `${extra}-extra-decimaler`) : "utan-rest"}${generatedMode === "progression" ? "" : dec === -1 ? "-slumpade-decimaler" : dec ? `-${dec}-decimaler` : ""}`}${keySuffix(content)}-${new Date().toISOString().slice(0, 10)}`,
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
          <h1 className="font-display text-2xl font-semibold">Division</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "quick100" ? "100 tal · 6 minuter" : "Kort division · A4"}
          </p>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start">
        <aside className="no-print w-full shrink-0 space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6 lg:w-72">
          <h2 className="font-display text-lg font-semibold">Inställningar</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              generate();
            }}
            className="space-y-5"
          >
            {mode !== "progression" && (
              <>
                <fieldset>
                  <legend className="mb-2 text-sm font-medium">Täljare mellan</legend>
                  <div className="flex items-end gap-2">
                    <label className="text-sm">
                      Från
                      <input
                        aria-label="Täljare från"
                        className="mt-1 block w-20 rounded-md border border-input bg-background px-2 py-1.5 text-center"
                        type="number"
                        min={2}
                        max={9999}
                        step={1}
                        required
                        value={divMin}
                        onChange={(e) => setDivMin(e.target.value)}
                      />
                    </label>
                    <span className="pb-2">och</span>
                    <label className="text-sm">
                      Till
                      <input
                        aria-label="Täljare till"
                        className="mt-1 block w-20 rounded-md border border-input bg-background px-2 py-1.5 text-center"
                        type="number"
                        min={2}
                        max={9999}
                        step={1}
                        required
                        value={divMax}
                        onChange={(e) => setDivMax(e.target.value)}
                      />
                    </label>
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-2 text-sm font-medium">Nämnare mellan</legend>
                  <div className="flex items-end gap-2">
                    <label className="text-sm">
                      Från
                      <input
                        aria-label="Nämnare från"
                        className="mt-1 block w-20 rounded-md border border-input bg-background px-2 py-1.5 text-center"
                        type="number"
                        min={2}
                        max={9}
                        step={1}
                        required
                        value={min}
                        onChange={(e) => setMin(e.target.value)}
                      />
                    </label>
                    <span className="pb-2">och</span>
                    <label className="text-sm">
                      Till
                      <input
                        aria-label="Nämnare till"
                        className="mt-1 block w-20 rounded-md border border-input bg-background px-2 py-1.5 text-center"
                        type="number"
                        min={2}
                        max={9}
                        step={1}
                        required
                        value={max}
                        onChange={(e) => setMax(e.target.value)}
                      />
                    </label>
                  </div>
                </fieldset>
                {mode !== "quick100" && (
                  <label className="block text-sm font-medium">
                    Decimaler i täljaren
                    <select
                      className="mt-2 block w-auto rounded-md border border-input bg-background px-2 py-2"
                      value={dec}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setDec(v);
                        if (v !== 0 && mode === "rest") setMode("even");
                      }}
                    >
                      <option value={0}>Heltal</option>
                      <option value={1}>1 decimal</option>
                      <option value={2}>2 decimaler</option>
                      <option value={3}>3 decimaler</option>
                      <option value={-1}>Slumpa (0–3)</option>
                    </select>
                  </label>
                )}
              </>
            )}
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">Typ av division</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="remainder"
                  checked={mode === "even"}
                  onChange={() => setMode("even")}
                />
                Går jämnt ut
              </label>
              <label className={`flex items-center gap-2 text-sm${dec !== 0 ? " opacity-50" : ""}`}>
                <input
                  type="radio"
                  name="remainder"
                  disabled={dec !== 0}
                  checked={mode === "rest"}
                  onChange={() => setMode("rest")}
                />
                Med rest (bara heltal)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="remainder"
                  checked={mode === "extra"}
                  onChange={() => setMode("extra")}
                />
                Extra decimaler i svaret
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="remainder"
                  checked={mode === "extend"}
                  onChange={() => setMode("extend")}
                />
                Förlänga/förkorta (huvudräkning)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="remainder"
                  checked={mode === "challenges"}
                  onChange={() => setMode("challenges")}
                />
                Utmaningar (progression)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="remainder"
                  checked={mode === "progression"}
                  onChange={() => setMode("progression")}
                />
                Progressionsserie
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="remainder"
                  checked={mode === "quick100"}
                  onChange={() => setMode("quick100")}
                />
                100 tal (6 min)
              </label>
              {mode === "challenges" && (
                <select
                  aria-label="Svårighetsgrad"
                  className="ml-6 block rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value) as MixedLevel)}
                >
                  <option value={1}>Nivå 1 – mycket enkel</option>
                  <option value={2}>Nivå 2 – enkel</option>
                  <option value={3}>Nivå 3 – medel</option>
                  <option value={4}>Nivå 4 – svår</option>
                  <option value={5}>Nivå 5 – mycket svår</option>
                </select>
              )}
              {mode === "extra" && (
                <select
                  aria-label="Antal extra decimaler"
                  className="ml-6 block rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  value={extra}
                  onChange={(e) => setExtra(Number(e.target.value))}
                >
                  <option value={1}>1 extra decimal</option>
                  <option value={2}>2 extra decimaler</option>
                  <option value={3}>3 extra decimaler</option>
                  <option value={-1}>Slumpa (1–3)</option>
                </select>
              )}
            </fieldset>
            {mode === "challenges" && (
              <label className="ml-6 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={challengeDec}
                  onChange={(e) => setChallengeDec(e.target.checked)}
                />
                Slumpade decimaler
              </label>
            )}
            {(mode === "challenges" || mode === "progression") && (
              <label className="ml-6 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeRest}
                  onChange={(e) => setIncludeRest(e.target.checked)}
                />
                Inkludera uppgifter med rest
              </label>
            )}
            <p className="text-sm text-muted-foreground">
              {mode === "quick100"
                ? "100 huvudräkningsuppgifter. Alla divisioner går jämnt ut; täljare och nämnare väljs från talområdena ovan."
                : mode === "progression"
                  ? "Tolv heltalsuppgifter: de tio momenten i fast progression följs av två slumpade tresiffriga uppgifter som går jämnt ut. Uppgift 10–12 kombinerar så många utmaningar som möjligt utan rest. Facit visar vilka utmaningar varje uppgift tränar."
                  : mode === "challenges"
                    ? `Uppgifter med olika utmaningar på nivå ${level}, t.ex. växling, nollor, rest och decimaler. Facit visar vilken utmaning varje uppgift tränar. Talområdena ovan används inte i det här läget.`
                    : mode === "extend"
                      ? "Nämnaren är ett decimaltal (t.ex. 0,6 eller 0,06). Eleven förlänger eller förkortar så att nämnaren blir ett heltal och räknar sedan i huvudet. Talområdena ovan används inte i det här läget."
                      : dec === -1
                        ? "Varje uppgift får ett slumpat antal decimaler (0–3) i täljaren. Alla uppgifter går jämnt ut."
                        : mode === "rest"
                          ? "Alla uppgifter får en rest."
                          : mode === "extra"
                            ? extra === -1
                              ? "Varje uppgift får ett slumpat antal extra decimaler (1–3) i svaret, t.ex. 4 / 8 = 0,5 eller 1 / 8 = 0,125. Nämnare som inte räcker till för en uppgift hoppas över."
                              : `Svaret får ${extra} decimal${extra > 1 ? "er" : ""} mer än täljaren, t.ex. ${extra === 1 ? "4 / 8 = 0,5" : extra === 2 ? "0,8 / 5 = 0,16" : "1 / 8 = 0,125"}. ${extra === 3 ? "Kräver nämnaren 8." : extra === 2 ? "Kräver nämnaren 4 eller 8." : "Nämnare 3, 7 och 9 hoppas över."}`
                            : dec > 0
                              ? "Alla uppgifter går jämnt ut, t.ex. 4,8 / 4 = 1,2."
                              : "Alla uppgifter går jämnt ut."}
            </p>
            {mode === "progression" && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <button
                  type="button"
                  aria-pressed={showComplexityMatrix}
                  onClick={() => setShowComplexityMatrix((value) => !value)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                    showComplexityMatrix
                      ? "border-green-600 bg-green-600 text-white hover:bg-green-700"
                      : "border-input bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  Komplexitetsmatris
                </button>
                {showComplexityMatrix && (
                  <div className="rounded-md border border-border bg-muted/30 p-3">
                    <p className="font-medium text-foreground">Division - komplexitetsmatris</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5">
                      {divisionProgression
                        .filter((step) => includeRest || !step.rules.withRemainder)
                        .slice(0, 10)
                        .map((step) => (
                        <li key={step.label}>{step.label}</li>
                      ))}
                      <li>Slumpade kombinationer av gruppering, växlingar, nollor och rest</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
            <SetupStyleToggle
              ownSetup={ownSetup}
              onChange={setOwnSetup}
              showClean={generatedMode !== "quick100"}
              clean={clean}
              onCleanChange={setClean}
            />
          </form>
          <PrintContentChoice value={content} onChange={setContent} />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <ZoomControls zoom={zoom} setZoom={setZoom} zoomStep={zoomStep} />
          <div className="space-y-2">
            <button
              type="button"
              onClick={generate}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              <RefreshCw className="h-4 w-4" />
              Ny slumpad variant
            </button>
            <button
              disabled={exporting || !tasks.length}
              onClick={downloadPdf}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              <FileDown className="h-4 w-4" />
              {exporting ? "Skapar förhandsgranskning…" : "Förhandsgranska & ladda ner PDF"}
            </button>
            <button
              disabled={!tasks.length}
              onClick={() => window.print()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Printer className="h-4 w-4" />
              Skriv ut
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Välj A4 stående, 100 % skala, inga marginaler och inga sidhuvuden eller sidfötter.
          </p>
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            {tasks.length} uppgifter ·{" "}
            {generatedMode === "quick100"
              ? "4 kolumner × 25 tal"
              : cleanLayout
                ? "Clean: 2 kolumner, 3 par per sida"
                : "4 rader × 3 kolumner per sida"}
            .<br />
            PDF:{" "}
            {(showSheet(content) ? Math.ceil(tasks.length / cleanTasksPerPage) : 0) +
              (showKey(content) ? Math.ceil(tasks.length / tasksPerPage) : 0)}{" "}
            {tasks.length > cleanTasksPerPage || content === "both" ? "sidor" : "sida"} · A4
            stående.
          </p>
        </aside>
        <main {...mainProps} className="print-area flex min-w-0 flex-1 flex-col items-center gap-8">
          {tasks.length > 0 && (
            <>
              {generatedMode === "quick100" ? (
                <>
                  {showSheet(content) && (
                    <SheetHundred
                      tasks={tasks.map((task) => ({
                        left: formatDecimal(task.dividend, task.dividendDecimals ?? 0),
                        operator: "÷",
                        right: String(task.divisor),
                        answer: formatDecimal(task.quotient, task.quotientDecimals ?? 0),
                      }))}
                      operation="Division"
                      answers={false}
                    />
                  )}
                  {showKey(content) && (
                    <SheetHundred
                      tasks={tasks.map((task) => ({
                        left: formatDecimal(task.dividend, task.dividendDecimals ?? 0),
                        operator: "÷",
                        right: String(task.divisor),
                        answer: formatDecimal(task.quotient, task.quotientDecimals ?? 0),
                      }))}
                      operation="Division"
                      answers
                    />
                  )}
                </>
              ) : (
                <>
                  {showSheet(content) &&
                    Array.from(
                      { length: Math.ceil(tasks.length / cleanTasksPerPage) },
                      (_, page) => (
                        <SheetDivision
                          key={`sheet-${page}`}
                          tasks={tasks.slice(
                            page * cleanTasksPerPage,
                            (page + 1) * cleanTasksPerPage,
                          )}
                          answers={false}
                          ownSetup={ownSetup}
                          progression={generatedMode === "progression"}
                          startIndex={page * cleanTasksPerPage}
                          clean={cleanLayout}
                          showHeader={!cleanLayout || page === 0}
                          scoreTotal={tasks.length}
                        />
                      ),
                    )}
                  {showKey(content) &&
                    Array.from({ length: Math.ceil(tasks.length / tasksPerPage) }, (_, page) => (
                      <SheetDivision
                        key={`key-${page}`}
                        tasks={tasks.slice(page * tasksPerPage, (page + 1) * tasksPerPage)}
                        answers
                        ownSetup={ownSetup}
                        progression={generatedMode === "progression"}
                        startIndex={page * tasksPerPage}
                      />
                    ))}
                </>
              )}
            </>
          )}
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
              <button
                onClick={closePreview}
                className="rounded-md px-2 py-1 text-sm hover:bg-accent"
              >
                Stäng
              </button>
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
              <button
                onClick={closePreview}
                className="rounded-lg border border-input px-4 py-2 text-sm"
              >
                Avbryt
              </button>
              <button
                onClick={savePreview}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Ladda ner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
