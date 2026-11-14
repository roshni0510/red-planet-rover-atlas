import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { humanizeKey, seriesKeys } from "@/services/dataUtils";
import { EmptyState } from "./DataState";

/** Plots numeric fields from backend records exactly as returned (no resampling). */
export default function SeriesChart({ records }) {
  const { xKey, yKeys } = useMemo(() => seriesKeys(records), [records]);
  const [selected, setSelected] = useState(null);
  const yKey = selected && yKeys.includes(selected) ? selected : yKeys[0];

  if (!xKey || !yKey) return <EmptyState text="The backend data contains no numeric series to chart." />;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label htmlFor="series-select" className="label-caps">Variable</label>
        <select
          id="series-select"
          value={yKey}
          onChange={(e) => setSelected(e.target.value)}
          className="h-8 rounded-md border border-input bg-surface px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {yKeys.map((k) => (
            <option key={k} value={k}>{humanizeKey(k)}</option>
          ))}
        </select>
        <span className="font-mono text-[0.6875rem] text-muted-foreground">{records.length} records · x: {humanizeKey(xKey)}</span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={records} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey={xKey} stroke="var(--color-muted-foreground)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} minTickGap={24} />
            <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} width={56} />
            <Tooltip
              contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: "var(--color-muted-foreground)" }}
            />
            <Line type="monotone" dataKey={yKey} name={humanizeKey(yKey)} stroke="var(--color-chart-1)" strokeWidth={1.75} dot={false} isAnimationActive={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
