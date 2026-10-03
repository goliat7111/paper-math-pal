import { Link } from "@tanstack/react-router";
import { Anchor, Grid2X2, Check, Search } from "lucide-react";

export function GamePicker({
  current,
}: { current?: "battleship" | "five" | "bingo" | "word-search" } = {}) {
  const games = [
    {
      id: "battleship",
      to: "/sanka-skepp",
      label: "Sänka skepp",
      icon: Anchor,
      color: "bg-blue-700 hover:bg-blue-800",
    },
    {
      id: "five",
      to: "/fem-i-rad",
      label: "5-i-rad",
      icon: Grid2X2,
      color: "bg-emerald-700 hover:bg-emerald-800",
    },
    {
      id: "bingo",
      to: "/mattebingo",
      label: "Mattebingo",
      icon: Grid2X2,
      color: "bg-violet-700 hover:bg-violet-800",
    },
    {
      id: "word-search",
      to: "/ordgomma",
      label: "Ordgömma",
      icon: Search,
      color: "bg-amber-700 hover:bg-amber-800",
    },
  ] as const;
  return (
    <nav
      aria-label="Välj mattespel"
      className="no-print rounded-xl border border-border bg-muted/40 p-4"
    >
      <h2 className="mb-3 text-base font-semibold text-foreground">Välj spel</h2>
      <div className="flex flex-wrap gap-3">
        {games.map((game) => {
          const selected = game.id === current;
          const Icon = game.icon;
          return (
            <Link
              key={game.id}
              to={game.to}
              aria-current={selected ? "page" : undefined}
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground ${game.color} ${selected ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {game.label}
              {selected && (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Valt spel</span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
