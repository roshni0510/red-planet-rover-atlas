import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard.jsx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mission Dashboard — MarsWalk" },
      { name: "description", content: "MarsWalk mission overview: datasets, scientific targets, route status, terrain risk and environmental observations." },
      { property: "og:title", content: "Mission Dashboard — MarsWalk" },
      { property: "og:description", content: "MarsWalk mission overview: datasets, targets, route status and terrain risk." },
    ],
  }),
  component: Dashboard,
});
