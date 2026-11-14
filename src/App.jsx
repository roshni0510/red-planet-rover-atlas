import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AIChat from "./components/AIChat";

/**
 * Application shell (sidebar, header, assistant drawer).
 * The platform's router renders pages into `children` (no main.jsx entry needed).
 */
export default function App({ children }) {
  const [assistantOpen, setAssistantOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenAssistant={() => setAssistantOpen(true)} />
        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">{children}</main>
      </div>
      <AIChat open={assistantOpen} onOpenChange={setAssistantOpen} />
    </div>
  );
}
