import { createFileRoute } from "@tanstack/react-router";
import Navigation from "@/pages/Navigation.jsx";

export const Route = createFileRoute("/navigation")({
  head: () => ({
    meta: [
      { title: "Route Planning & Astronaut Mode — MarsWalk" },
      { name: "description", content: "Plan and compare traverse routes and step through a simulated astronaut walk." },
      { property: "og:title", content: "Route Planning & Astronaut Mode — MarsWalk" },
      { property: "og:description", content: "Plan and compare traverse routes on Mars." },
    ],
  }),
  component: Navigation,
});
