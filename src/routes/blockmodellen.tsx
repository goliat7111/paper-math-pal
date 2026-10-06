import { createFileRoute } from "@tanstack/react-router";

import { BlockModelWorkspace } from "../components/block-model/BlockModelWorkspace";
import "../components/block-model/block-model.css";

export const Route = createFileRoute("/blockmodellen")({
  head: () => ({
    meta: [
      { title: "Blockmodellen – Räknebladet" },
      {
        name: "description",
        content: "Bygg matematiska modeller tillsammans på en interaktiv arbetsyta.",
      },
    ],
  }),
  component: BlockModelPage,
});

function BlockModelPage() {
  return <BlockModelWorkspace />;
}
