import { createFileRoute } from "@tanstack/react-router";
import { AddSubPage } from "@/components/AddSubPage";

export const Route = createFileRoute("/subtraktion")({
  head: () => ({
    meta: [
      { title: "Subtraktion – Räknebladet" },
      { name: "description", content: "Skapa subtraktionsblad med eller utan växling, heltal eller decimaltal, färdig uppställning eller tom ruta – med facit på A4." },
      { property: "og:title", content: "Subtraktion – Räknebladet" },
      { property: "og:description", content: "Utskriftsklara subtraktionsuppställningar med växling markerad i facit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AddSubPage op="sub" />,
});
