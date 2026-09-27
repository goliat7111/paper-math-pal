import { createFileRoute } from "@tanstack/react-router";
import { AddSubPage } from "@/components/AddSubPage";

export const Route = createFileRoute("/addition")({
  head: () => ({
    meta: [
      { title: "Addition – Räknebladet" },
      { name: "description", content: "Skapa additionsblad med eller utan växling, heltal eller decimaltal, färdig uppställning eller tom ruta – med facit på A4." },
      { property: "og:title", content: "Addition – Räknebladet" },
      { property: "og:description", content: "Utskriftsklara additionsuppställningar med minnessiffror i facit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AddSubPage op="add" />,
});
