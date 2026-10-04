import { createFileRoute } from "@tanstack/react-router";
import { AddSubPage } from "@/components/AddSubPage";

export const Route = createFileRoute("/addition")({
  head: () => ({
    meta: [
      { title: "Addition – Räknebladet" },
      { name: "description", content: "Skapa additionsblad med uppställning eller 100 tal på sex minuter – med facit på A4." },
      { property: "og:title", content: "Addition – Räknebladet" },
      { property: "og:description", content: "Utskriftsklara additionsuppställningar och 100-talstest med facit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AddSubPage op="add" />,
});
