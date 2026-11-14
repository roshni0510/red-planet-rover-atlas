import { createFileRoute } from "@tanstack/react-router";
import Science from "@/pages/Science.jsx";

export const Route = createFileRoute("/science")({
  head: () => ({
    meta: [
      { title: "Science — MarsWalk" },
      { name: "description", content: "Geological targets, rover photographs, observation details, MEDA environmental charts and RIMFAX information." },
      { property: "og:title", content: "Science — MarsWalk" },
      { property: "og:description", content: "Geological targets, rover observations, MEDA and RIMFAX data." },
    ],
  }),
  component: Science,
});
