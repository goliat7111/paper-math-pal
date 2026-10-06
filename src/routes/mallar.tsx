import { PdfPagesPreview } from "@/components/PdfPagesPreview";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileDown, Printer } from "lucide-react";
import { ZoomControls } from "@/components/ZoomControls";
import { useSheetZoom } from "@/hooks/use-sheet-zoom";
import { Button } from "@/components/ui/button";
import { SheetHundredGrid, type GridCount } from "@/components/SheetHundredGrid";
import { SheetSumGrid, type SumRange } from "@/components/SheetSumGrid";
import { SheetBooklet, SheetFoldGuide } from "@/components/SheetBooklet";
import { SheetTalkamrater, type TalkamratRange } from "@/components/SheetTalkamrater";

type Template = "hundred" | "sum10" | "sum20" | "talkamrater" | "hafte";
const TEMPLATES: { id: Template; label: string }[] = [
  { id: "hundred", label: "100-rutan (mult.)" },
  { id: "sum10", label: "Lilla plus" },
  { id: "sum20", label: "Stora plus" },
  { id: "talkamrater", label: "Talkamrater" },
  { id: "hafte", label: "Talkamratshäfte A6" },
];

export const Route = createFileRoute("/mallar")({
  head: () => ({
    meta: [
      { title: "Utskrivbara mallar – Räknebladet" },
      {
        name: "description",
        content:
          "Skriv ut ifyllda eller tomma multiplikationsrutor och additionsrutor med summor 2–10 eller 2–20 på A4.",
      },
      { property: "og:title", content: "Utskrivbara mallar – Räknebladet" },
      {
        property: "og:description",
        content:
          "Skriv ut ifyllda eller tomma 100-rutor i multiplikation och additionsrutor på A4.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MallarPage,
});

function MallarPage() {
  const [template, setTemplate] = useState<Template>("hundred");
  const [bkPart, setBkPart] = useState<"hafte" | "instruktion">("hafte");
  const [count, setCount] = useState<GridCount>(4);
  const [showProducts, setShowProducts] = useState(true);
  const [tkRange, setTkRange] = useState<TalkamratRange>("10");
  const [tkColors, setTkColors] = useState(true);
  const [tkSums, setTkSums] = useState<number[]>([8]);
  const selectSum = (n: number) => setTkSums([n]);
  const [tkLayout, setTkLayout] = useState<"staplade" | "liggande">("staplade");
  const [tkCount, setTkCount] = useState<1 | 2 | 4>(1);
  const tkColorsEff = tkRange === "custom" ? false : tkColors;
  const tkCountEff: 1 | 2 | 4 = tkRange === "10" || tkRange === "20" ? tkCount : 1;
  const tkPages = 1;
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ url: string; blob: Blob; images: string[] } | null>(
    null,
  );
  const [fileName, setFileName] = useState("100-rutan-4-per-a4");
  const previewUrl = useRef<string | null>(null);
  const { mainProps, zoom, setZoom, zoomStep } = useSheetZoom();

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
  const createPdf = async () => {
    const landscape = template === "talkamrater" && tkRange === "both" && tkLayout === "liggande";
    setError("");
    setExporting(true);
    try {
      const { buildSheetsPdf } = await import("@/lib/exportPdf");
      const result = await buildSheetsPdf(landscape ? "landscape" : "portrait");
      if (!result) throw new Error("Inget blad hittades.");
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      const url = URL.createObjectURL(result.blob);
      previewUrl.current = url;
      setPreview({ url, blob: result.blob, images: result.images });
      setFileName(
        template === "hafte"
          ? bkPart === "hafte"
            ? `talkamratshafte-a6-2-20${showProducts ? "" : "-tom"}`
            : "talkamratshafte-vikinstruktion"
          : template === "talkamrater"
            ? `talkamrater-${tkRange === "both" ? "10-och-20" : tkRange === "custom" ? [...tkSums].sort((a, b) => a - b).join("-") : `upp-till-${tkRange}`}${tkColorsEff ? "-farg" : ""}${showProducts ? "" : "-tom"}${tkCountEff > 1 ? `-${tkCountEff}-per-a4` : ""}${landscape ? "-liggande" : ""}`
            : template === "hundred"
              ? `100-rutan-${count}-per-a4`
              : `additionsrutan-2-${template === "sum10" ? "10" : "20"}-${count}-per-a4`,
      );
    } catch {
      setError("PDF-filen kunde inte skapas. Försök igen eller välj Skriv ut.");
    } finally {
      setExporting(false);
    }
  };
  const savePdf = async () => {
    if (!preview) return;
    const { saveBlob } = await import("@/lib/exportPdf");
    saveBlob(preview.blob, fileName);
    closePreview();
  };

  return (
    <div className="min-h-screen bg-background">
      {template === "talkamrater" && tkRange === "both" && tkLayout === "liggande" && (
        <style media="print">{"@page { size: A4 landscape; margin: 0; }"}</style>
      )}
      <header className="no-print border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Till startsidan
          </Link>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Utskrivbara mallar
          </h1>
          <p className="text-sm text-muted-foreground">
            100-rutan (mult.) · Additionsrutor · Talkamrater
          </p>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start">
        <aside className="no-print w-full shrink-0 space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6 lg:w-72">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {TEMPLATES.find((t) => t.id === template)?.label}
          </h2>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">Mall</legend>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.filter((t) => t.id !== "hafte").map((t) => (
                <Button
                  key={t.id}
                  type="button"
                  size="sm"
                  className="h-7 px-3 text-xs font-semibold"
                  variant={template === t.id ? "default" : "outline"}
                  aria-pressed={template === t.id}
                  onClick={() => setTemplate(t.id)}
                >
                  {t.label}
                </Button>
              ))}
              {template === "talkamrater" || template === "hafte" ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-3 text-xs font-semibold"
                  variant={template === "hafte" ? "default" : "outline"}
                  aria-pressed={template === "hafte"}
                  onClick={() => setTemplate("hafte")}
                >
                  Talkamratshäfte A6
                </Button>
              ) : null}
            </div>
          </fieldset>
          {template === "hafte" ? (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">Skriv ut</legend>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-3 text-xs font-semibold"
                  variant={bkPart === "hafte" ? "default" : "outline"}
                  aria-pressed={bkPart === "hafte"}
                  onClick={() => setBkPart("hafte")}
                >
                  Häftet
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-3 text-xs font-semibold"
                  variant={bkPart === "instruktion" ? "default" : "outline"}
                  aria-pressed={bkPart === "instruktion"}
                  onClick={() => setBkPart("instruktion")}
                >
                  Vikinstruktion
                </Button>
              </div>
            </fieldset>
          ) : template === "talkamrater" ? (
            <>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">Talområde</legend>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["10", "Upp till 10"],
                      ["20", "Upp till 20"],
                      ["both", "Båda"],
                      ["custom", "Välj tal"],
                    ] as const
                  ).map(([v, l]) => (
                    <Button
                      key={v}
                      type="button"
                      size="sm"
                      className="h-7 px-3 text-xs font-semibold"
                      variant={tkRange === v ? "default" : "outline"}
                      aria-pressed={tkRange === v}
                      onClick={() => setTkRange(v)}
                    >
                      {l}
                    </Button>
                  ))}
                </div>
              </fieldset>
              {(tkRange === "10" || tkRange === "20") && (
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-foreground">
                    Tabeller per A4
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {([1, 2, 4] as const).map((n) => (
                      <Button
                        key={n}
                        type="button"
                        size="sm"
                        className="h-7 px-3 text-xs font-semibold"
                        variant={tkCount === n ? "default" : "outline"}
                        aria-pressed={tkCount === n}
                        aria-label={`${n} tabeller per A4`}
                        onClick={() => setTkCount(n)}
                      >
                        {n} st
                      </Button>
                    ))}
                  </div>
                </fieldset>
              )}
              {tkRange === "custom" && (
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-foreground">Välj tal</legend>
                  <select
                    className="h-9 w-auto rounded-md border border-input bg-background px-2 text-sm text-foreground"
                    value={tkSums[0]}
                    aria-label="Välj tal för talkamrater"
                    onChange={(e) => selectSum(Number(e.target.value))}
                  >
                    {Array.from({ length: 19 }, (_, i) => i + 2).map((n) => (
                      <option key={n} value={n}>
                        {n}-kamrater
                      </option>
                    ))}
                  </select>
                </fieldset>
              )}
              {tkRange !== "custom" && (
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-foreground">
                    Färgmarkera strategier
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 px-3 text-xs font-semibold"
                      variant={tkColors ? "default" : "outline"}
                      aria-pressed={tkColors}
                      onClick={() => setTkColors(true)}
                    >
                      Med färg
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 px-3 text-xs font-semibold"
                      variant={!tkColors ? "default" : "outline"}
                      aria-pressed={!tkColors}
                      onClick={() => setTkColors(false)}
                    >
                      Utan färg
                    </Button>
                  </div>
                </fieldset>
              )}
              {tkRange === "both" && (
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-foreground">Layout</legend>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 px-3 text-xs font-semibold"
                      variant={tkLayout === "staplade" ? "default" : "outline"}
                      aria-pressed={tkLayout === "staplade"}
                      onClick={() => setTkLayout("staplade")}
                    >
                      Stående
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 px-3 text-xs font-semibold"
                      variant={tkLayout === "liggande" ? "default" : "outline"}
                      aria-pressed={tkLayout === "liggande"}
                      onClick={() => setTkLayout("liggande")}
                    >
                      Liggande (2 per sida)
                    </Button>
                  </div>
                </fieldset>
              )}
            </>
          ) : (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">
                Antal rutor per A4
              </legend>
              <div className="flex flex-wrap gap-2">
                {([1, 2, 4, 6, 8] as const).map((n) => (
                  <Button
                    key={n}
                    type="button"
                    size="sm"
                    className="h-7 px-3 text-xs font-semibold"
                    variant={count === n ? "default" : "outline"}
                    aria-pressed={count === n}
                    aria-label={`${n} rutor per A4`}
                    onClick={() => setCount(n)}
                  >
                    {n} st
                  </Button>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">
              {template === "hundred"
                ? "Produkter i rutorna"
                : template === "talkamrater" || template === "hafte"
                  ? "Talkamrater i rutorna"
                  : "Summor i rutan"}
            </legend>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="h-7 px-3 text-xs font-semibold"
                variant={showProducts ? "default" : "outline"}
                aria-pressed={showProducts}
                onClick={() => setShowProducts(true)}
              >
                Visa
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 px-3 text-xs font-semibold"
                variant={!showProducts ? "default" : "outline"}
                aria-pressed={!showProducts}
                onClick={() => setShowProducts(false)}
              >
                Dölj
              </Button>
            </div>
          </fieldset>
          <p className="text-sm text-muted-foreground">
            {template === "hafte"
              ? bkPart === "hafte"
                ? `A6-häfte med ett tal per sida (2–20)${showProducts ? "" : " med tomma rader"} · utan färg · 3 A4-ark, skriv ut dubbelsidigt (vänd längs långsidan) · 6 sidor`
                : "Steg-för-steg-instruktion för att vika och häfta · A4 stående · 1 sida"
              : template === "talkamrater"
                ? tkRange === "custom"
                  ? `Alla kombinationer som ger ${tkSums[0]} · enkel tabell utan färger · stående A4 · 1 sida`
                  : `Talkamrater ${tkRange === "both" ? "upp till 10 och 20" : `upp till ${tkRange}`}${showProducts ? "" : " med tomma rutor"}${tkColorsEff ? " · färg per strategi" : ""} · ${tkRange === "both" && tkLayout === "liggande" ? "liggande A4, två likadana halvor att klippa isär" : tkCountEff > 1 ? `stående A4, ${tkCountEff} tabeller på sidan` : "stående A4"} · ${tkPages} ${tkPages === 1 ? "sida" : "sidor"}`
                : template === "hundred"
                  ? `${count} ${showProducts ? "ifyllda" : "tomma"} rutor med faktorerna 1–10 · A4 stående · 1 sida`
                  : `${count} ${showProducts ? "ifyllda" : "tomma"} rutor med alla summor mellan 2 och ${template === "sum10" ? "10" : "20"} · A4 stående · 1 sida`}
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <ZoomControls zoom={zoom} setZoom={setZoom} zoomStep={zoomStep} />
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={createPdf}
              disabled={exporting}
            >
              <FileDown />
              {exporting ? "Skapar PDF…" : "Förhandsgranska & ladda ner PDF"}
            </Button>
            <Button type="button" className="w-full" onClick={() => window.print()}>
              <Printer />
              Skriv ut
            </Button>
          </div>
        </aside>
        <main {...mainProps} className="print-area flex min-w-0 flex-1 flex-col items-center gap-8">
          {template === "hafte" ? (
            bkPart === "hafte" ? (
              <SheetBooklet showPairs={showProducts} />
            ) : (
              <SheetFoldGuide />
            )
          ) : template === "talkamrater" ? (
            <SheetTalkamrater
              range={tkRange}
              colors={tkColors}
              showPairs={showProducts}
              landscape={tkRange === "both" && tkLayout === "liggande"}
              sums={tkSums}
              count={tkCount}
            />
          ) : template === "hundred" ? (
            <SheetHundredGrid count={count} showProducts={showProducts} />
          ) : (
            <SheetSumGrid
              range={(template === "sum10" ? 10 : 20) as SumRange}
              count={count}
              showSums={showProducts}
            />
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
          <div className="flex h-full max-h-[95vh] w-full max-w-4xl flex-col gap-3 rounded-lg bg-background p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Förhandsgranskning av PDF</h2>
              <Button type="button" variant="ghost" onClick={closePreview}>
                Stäng
              </Button>
            </div>
            <PdfPagesPreview images={preview.images} />
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex-1 text-sm font-medium">
                Filnamn
                <input
                  className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-1.5"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
              </label>
              <span className="pb-2 text-sm text-muted-foreground">.pdf</span>
              <Button type="button" variant="outline" onClick={closePreview}>
                Avbryt
              </Button>
              <Button type="button" onClick={savePdf}>
                <FileDown /> Ladda ner
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
