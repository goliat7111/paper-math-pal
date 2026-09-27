import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Grid3X3, ListOrdered, Plus, Minus, Divide, Grid2X2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Räknebladet – välj räknesätt" },
      { name: "description", content: "Generera och skriv ut anpassade arbetsblad och diagnoser i matematik på A4, med facit. Välj räknesätt och kom igång." },
      { property: "og:title", content: "Räknebladet – arbetsblad i matematik" },
      { property: "og:description", content: "Slumpade diagnoser och uppställningar, utskriftsklara på A4 med facit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StartPage,
});

const operations = [
  {
    title: "Multiplikation",
    description: "102 tal (6 min) och uppställning med anpassningsbara faktorer och sifferantal.",
    to: "/multiplikation",
    icon: Grid3X3,
    ready: true,
  },
  {
    title: "Addition",
    description: "Uppställningar med eller utan växling, heltal eller decimaltal.",
    to: "/addition",
    icon: Plus,
    ready: true,
  },
  {
    title: "Subtraktion",
    description: "Uppställningar med eller utan växling, heltal eller decimaltal.",
    to: "/subtraktion",
    icon: Minus,
    ready: true,
  },
  {
    title: "Division",
    description: "Kort division med uppställning eller tomma rutor för egen lösning.",
    to: "/division",
    icon: Divide,
    ready: true,
  },
] as const;

function StartPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <h1 className="font-display text-2xl font-semibold text-foreground">Räknebladet</h1>
          <p className="text-sm text-muted-foreground">Arbetsblad & diagnoser i matematik · A4</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="font-display text-3xl font-semibold text-foreground">Välj räknesätt</h2>
        <p className="mt-2 text-muted-foreground">
          Välj vilket räknesätt du vill skapa arbetsblad eller diagnoser för. Fler delar läggs till löpande.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {operations.map((op) => {
            const Icon = op.icon;
            if (!op.ready) {
              return (
                <div
                  key={op.title}
                  className="rounded-xl border border-dashed border-border bg-card/50 p-6 opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-display text-xl font-semibold text-foreground">{op.title}</h3>
                    <span className="ml-auto rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      Kommer snart
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{op.description}</p>
                </div>
              );
            }
            return (
              <Link
                key={op.title}
                to={op.to}
                className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-xl font-semibold text-foreground">{op.title}</h3>
                  <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{op.description}</p>
                <ul className="mt-4 space-y-1.5 text-sm text-foreground">
                  <li className="flex items-center gap-2">
                    <ListOrdered className="h-4 w-4 text-muted-foreground" /> {op.to === "/division" ? "8 uppgifter per A4-sida" : op.to === "/multiplikation" ? "102 tal (6 min) – multiplikationsdiagnos" : "12 uppgifter per A4-sida"}
                  </li>
                  <li className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4 text-muted-foreground" /> {op.to === "/multiplikation" ? "Uppställning med minnessiffror" : "Egen uppställning och separat facit"}
                  </li>
                </ul>
              </Link>
            );
          })}
        </div>
        <div className="mt-10 border-t border-border pt-8">
          <h2 className="font-display text-2xl font-semibold text-foreground">Utskrivbara mallar</h2>
          <Link to="/mallar" className="group mt-5 flex items-center gap-4 rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Grid2X2 className="h-5 w-5" /></span>
            <span className="min-w-0"><strong className="block font-display text-xl text-foreground">100-rutan</strong><span className="text-sm text-muted-foreground">Tomma multiplikationsrutor · 2, 4, 6 eller 8 per A4</span></span>
            <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        </div>
      </main>
    </div>
  );
}
