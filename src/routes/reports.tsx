import { createFileRoute } from "@tanstack/react-router";
import Reports from "@/pages/Reports.jsx";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Expedition Reports — MarsWalk" },
      { name: "description", content: "Generate and view MarsWalk expedition reports from backend results." },
      { property: "og:title", content: "Expedition Reports — MarsWalk" },
      { property: "og:description", content: "Generate and view MarsWalk expedition reports." },
    ],
  }),
  component: Reports,
});
