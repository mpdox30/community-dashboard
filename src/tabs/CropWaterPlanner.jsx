import { useState, useMemo, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { fmt } from "../lib/status";
import { buildMonthlyClimatology } from "../lib/climatology";

/* ─────────────────────────────────────────────
   CropWaterPlanner — เครื่องมือจำลอง "ถ้า…จะเป็นอย่างไร" (what-if water-use simulator)
   พอร์ต logic การจำลอง (simulateScenario) มาจากต้นแบบนครป่าหมากตรงๆ ทั้งอัลกอริทึม
   (App.jsx บรรทัด ~2103-2163) — ตาม GAP_ANALYSIS §3.2 ห้ามคิดใหม่ ให้พอร์ตของเดิมที่ debug
   แล้วมาใช้ มีจุดต่างจากต้นแบบจุดเดียวคือ "ข้อมูลฝนที่ใช้หักออกจากความต้องการน้ำ": ต้นแบบใช้ค่าเฉลี่ย
   ภูมิอากาศคงที่ (MONTHLY_RAIN_AVG hardcode ทั้งไฟล์) ส่วนที่นี่คำนวณค่าเฉลี่ยรายเดือนจากข้อมูลฝนรายวัน
   จริงหลายปีของแม่นาเรือเอง (rainMonthly จาก v_rainfall_daily_tambon) แม่นยำกว่าต้นแบบตามที่ระบุไว้ใน
   GAP_ANALYSIS ("จำลองได้แม่นยำกว่าต้นแบบเสียอีก") — ไม่ใช่การเปลี่ยน logic เป็นแค่เปลี่ยนแหล่งข้อมูล

   รายชื่อพืช/ค่า Kc ด้านล่างจัดกลุ่มจากไฟล์ LULC จริงของแม่นาเรือ (สรุปพื้นที่เพาะปลูกรายหมู่บ้าน,
   2026-09-14) เหลือ 9 กลุ่มหลัก (คลุม ~88% ของพื้นที่เกษตรทั้งหมด 23,088 ไร่) แทนชุด 6 ชนิดทั่วไปของ
   ต้นแบบ — ค่า Kc มาจาก FAO-56 Table 12 (พืชล้มลุก: ข้าว/ข้าวโพด/มันสำปะหลัง/พืชผัก/กล้วย/อ้อย) และ
   งานวิจัย/แหล่งอ้างอิงทางการเกษตรเสริมสำหรับไม้ยืนต้น (ลำไย/ยางพารา/ปาล์มน้ำมัน/ไม้ผลรวม) ซึ่งยังไม่มี
   ตาราง Kc มาตรฐานระดับประเทศ — ค่าพืชยืนต้นเหล่านี้จึงเป็นค่าประมาณหยาบกว่าค่าพืชล้มลุก ควรสอบถาม
   เกษตรอำเภอ/เกษตรกรในพื้นที่เพื่อ calibrate ให้แม่นยำขึ้นก่อนใช้ตัดสินใจเชิงนโยบายจริงจัง
   ⚠️ เช่นเดียวกับต้นแบบ: ค่าเหล่านี้ยังไม่ได้ calibrate เฉพาะพื้นที่แม่นาเรือ
───────────────────────────────────────────── */
const CWP_TH_MON = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const ET0 = 4.6; // มม./วัน — ค่าเดียวกับที่ TabCrop.jsx ใช้คำนวณ ETc ข้าวอยู่แล้ว (773 ลบ.ม./ไร่/ฤดู) ให้สองส่วนในแท็บนี้สอดคล้องกัน
const RAI_TO_M2 = 1600;

const CROPS = {
  rice:      { label: "ข้าว (นาข้าว)",        kc: 1.05, days: 100, note: "ค่าเดิมที่ระบบใช้อยู่แล้ว (ตรงกับสูตร 773 ลบ.ม./ไร่ ด้านบน)" },
  maize:     { label: "ข้าวโพด",              kc: 1.20, days: 110, note: "FAO-56 maize (silking stage)" },
  longan:    { label: "ลำไย",                 kc: 0.85, days: 365, note: "ไม้ผลยืนต้น ใช้น้ำต่อเนื่องเกือบทั้งปี — ค่าประมาณเฉลี่ยรอบปี ไม่มีตาราง Kc มาตรฐานประเทศ" },
  rubber:    { label: "ยางพารา",              kc: 0.90, days: 365, note: "ไม้ยืนต้น ทรงพุ่มปิดตลอดปี — ค่าประมาณจากงานวิจัยน้ำยางพารา" },
  cassava:   { label: "มันสำปะหลัง",          kc: 0.80, days: 270, note: "FAO-56 cassava ปีแรก · รอบปลูกไทยทั่วไป ~9 เดือน" },
  vegetable: { label: "พืชผัก",               kc: 1.05, days: 75,  note: "FAO-56 small vegetables (ตัวแทนกลุ่มพืชผัก/พืชผักหลังนา)" },
  banana:    { label: "กล้วย",                kc: 1.10, days: 330, note: "FAO-56 banana, ใช้น้ำต่อเนื่องเกือบทั้งปี (ค่าเดียวกับต้นแบบ)" },
  fruit:     { label: "ไม้ผลรวม (ทุเรียน/มะม่วง/มะขาม ฯลฯ)", kc: 0.85, days: 365, note: "สวนผลไม้ผสม/ไม้ผลยืนต้น — ค่าประมาณเฉลี่ยรอบปี ทุเรียนช่วงติดผลอาจต้องการน้ำสูงกว่านี้" },
  oilpalm:   { label: "ปาล์มน้ำมัน",          kc: 0.90, days: 365, note: "ไม้ยืนต้น ทรงพุ่มปิดตลอดปี — ค่าประมาณจากวรรณกรรมปาล์มน้ำมันเขตร้อน" },
};

const SCENARIO_COLORS = ["#0284c7", "#f97316", "#7c3aed", "#16a34a", "#dc2626"];
const SAMPLE_EVERY_DAYS = 5;

function parseDateInput(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function toDateInputValue(date) {
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function todayISO() { return toDateInputValue(new Date()); }
function daysBetween(a, b) {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bb - aa) / 86400000);
}

// ── ค่าเฉลี่ยฝนรายเดือน (climatology) จากข้อมูลฝนรายวันจริงหลายปีของตำบล ──
// rainMonthly: { "YYYY-MM": มม.รวมเดือนนั้น } จาก useRainfall() — เฉลี่ยทุกปีที่มีข้อมูลของเดือนเดียวกัน
// (ต่างจากต้นแบบที่ hardcode ค่าเฉลี่ยภูมิอากาศคงที่ทั้งไฟล์ — ที่นี่คำนวณจากข้อมูลจริงของตำบลเอง)
// buildMonthlyClimatology ย้ายไปอยู่ที่ ../lib/climatology.js แล้ว (ใช้ร่วมกับ anomaly badge ในแท็บฝน) — ตัวแปรพฤติกรรม/ผลลัพธ์เหมือนเดิมทุกประการ

// ══ Water balance model (Level 2: หักฝนเฉลี่ยรายเดือน, ETc คงที่ตลอดฤดู) ══
// พอร์ตมาจาก simulateScenario ของต้นแบบตรงๆ ทั้งอัลกอริทึม — เปลี่ยนแค่รับ monthlyRainAvg เป็นพารามิเตอร์
// แทนการอ้างอิงค่าคงที่ระดับโมดูล
function simulateScenario(initialM3, cropAreas, monthlyRainAvg) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const startLabel = `${today.getDate()} ${CWP_TH_MON[today.getMonth() + 1]} (วันนี้)`;
  const series = [{ day: 0, label: startLabel, remaining: Math.round(initialM3) }];
  let remaining = initialM3;
  let depletedAt = null;
  const TOTAL_DAYS = 365;

  const plantDates = cropAreas.map(c => parseDateInput(c.plantDate || todayISO()));

  for (let day = 1; day <= TOTAL_DAYS; day++) {
    const calendarDate = new Date(today); calendarDate.setDate(calendarDate.getDate() + day - 1);
    const monthNum = calendarDate.getMonth() + 1;
    const dayOfMonth = calendarDate.getDate();
    const daysInThisMonth = new Date(calendarDate.getFullYear(), monthNum, 0).getDate();
    const rain_mm_month = monthlyRainAvg[monthNum] ?? 0;
    const rain_mm_day = rain_mm_month / daysInThisMonth;

    let dayETc = 0, dayActiveArea = 0;
    cropAreas.forEach(({ cropKey, rai }, idx) => {
      const crop = CROPS[cropKey];
      if (!crop || !rai) return;
      const daysSincePlant = daysBetween(plantDates[idx], calendarDate);
      if (daysSincePlant >= 0 && daysSincePlant < crop.days) {
        dayETc += crop.kc * ET0 * rai * RAI_TO_M2 / 1000; // ลบ.ม./วัน
        dayActiveArea += rai;
      }
    });

    const dayRain = rain_mm_day * dayActiveArea * RAI_TO_M2 / 1000;
    const effectiveDayRain = Math.min(dayRain, dayETc);
    const netNeed = Math.max(0, dayETc - effectiveDayRain);

    remaining -= netNeed;

    if (remaining <= 0 && depletedAt === null) {
      depletedAt = { monthNum, dayOfMonth, label: CWP_TH_MON[monthNum] };
      series.push({ day, label: `${dayOfMonth} ${CWP_TH_MON[monthNum]}`, remaining: 0 });
      break;
    }

    if (day % SAMPLE_EVERY_DAYS === 0 || day === TOTAL_DAYS) {
      series.push({ day, label: `${dayOfMonth} ${CWP_TH_MON[monthNum]}`, remaining: Math.round(remaining) });
    }
  }

  const totalUsed = initialM3 - Math.max(0, remaining);
  return {
    series,
    sufficient: depletedAt === null,
    depletedAt,
    totalUsed: Math.round(totalUsed),
    pctUsed: Math.round((totalUsed / initialM3) * 1000) / 10,
    finalRemaining: Math.max(0, Math.round(remaining)),
  };
}

