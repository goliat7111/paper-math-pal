import { createFileRoute } from "@tanstack/react-router";
import { GamePicker } from "@/components/GamePicker";

export const Route = createFileRoute("/mattespel")({ component: GamesHome });
function GamesHome() {
  return <div className="min-h-screen bg-background">
    <header className="border-b bg-card"><div className="mx-auto max-w-6xl px-6 py-4"><h1 className="font-display text-2xl font-semibold">Mattespel</h1><p className="text-sm text-muted-foreground">Utskrivbara matematikspel · A4</p></div></header>
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div><h2 className="font-display text-3xl font-semibold">Vilket spel vill du skriva ut?</h2><p className="mt-2 text-muted-foreground">Välj ett spel för att ställa in spelplaner, räknesätt och utskrift.</p></div>
      <GamePicker />
      <div className="space-y-3 text-sm text-muted-foreground">
        <p><strong className="text-foreground">Sänka skepp:</strong> spelplaner med koordinater och möjlighet att slumpa skeppen.</p>
        <p><strong className="text-foreground">5-i-rad:</strong> kvadratiska rutnät med tomma rutor eller räkneuppgifter.</p>
        <p><strong className="text-foreground">Mattebingo:</strong> elevbrickor med svar och lärarens utropslista med uppgifter.</p>
      </div>
    </main>
  </div>;
}