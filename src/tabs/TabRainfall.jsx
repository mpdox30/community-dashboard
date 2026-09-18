import { useMemo, useState } from "react";
import { BarChart, Bar, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer, Cell } from "recharts";
import { RAIN_THRESHOLDS, getRainThreshold } from "../lib/status";
import { buildMonthlyClimatology } from "../lib/climatology";
import { exportCsv } from "../lib/exportCsv";

const PERIOD_DAYS = { "30d": 30, "90d": 90, "1y": 365, all: Infinity };
const TH_MON_SHORT = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export default function TabRainfall({ rainDaily, rainMonthly, rainYearly, rainForecast, rainLoading, rainError, theme }) {
  const { C, FONT } = theme;
  const [view, setView] = useState("daily");     // daily | cum3 | monthly | yearly | forecast
  const [period, setPeriod] = useState("90d");

  const filteredDaily = useMemo(() => {
    const n = PERIOD_DAYS[period];
    return n === Infinity ? rainDaily : rainDaily.slice(-n);
  }, [rainDaily, period]);

  // ── สะสม 3 วัน (rolling) — เรียงตามวันเดียวกับรายวัน ──
  const cum3Daily = useMemo(() => {
    return rainDaily.map((r, i) => {
      let sum = 0;
      for (let k = Math.max(0, i - 2); k <= i; k++) sum += rainDaily[k]?.rain ?? 0;
      return { d: r.d, iso: r.iso, rain: Math.round(sum * 10) / 10 };
    });
  }, [rainDaily]);
  const filteredCum3 = useMemo(() => {
    const n = PERIOD_DAYS[period];
    return n === Infinity ? cum3Daily : cum3Daily.slice(-n);
  }, [cum3Daily, period]);

  const monthlyArr = useMemo(() =>
    Object.entries(rainMonthly).sort(([a], [b]) => a.localeCompare(b)).map(([ym, mm]) => ({ ym, mm })),
    [rainMonthly]
  );
  const yearlyArr = useMemo(() =>
    Object.entries(rainYearly).sort(([a], [b]) => a.localeCompare(b)).map(([y, mm]) => ({ y, mm })),
    [rainYearly]
  );

  const now = rainDaily.length ? rainDaily[rainDaily.length - 1].iso : null;
  const thisMonthKey = now?.slice(0, 7);
  const thisYearKey = now?.slice(0, 4);

  // ── ตรวจจับฝนผิดปกติ (แล้ง/เกินค่าเฉลี่ย) — เทียบฝนเดือนปัจจุบันกับค่าเฉลี่ยภูมิอากาศของเดือน
  // เดียวกันจากปีอื่นๆ ทั้งหมด (ไม่รวมเดือนปัจจุบันเองกันข้อมูลบางส่วนของเดือนนี้ไปเอนเอียงค่าเฉลี่ย)
  // ใช้ buildMonthlyClimatology ตัวเดียวกับที่ CropWaterPlanner ใช้จำลองสมดุลน้ำอยู่แล้ว (ย้ายไป lib/climatology.js)
  const monthlyRainAvg = useMemo(() => {
    const historical = Object.fromEntries(Object.entries(rainMonthly).filter(([ym]) => ym !== thisMonthKey));
    return buildMonthlyClimatology(historical);
  }, [rainMonthly, thisMonthKey]);
  const thisMonthNum = thisMonthKey ? parseInt(thisMonthKey.slice(5, 7), 10) : null;
  const thisMonthActual = thisMonthKey ? (rainMonthly[thisMonthKey] ?? 0) : null;
  const thisMonthAvg = thisMonthNum != null ? monthlyRainAvg[thisMonthNum] : null;
  const anomalyPct = (thisMonthAvg && thisMonthAvg > 0 && thisMonthActual != null)
    ? Math.round(((thisMonthActual - thisMonthAvg) / thisMonthAvg) * 100)
    : null;

  // ── เปรียบเทียบฝนปีนี้กับปีที่แล้ว รายเดือน ──
  const yoyData = useMemo(() => {
    if (!thisYearKey) return [];
    const lastYearKey = String(Number(thisYearKey) - 1);
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const mm = String(m).padStart(2, "0");
      return {
        month: TH_MON_SHORT[m],
        thisYear: rainMonthly[`${thisYearKey}-${mm}`] ?? null,
        lastYear: rainMonthly[`${lastYearKey}-${mm}`] ?? null,
      };
    });
  }, [rainMonthly, thisYearKey]);

  const kpi = [
    { icon: "📅", label: "ฝนเดือนนี้", val: `${rainMonthly[thisMonthKey] ?? 0} มม.` },
    { icon: "🗓️", label: "ฝนปีนี้", val: `${rainYearly[thisYearKey] ?? 0} มม.` },
    { icon: "💧", label: "ฝนสะสม 7 วันล่าสุด", val: `${Math.round(rainDaily.slice(-7).reduce((s, r) => s + r.rain, 0) * 10) / 10} มม.` },
    { icon: "🌤️", label: "พยากรณ์ 16 วัน (รวม)", val: rainLoading ? "…" : `${Math.round(rainForecast.reduce((s, r) => s + r.rain, 0))} มม.` },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginBottom: 18 }}>
        {kpi.map(k => (
          <div key={k.label} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 18 }}>{k.icon}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{k.label}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.navy }}>{k.val}</div>
          </div>
        ))}
      </div>

      {anomalyPct != null && Math.abs(anomalyPct) >= 25 && (
        <div style={{
          background: anomalyPct < 0 ? "#fff7ed" : "#eff6ff",
          border: `1.5px solid ${anomalyPct < 0 ? "#fdba74" : "#93c5fd"}`,
          borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12.5, fontFamily: FONT,
          color: anomalyPct < 0 ? "#9a3412" : "#1e40af",
        }}>
          {anomalyPct < 0
            ? `🏜️ ฝนเดือนนี้ต่ำกว่าค่าเฉลี่ยย้อนหลัง ${Math.abs(anomalyPct)}% (${thisMonthActual} มม. เทียบเฉลี่ย ${Math.round(thisMonthAvg)} มม.)`
            : `🌧️ ฝนเดือนนี้สูงกว่าค่าเฉลี่ยย้อนหลัง ${anomalyPct}% (${thisMonthActual} มม. เทียบเฉลี่ย ${Math.round(thisMonthAvg)} มม.)`}
        </div>
      )}

      {/* ── ส่วนที่ 1: ฝนสะสม/ฝนย้อนหลัง (รายวัน / สะสม 3 วัน / รายเดือน / รายปี) ── */}
      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 8, fontFamily: FONT }}>
        🌧️ ฝนสะสม (ข้อมูลย้อนหลัง)
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        {[{ id: "daily", label: "รายวัน" }, { id: "cum3", label: "สะสม 3 วัน" }, { id: "monthly", label: "รายเดือน" }, { id: "yearly", label: "รายปี" }, { id: "yoy", label: "เทียบปีต่อปี" }].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            border: `1.5px solid ${view === v.id ? C.sky : "#cbd5e1"}`, background: view === v.id ? "#e0f2fe" : "#fff",
            borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: FONT,
            fontWeight: view === v.id ? 700 : 400,
          }}>{v.label}</button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          {(view === "daily" || view === "cum3") && (
            <select value={period} onChange={e => setPeriod(e.target.value)} style={{ fontFamily: FONT, fontSize: 12, borderRadius: 8, border: "1.5px solid #cbd5e1", padding: "4px 8px" }}>
              <option value="30d">30 วัน</option>
              <option value="90d">90 วัน</option>
              <option value="1y">1 ปี</option>
              <option value="all">ทั้งหมด</option>
            </select>
          )}
          <button onClick={() => exportCsv("ฝนรายวัน.csv", [{ label: "วันที่", key: "iso" }, { label: "ฝน (มม.)", key: "rain" }], rainDaily)} style={{
            border: "1.5px solid #cbd5e1", background: "#fff", borderRadius: 8, padding: "6px 12px",
            fontSize: 12, cursor: "pointer", fontFamily: FONT, color: C.navy,
          }}>📥 ส่งออก CSV</button>
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 12, padding: "16px 8px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <ResponsiveContainer width="100%" height={320}>
          {view === "daily" ? (
            <BarChart data={filteredDaily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="d" fontSize={9} minTickGap={20} />
              <YAxis fontSize={11} unit="mm" />
              <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12 }} />
              <Bar dataKey="rain" name="ฝน (มม.)">
                {filteredDaily.map((r, i) => <Cell key={i} fill={getRainThreshold(r.rain)?.color ?? "#93c5fd"} />)}
              </Bar>
            </BarChart>
          ) : view === "cum3" ? (
            <BarChart data={filteredCum3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="d" fontSize={9} minTickGap={20} />
              <YAxis fontSize={11} unit="mm" />
              <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12 }} formatter={v => [`${v} มม.`, "ฝนสะสม 3 วัน"]} />
              <Bar dataKey="rain" name="ฝนสะสม 3 วัน (มม.)">
                {filteredCum3.map((r, i) => <Cell key={i} fill={getRainThreshold(r.rain)?.color ?? "#93c5fd"} />)}
              </Bar>
            </BarChart>
          ) : view === "monthly" ? (
            <BarChart data={monthlyArr}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="ym" fontSize={10} />
              <YAxis fontSize={11} unit="mm" />
              <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12 }} />
              <Bar dataKey="mm" name="ฝนรวมรายเดือน (มม.)" fill="#0369a1" />
            </BarChart>
          ) : view === "yearly" ? (
            <BarChart data={yearlyArr}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="y" fontSize={11} />
              <YAxis fontSize={11} unit="mm" />
              <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12 }} />
              <Bar dataKey="mm" name="ฝนรวมรายปี (มม.)" fill="#0c4a6e" />
            </BarChart>
          ) : (
            <BarChart data={yoyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" fontSize={10} />
              <YAxis fontSize={11} unit="mm" />
              <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontFamily: FONT, fontSize: 11 }} />
              <Bar dataKey="lastYear" name={`ปี ${thisYearKey ? Number(thisYearKey) - 1 + 543 : "ก่อนหน้า"}`} fill="#94a3b8" />
              <Bar dataKey="thisYear" name={`ปี ${thisYearKey ? Number(thisYearKey) + 543 : "นี้"}`} fill="#0369a1" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11, color: C.muted, fontFamily: FONT }}>
        <span style={{ fontWeight: 700 }}>ระดับฝน (สสน.):</span>
        {RAIN_THRESHOLDS.map(t => (
          <span key={t.level} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, background: t.color, display: "inline-block", borderRadius: 2 }} />{t.label}
          </span>
        ))}
      </div>

      {/* ── ส่วนที่ 2: พยากรณ์ฝน 16 วันข้างหน้า — แยกออกจากฝนสะสมโดยสิ้นเชิง เป็นคนละส่วน ── */}
      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginTop: 28, marginBottom: 8, fontFamily: FONT }}>
        🌤️ พยากรณ์ฝน 16 วันข้างหน้า
      </div>

      <div style={{ background: C.card, borderRadius: 12, padding: "16px 8px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={rainForecast} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" fontSize={10} />
            <YAxis yAxisId="mm" fontSize={11} unit="mm" />
            <YAxis yAxisId="prob" orientation="right" domain={[0, 100]} fontSize={11} unit="%" />
            <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12 }}
              formatter={(v, n) => n === "โอกาสฝน %" ? [`${v}%`, n] : [`${v} มม.`, n]} />
            <ReferenceLine yAxisId="mm" y={35} stroke="#d97706" strokeDasharray="3 2"
              label={{ value: "ฝนหนัก 35มม.", fill: "#d97706", fontSize: 9 }} />
            <Bar yAxisId="mm" dataKey="rain" name="ฝนคาดการณ์ (มม.)">
              {rainForecast.map((r, i) => <Cell key={i} fill={getRainThreshold(r.rain)?.color ?? "#38bdf8"} />)}
            </Bar>
            <Line yAxisId="prob" type="monotone" dataKey="prob" name="โอกาสฝน %"
              stroke="#7c3aed" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        {rainError && (
          <div style={{ fontSize: 11, color: "#92400e", marginTop: 6, textAlign: "center" }}>
            ⚠️ ใช้ข้อมูลสำรอง (เชื่อมต่อ Open-Meteo ไม่สำเร็จ: {rainError})
          </div>
        )}
        {!rainLoading && rainForecast.length > 0 && (() => {
          const total = rainForecast.reduce((s, d) => s + (d.rain ?? 0), 0);
          return total >= 30 ? (
            <div style={{
              marginTop: 10, background: "#f0fdf4", border: "1.5px solid #86efac",
              borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: FONT,
            }}>
              🌱 <strong>คาดว่าจะมีฝน {total.toFixed(0)} มม. ใน 16 วัน</strong> —
              หากฝนตกลงแหล่งน้ำในพื้นที่ ประมาณการวันวิกฤตในแท็บ "ความเสี่ยง" อาจเลื่อนออกไปได้
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}
