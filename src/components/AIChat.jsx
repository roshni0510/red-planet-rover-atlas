import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { api, endpointStatus, requestFormatReady } from "@/services/api";
import { humanizeKey } from "@/services/dataUtils";
import { StateMessage } from "./common/DataState";
import DataView from "./common/DataView";

const TOPICS = [
  "Geological targets",
  "Route selection",
  "Terrain hazards",
  "Environmental measurements",
  "Scientific observations",
];

const ANSWER_KEY = /^(answer|response|reply|message|text)$/i;
const EVIDENCE_KEY = /evidence|source|citation|reference/i;
const LIMITATION_KEY = /limitation|caveat|uncertaint|warning/i;

function AssistantReply({ data }) {
  if (typeof data === "string") return <p className="whitespace-pre-wrap text-sm">{data}</p>;
  if (!data || typeof data !== "object") return <DataView data={data} />;

  const entries = Object.entries(data);
  const answer = entries.find(([k, v]) => ANSWER_KEY.test(k) && typeof v === "string");
  const evidence = entries.filter(([k]) => EVIDENCE_KEY.test(k));
  const limits = entries.filter(([k]) => LIMITATION_KEY.test(k));
  const used = new Set([answer?.[0], ...evidence.map(([k]) => k), ...limits.map(([k]) => k)]);
  const rest = Object.fromEntries(entries.filter(([k]) => !used.has(k)));

  return (
    <div className="space-y-3">
      {answer && <p className="whitespace-pre-wrap text-sm">{answer[1]}</p>}
      {evidence.map(([k, v]) => (
        <div key={k} className="rounded border border-border bg-surface p-2.5">
          <p className="label-caps mb-1.5 !text-info">{humanizeKey(k)}</p>
          <DataView data={v} depth={1} />
        </div>
      ))}
      {limits.map(([k, v]) => (
        <div key={k} className="rounded border border-warning/40 bg-warning/5 p-2.5">
          <p className="label-caps mb-1.5 !text-warning">{humanizeKey(k)}</p>
          <DataView data={v} depth={1} />
        </div>
      ))}
      {Object.keys(rest).length > 0 && <DataView data={rest} depth={1} />}
    </div>
  );
}

export default function AIChat({ open, onOpenChange }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const endpoint = endpointStatus("assistant");
  const formatReady = requestFormatReady("assistant");
  const blocker = endpoint !== "ready" ? endpoint : !formatReady ? "request_format_pending" : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  async function send(e) {
    e?.preventDefault();
    const question = input.trim();
    if (!question || sending || blocker) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setSending(true);
    try {
      const data = await api.askAssistant(question);
      setMessages((m) => [...m, { role: "assistant", content: data }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "error", kind: err?.kind, content: err?.message }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 border-border bg-background p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle className="text-base">Mission assistant</SheetTitle>
          <SheetDescription className="text-xs">
            Answers come from the MarsWalk backend, with its evidence and data limitations.
          </SheetDescription>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {blocker && <StateMessage kind={blocker} />}
          {messages.length === 0 && (
            <div>
              <p className="label-caps mb-2">You can ask about</p>
              <ul className="flex flex-wrap gap-1.5">
                {TOPICS.map((t) => (
                  <li key={t} className="rounded-sm border border-border bg-surface px-2 py-1 text-xs text-muted-foreground">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="ml-8 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
                {m.content}
              </div>
            ) : m.role === "error" ? (
              <StateMessage key={i} kind={m.kind} message={m.content} />
            ) : (
              <div key={i} className="mr-4 rounded-md border border-border bg-card px-3 py-2.5">
                <AssistantReply data={m.content} />
              </div>
            ),
          )}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-primary" /> Waiting for backend…
            </div>
          )}
        </div>

        <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
          <label htmlFor="assistant-input" className="sr-only">
            Question
          </label>
          <input
            id="assistant-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!!blocker}
            placeholder={blocker ? "Assistant not connected" : "Ask about targets, routes, hazards…"}
            className="h-9 min-w-0 flex-1 rounded-md border border-input bg-surface px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
          />
          <Button type="submit" size="icon" disabled={!!blocker || sending || !input.trim()} aria-label="Send">
            <Send />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
