// ============= Full file contents =============

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus, Minus, Divide, Grid2X2, Shuffle } from "lucide-react";

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
    to: "/multiplikation",
    icon: <span className="font-display text-3xl font-bold leading-none">×</span>,
  },
  {
    title: "Addition",
    to: "/addition",
    icon: <Plus className="h-5 w-5" />,
  },
  {
    title: "Subtraktion",
    to: "/subtraktion",
    icon: <Minus className="h-5 w-5" />,
  },
  {
    title: "Division",
    to: "/division",
    icon: <Divide className="h-5 w-5" />,
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
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Här skapar du egna övningar och diagnoser som du skriver ut på A4 – med eller utan facit.
          Välj räknesätt så ställer du in uppgifterna precis som du vill ha dem.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {operations.map((op) => (
            <Link
              key={op.title}
              to={op.to}
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {op.icon}
                </span>
                <h3 className="font-display text-xl font-semibold text-foreground">{op.title}</h3>
                <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-10 border-t border-border pt-8">
          <h2 className="font-display text-2xl font-semibold text-foreground">Utskrivbara mallar</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Link to="/mallar" className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Grid2X2 className="h-5 w-5" />
                </span>
                <h3 className="font-display text-xl font-semibold text-foreground">Mallar</h3>
                <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </Link>
            <Link to="/blandade-mallar" className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shuffle className="h-5 w-5" />
                </span>
                <h3 className="font-display text-xl font-semibold text-foreground">Blandade övningar</h3>
                <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
