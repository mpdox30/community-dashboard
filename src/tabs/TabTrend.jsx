import { useMemo, useState } from "react";
import { ComposedChart, Line, Bar, BarChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fmtDate, getStatus, STATUS_CONFIG } from "../lib/status";

const LINE_COLORS = ["#0369a1", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0891b2", "#a16207", "#be185d"];

export default function TabTrend({ storageSources, ts, rainDaily, rainMonthly, theme }) {
  const { C, FONT } = theme;

  const [selected, setSelected] = useState(() => storageSources.slice(0, 5).map(s => s.id));

  // sync ฝนรายเดือนเข้ากับ ts โดยใช้ key "YYYY-MM" ตรงตัวเสมอ (pitfall §6)
  const chartData = useMemo(() => {
    return (ts ?? []).map(row => ({
      ...row,
      rain: rainMonthly?.[row.iso?.slice(0, 7)] ?? null,
    }));
  }, [ts, rainMonthly]);

  // ── ฝนสะสม 7 วันก่อนวันวัด — เรียงตามวันเดียวกับ ts ── (ส่วนที่ 2 ของแท็บแนวโน้มในต้นแบบ)
  const rain7dData = useMemo(() => {
    const byDate = Object.fromEntries((rainDaily ?? []).map(r => [r.iso, r.rain ?? 0]));
    const dates = Object.keys(byDate).sort();
    const cum7 = {};
    dates.forEach((iso, i) => {
      let sum = 0;
      for (let k = Math.max(0, i - 6); k <= i; k++) sum += byDate[dates[k]] ?? 0;
      cum7[iso] = Math.round(sum * 10) / 10;
    });
    return (ts ?? []).map(row => ({ iso: row.iso, rain7d: cum7[row.iso] ?? null }));
  }, [ts, rainDaily]);

  // ── อัตราเปลี่ยนแปลง %/สัปดาห์ ของทุกแหล่งพร้อมกัน — เรียงจากลดเร็วสุดก่อน (ส่วนที่ 3 ของแท็บแนวโน้มในต้นแบบ)
  const dWData = useMemo(() => {
    return [...storageSources]
      .filter(s => s.dW != null)
      .sort((a, b) => a.dW - b.dW)
      .map(s => ({
        name: s.name, dW: s.dW,
        fill: s.dW > 0 ? "#22c55e" : STATUS_CONFIG[getStatus(s.pct)].badge,
      }));
  }, [storageSources]);

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

      {/* ── ฝนสะสม 7 วันก่อนวันวัด ── */}
      {rain7dData.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 8, fontFamily: FONT }}>
            🌧️ ฝนสะสม 7 วันก่อนวันวัด
          </div>
          <div style={{ background: C.card, borderRadius: 12, padding: "16px 8px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rain7dData} margin={{ top: 6, right: 10, left: -10, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="iso" tickFormatter={fmtDate} fontSize={10} minTickGap={30} />
                <YAxis fontSize={11} unit="mm" />
                <Tooltip labelFormatter={fmtDate} formatter={v => [`${v} มม.`, "ฝนสะสม 7 วัน"]} contentStyle={{ fontFamily: FONT, fontSize: 12 }} />
                <Bar dataKey="rain7d" name="ฝนสะสม 7 วัน (มม.)" fill="#38bdf8" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── อัตราเปลี่ยนแปลง %/สัปดาห์ ทุกแหล่งพร้อมกัน ── */}
      {dWData.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 8, fontFamily: FONT }}>
            📉 อัตราเปลี่ยนแปลงระดับน้ำ (%/สัปดาห์) — ทุกแหล่ง เรียงจากลดเร็วสุด
          </div>
          <div style={{ background: C.card, borderRadius: 12, padding: "16px 8px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <ResponsiveContainer width="100%" height={Math.max(220, dWData.length * 28)}>
              <BarChart data={dWData} layout="vertical" margin={{ top: 6, right: 24, left: 10, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" unit="%" fontSize={11} />
                <YAxis type="category" dataKey="name" width={130} fontSize={11} />
                <Tooltip formatter={v => [`${v > 0 ? "+" : ""}${v.toFixed(2)}%/สัปดาห์`, "อัตราเปลี่ยนแปลง"]} contentStyle={{ fontFamily: FONT, fontSize: 12 }} />
                <Bar dataKey="dW" name="%/สัปดาห์" radius={[0, 4, 4, 0]}>
                  {dWData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
