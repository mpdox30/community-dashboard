import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { RAIN_THRESHOLDS, getRainThreshold } from "../lib/status";

const PERIOD_DAYS = { "30d": 30, "90d": 90, "1y": 365, all: Infinity };

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

      <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
        {[{ id: "daily", label: "รายวัน" }, { id: "cum3", label: "สะสม 3 วัน" }, { id: "monthly", label: "รายเดือน" }, { id: "yearly", label: "รายปี" }, { id: "forecast", label: "พยากรณ์ 16 วัน" }].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            border: `1.5px solid ${view === v.id ? C.sky : "#cbd5e1"}`, background: view === v.id ? "#e0f2fe" : "#fff",
            borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: FONT,
            fontWeight: view === v.id ? 700 : 400,
          }}>{v.label}</button>
        ))}
        {(view === "daily" || view === "cum3") && (
          <select value={period} onChange={e => setPeriod(e.target.value)} style={{ marginLeft: "auto", fontFamily: FONT, fontSize: 12, borderRadius: 8, border: "1.5px solid #cbd5e1", padding: "4px 8px" }}>
            <option value="30d">30 วัน</option>
            <option value="90d">90 วัน</option>
            <option value="1y">1 ปี</option>
            <option value="all">ทั้งหมด</option>
          </select>
        )}
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
            <BarChart data={rainForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" fontSize={10} />
              <YAxis fontSize={11} unit="mm" />
              <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12 }} formatter={(v, n, p) => [`${v} มม. (โอกาส ${p.payload.prob}%)`, "ฝนคาดการณ์"]} />
              <Bar dataKey="rain" name="ฝนคาดการณ์ (มม.)" fill="#38bdf8" />
            </BarChart>
          )}
        </ResponsiveContainer>
        {view === "forecast" && rainError && (
          <div style={{ fontSize: 11, color: "#92400e", marginTop: 6, textAlign: "center" }}>
            ⚠️ ใช้ข้อมูลสำรอง (เชื่อมต่อ Open-Meteo ไม่สำเร็จ: {rainError})
          </div>
        )}
      </div>

      {(view === "daily" || view === "cum3") && (
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11, color: C.muted, fontFamily: FONT }}>
          <span style={{ fontWeight: 700 }}>ระดับฝน (สสน.):</span>
          {RAIN_THRESHOLDS.map(t => (
            <span key={t.level} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, background: t.color, display: "inline-block", borderRadius: 2 }} />{t.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
