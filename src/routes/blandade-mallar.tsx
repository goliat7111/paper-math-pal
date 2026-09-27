import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/blandade-mallar")({
  head: () => ({
    meta: [
      { title: "Blandade övningar – Räknebladet" },
      { name: "description", content: "Bygg blandade övningar med flera räknesätt på samma A4-blad, med eller utan facit." },
      { property: "og:title", content: "Blandade övningar – Räknebladet" },
      { property: "og:description", content: "Bygg blandade övningar med flera räknesätt på samma A4-blad." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlandadeMallarPage,
});

function BlandadeMallarPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <h1 className="font-display text-2xl font-semibold text-foreground">Blandade övningar</h1>
          <p className="text-sm text-muted-foreground">Arbetsblad & diagnoser i matematik · A4</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link to="/" className="no-print inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Gå till startsidan
        </Link>

        <h2 className="font-display text-3xl font-semibold text-foreground">Blandade övningar</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Här bygger du blad där olika räknesätt blandas på samma sida. Välj vilka övningar som ska
          ingå och hur många av varje – vi tar fram en passande layout för det.
        </p>
      </main>
    </div>
  );
}
