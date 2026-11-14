import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FilePlus2, FileText, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import Panel from "@/components/common/Panel";
import DataState, { StateMessage } from "@/components/common/DataState";
import DataView from "@/components/common/DataView";
import { api, endpointStatus } from "@/services/api";
import { useApiQuery } from "@/services/useApiQuery";
import { labelOf, toList } from "@/services/dataUtils";

export default function Reports() {
  const queryClient = useQueryClient();
  const reports = useApiQuery("reports", api.getReports);
  const [selected, setSelected] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const genStatus = endpointStatus("generateReport");

  async function generate() {
    setError(null);
    setGenerating(true);
    try {
      const data = await api.generateReport();
      if (data === null) throw Object.assign(new Error("The backend returned an empty report."), { kind: "invalid_response" });
      setSelected({ label: labelOf(data), data });
      queryClient.invalidateQueries({ queryKey: ["api", "reports"] });
    } catch (err) {
      setError(err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[20rem_1fr]">
      <div className="space-y-4 print:hidden">
        <Panel title="Generate report" icon={FilePlus2}>
          <p className="mb-3 text-xs text-muted-foreground">Builds an expedition report from the backend's current mission, route and science results.</p>
          {genStatus !== "ready" && <div className="mb-3"><StateMessage kind={genStatus} /></div>}
          <Button className="w-full" onClick={generate} disabled={genStatus !== "ready" || generating}>
            {generating ? <Loader2 className="animate-spin" /> : <FilePlus2 />}
            {generating ? "Generating…" : "Generate report"}
          </Button>
          {error && <div className="mt-3"><StateMessage kind={error.kind} message={error.message} /></div>}
        </Panel>

        <Panel title="Saved reports" icon={FileText}>
          <DataState query={reports} emptyText="No reports yet.">
            {(data) => {
              const list = toList(data) || [data];
              return (
                <ul className="space-y-1">
                  {list.map((r, i) => (
                    <li key={i}>
                      <button
                        onClick={() => setSelected({ label: labelOf(r, i), data: r })}
                        className="w-full truncate rounded-sm px-2 py-1.5 text-left text-sm hover:bg-secondary"
                      >
                        {labelOf(r, i)}
                      </button>
                    </li>
                  ))}
                </ul>
              );
            }}
          </DataState>
        </Panel>
      </div>

      <Panel
        title={selected ? selected.label : "Report"}
        icon={FileText}
        actions={
          selected && (
            <Button size="sm" variant="outline" onClick={() => window.print()} className="print:hidden">
              <Printer /> Print
            </Button>
          )
        }
      >
        {selected ? (
          typeof selected.data === "string" ? (
            <p className="whitespace-pre-wrap text-sm">{selected.data}</p>
          ) : (
            <DataView data={selected.data} />
          )
        ) : (
          <p className="text-sm text-muted-foreground">Generate a report or choose a saved one to view it here.</p>
        )}
      </Panel>
    </div>
  );
}
