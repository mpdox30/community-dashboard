import { useMemo, useState } from "react";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fmtDate } from "../lib/status";

const LINE_COLORS = ["#0369a1", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0891b2", "#a16207", "#be185d"];

export default function TabTrend({ storageSources, ts, rainMonthly, theme }) {
  const { C, FONT } = theme;

  const [selected, setSelected] = useState(() => storageSources.slice(0, 5).map(s => s.id));

  // sync ฝนรายเดือนเข้ากับ ts โดยใช้ key "YYYY-MM" ตรงตัวเสมอ (pitfall §6)
  const chartData = useMemo(() => {
    return (ts ?? []).map(row => ({
      ...row,
      rain: rainMonthly?.[row.iso?.slice(0, 7)] ?? null,
    }));
  }, [ts, rainMonthly]);

  const toggle = (id) => {
    setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  };

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 8, fontFamily: FONT }}>
        📈 แนวโน้มระดับน้ำ (%) เทียบกับฝนรายเดือน
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {storageSources.map((s, i) => (
          <button key={s.id} onClick={() => toggle(s.id)} style={{
            border: `1.5px solid ${selected.includes(s.id) ? LINE_COLORS[i % LINE_COLORS.length] : "#cbd5e1"}`,
            background: selected.includes(s.id) ? LINE_COLORS[i % LINE_COLORS.length] + "22" : "#fff",
            color: selected.includes(s.id) ? LINE_COLORS[i % LINE_COLORS.length] : C.muted,
            borderRadius: 999, padding: "3px 12px", fontSize: 12, cursor: "pointer", fontFamily: FONT,
          }}>{s.name}</button>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 13, padding: 30, textAlign: "center" }}>ยังไม่มีข้อมูลอนุกรมเวลา</div>
      ) : (
        <div style={{ background: C.card, borderRadius: 12, padding: "16px 8px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={chartData} margin={{ top: 6, right: 10, left: -10, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="iso" tickFormatter={fmtDate} fontSize={10} minTickGap={30} />
              <YAxis yAxisId="pct" fontSize={11} unit="%" domain={[0, 100]} />
              <YAxis yAxisId="rain" orientation="right" fontSize={11} unit="mm" />
              <Tooltip labelFormatter={fmtDate} contentStyle={{ fontFamily: FONT, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontFamily: FONT, fontSize: 11 }} />
              <Bar yAxisId="rain" dataKey="rain" fill="#93c5fd" name="ฝนรายเดือน (มม.)" barSize={8} />
              {storageSources.filter(s => selected.includes(s.id)).map((s, i) => (
                <Line key={s.id} yAxisId="pct" type="monotone" dataKey={s.id} name={s.name}
                      stroke={LINE_COLORS[storageSources.findIndex(x => x.id === s.id) % LINE_COLORS.length]}
                      dot={false} connectNulls strokeWidth={2} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
