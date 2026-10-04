import { createFileRoute } from "@tanstack/react-router";
import { AddSubPage } from "@/components/AddSubPage";

export const Route = createFileRoute("/subtraktion")({
  head: () => ({
    meta: [
      { title: "Subtraktion – Räknebladet" },
      { name: "description", content: "Skapa subtraktionsblad med uppställning eller 100 tal på sex minuter – med facit på A4." },
      { property: "og:title", content: "Subtraktion – Räknebladet" },
      { property: "og:description", content: "Utskriftsklara subtraktionsuppställningar och 100-talstest med facit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AddSubPage op="sub" />,
});