function CropRow({ row, onChange, onRemove, theme }) {
  const { C, FONT } = theme;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
      <select value={row.cropKey} onChange={e => onChange({ ...row, cropKey: e.target.value })}
        style={{ flex: "2 1 160px", padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, fontFamily: FONT, fontSize: 13 }}>
        {Object.entries(CROPS).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
      </select>
      <input type="number" min="0" step="1" value={row.rai}
        onChange={e => onChange({ ...row, rai: parseFloat(e.target.value) || 0 })}
        style={{ flex: "1 1 60px", padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, fontFamily: FONT, fontSize: 13 }} />
      <span style={{ fontSize: 12, color: C.muted }}>ไร่</span>
      <span style={{ fontSize: 11, color: C.muted }}>ปลูกเมื่อ</span>
      <input type="date" value={row.plantDate}
        onChange={e => onChange({ ...row, plantDate: e.target.value })}
        style={{ flex: "1 1 130px", padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, fontFamily: FONT, fontSize: 12 }} />
      <button onClick={onRemove}
        style={{ border: "none", background: "none", color: "#dc2626", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>✕</button>
    </div>
  );
}

function ScenarioCard({ scenario, onChange, onRemove, color, theme }) {
  const { C } = theme;
  const addCrop = () => onChange({ ...scenario, crops: [...scenario.crops, { cropKey: "rice", rai: 5, plantDate: todayISO() }] });
  const updateCrop = (i, newRow) => {
    const crops = [...scenario.crops]; crops[i] = newRow;
    onChange({ ...scenario, crops });
  };
  const removeCrop = (i) => onChange({ ...scenario, crops: scenario.crops.filter((_, idx) => idx !== i) });

  return (
    <div style={{ background: C.card, border: `2px solid ${color}`, borderRadius: 10, padding: "12px 14px", flex: "1 1 320px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <input value={scenario.name} onChange={e => onChange({ ...scenario, name: e.target.value })}
          style={{ fontWeight: 700, fontSize: 14, color, border: "none", background: "none", fontFamily: theme.FONT, width: "70%" }} />
        <button onClick={onRemove} style={{ border: "none", background: "none", color: "#dc2626", cursor: "pointer", fontSize: 14 }}>ลบสถานการณ์</button>
      </div>
      {scenario.crops.map((row, i) => (
        <CropRow key={i} row={row} theme={theme} onChange={r => updateCrop(i, r)} onRemove={() => removeCrop(i)} />
      ))}
      <button onClick={addCrop}
        style={{ fontSize: 12, color: C.sky, border: `1px dashed ${C.sky}`, background: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", marginTop: 4 }}>
        + เพิ่มพืช
      </button>
    </div>
  );
}

export default function CropWaterPlanner({ sources, rainMonthly, theme }) {
  const { C, FONT } = theme;
  const monthlyRainAvg = useMemo(() => buildMonthlyClimatology(rainMonthly), [rainMonthly]);

  const [sourceId, setSourceId] = useState(sources[0]?.id);
  const source = sources.find(s => s.id === sourceId) ?? sources[0];
  const [customM3, setCustomM3] = useState(source?.m3 ?? 0);

  useEffect(() => { setCustomM3(source?.m3 ?? 0); }, [sourceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [scenarios, setScenarios] = useState([
    { id: 1, name: "สถานการณ์ 1", crops: [{ cropKey: "rice", rai: 5, plantDate: todayISO() }] },
  ]);
  const [nextScenarioNum, setNextScenarioNum] = useState(2);

  const results = useMemo(() =>
    scenarios.map(sc => ({ ...sc, result: simulateScenario(customM3, sc.crops, monthlyRainAvg) })),
    [scenarios, customM3, monthlyRainAvg]
  );

  const chartData = useMemo(() => {
    const seriesMaps = results.map(r => new Map(r.result.series.map(pt => [pt.day, pt])));
    const allDaysSet = new Set();
    results.forEach(r => r.result.series.forEach(pt => allDaysSet.add(pt.day)));
    const allDays = [...allDaysSet].sort((a, b) => a - b);

    return allDays.map(day => {
      const row = { day, label: "" };
      results.forEach((r, i) => {
        const pt = seriesMaps[i].get(day);
        if (pt && !row.label) row.label = pt.label;
        row[r.name] = pt ? pt.remaining : null;
      });
      return row;
    });
  }, [results]);

  const addScenario = () => {
    setScenarios(prev => [...prev, {
      id: Date.now(), name: `สถานการณ์ ${nextScenarioNum}`, crops: [{ cropKey: "rice", rai: 5, plantDate: todayISO() }],
    }]);
    setNextScenarioNum(n => n + 1);
  };

  if (!source) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 4, fontFamily: FONT }}>
        💧 คำนวณน้ำเพื่อการเพาะปลูก (what-if)
      </div>
      <p style={{ fontSize: 11, color: C.muted, marginTop: 0, marginBottom: 10, fontFamily: FONT }}>
        ⚠️ แบบจำลองประมาณการ — สมมติฐาน: <strong>ไม่มีน้ำเติมจากคลอง</strong> (worst-case),
        หักฝนด้วยค่าเฉลี่ยรายเดือนจากข้อมูลฝนจริงหลายปีของตำบล, คำนวณจาก <strong>วันนี้ ({new Date().toLocaleDateString("th-TH")})</strong> เป็นจุดเริ่มต้นเสมอ
        โดยแต่ละพืชนับอายุตาม <strong>"วันที่ปลูก"</strong> ที่ระบุไว้ (ถ้าปลูกมาก่อนหน้านี้แล้ว ระบบจะคิดว่าน้ำถูกใช้ไปแล้วบางส่วน),
        "น้ำหมด" = เหลือ 0%. ค่า Kc พืชเป็นค่าประมาณจาก FAO-56 และวรรณกรรมทั่วไป ไม่ได้ calibrate เฉพาะพื้นที่แม่นาเรือ
      </p>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>เลือกแหล่งน้ำ</label>
            <select value={sourceId} onChange={e => setSourceId(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontFamily: FONT, fontSize: 14, minWidth: 220 }}>
              {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>ปริมาณน้ำต้นทุน (ลบ.ม.) — แก้ไขได้</label>
            <input type="number" value={customM3} onChange={e => setCustomM3(parseFloat(e.target.value) || 0)}
              style={{ padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontFamily: FONT, fontSize: 14, width: 150 }} />
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            ความจุสูงสุด: {fmt(source.maxM3)} ลบ.ม.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        {scenarios.map((sc, i) => (
          <ScenarioCard key={sc.id} scenario={sc} theme={theme} color={SCENARIO_COLORS[i % SCENARIO_COLORS.length]}
            onChange={updated => setScenarios(prev => prev.map(s => s.id === sc.id ? updated : s))}
            onRemove={() => setScenarios(prev => prev.filter(s => s.id !== sc.id))} />
        ))}
      </div>
      <button onClick={addScenario}
        style={{ marginBottom: 20, fontSize: 13, padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.sky}`, background: "#e0f2fe", color: C.navy, cursor: "pointer" }}>
        + เพิ่มสถานการณ์
      </button>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 20, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.border}`, textAlign: "left" }}>
              <th style={{ padding: "6px 8px" }}>สถานการณ์</th>
              <th style={{ padding: "6px 8px" }}>น้ำพอไหม</th>
              <th style={{ padding: "6px 8px" }}>คาดว่าหมด</th>
              <th style={{ padding: "6px 8px" }}>ใช้น้ำรวมทั้งฤดู</th>
              <th style={{ padding: "6px 8px" }}>% ของน้ำต้นทุน</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "8px", fontWeight: 700, color: SCENARIO_COLORS[i % SCENARIO_COLORS.length] }}>{r.name}</td>
                <td style={{ padding: "8px" }}>
                  {r.result.sufficient
                    ? <span style={{ color: "#15803d", fontWeight: 700 }}>✅ พอ (เหลือ {fmt(r.result.finalRemaining)} ลบ.ม.)</span>
                    : <span style={{ color: "#dc2626", fontWeight: 700 }}>❌ ไม่พอ</span>}
                </td>
                <td style={{ padding: "8px" }}>
                  {r.result.sufficient ? "—" :
                    `ประมาณวันที่ ${r.result.depletedAt.dayOfMonth} ${r.result.depletedAt.label}`}
                </td>
                <td style={{ padding: "8px" }}>{fmt(r.result.totalUsed)} ลบ.ม.</td>
                <td style={{ padding: "8px" }}>{r.result.pctUsed}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 700, color: C.navy, marginBottom: 10, fontFamily: FONT }}>📈 แนวโน้มปริมาณน้ำคงเหลือ</div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: FONT }}
              interval="preserveStartEnd" minTickGap={25} angle={-35} textAnchor="end" height={55} />
            <YAxis tick={{ fontSize: 11, fontFamily: FONT }}
              label={{ value: "ลบ.ม.", angle: -90, position: "insideLeft", fontSize: 11, fill: C.muted }} />
            <Tooltip formatter={(v) => fmt(v) + " ลบ.ม."} contentStyle={{ fontFamily: FONT, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: FONT }} />
            <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="4 2" label={{ value: "น้ำหมด", fill: "#dc2626", fontSize: 10 }} />
            {results.map((r, i) => (
              <Line key={r.id} type="monotone" dataKey={r.name}
                stroke={SCENARIO_COLORS[i % SCENARIO_COLORS.length]} strokeWidth={2.5}
                dot={{ r: 3 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ fontSize: 11, color: C.muted, marginTop: 16, fontFamily: FONT }}>
        <strong>ค่า Kc / ระยะเวลาปลูกที่ใช้:</strong><br />
        {Object.entries(CROPS).map(([k, c]) => (
          <span key={k}>• {c.label}: Kc={c.kc}, {c.days} วัน ({c.note})<br /></span>
        ))}
      </div>
    </div>
  );
}
