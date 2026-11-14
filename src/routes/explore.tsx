import { createFileRoute } from "@tanstack/react-router";
import Explore from "@/pages/Explore.jsx";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Map — MarsWalk" },
      { name: "description", content: "Interactive Mars map with imagery, geology, elevation, slope, roughness, hazards and scientific targets." },
      { property: "og:title", content: "Explore Map — MarsWalk" },
      { property: "og:description", content: "Interactive Mars map with mission layers and scientific targets." },
    ],
  }),
  component: Explore,
});
