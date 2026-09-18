import { fmtDate } from "../lib/status";
import { IconTrend } from "../lib/icons";

/* ─────────────────────────────────────────────
   ดึงประมาณการ "อีกกี่วันจะถึงจุดวิกฤต (20%)" ที่คำนวณไว้แล้วจาก v_source_risk_forecast
   (OLS regression เดิมที่ใช้อยู่ในแท็บความเสี่ยงของผู้ดูแล — ไม่ได้คำนวณซ้ำ/คิดใหม่ แค่ดึง
   ค่า s.forecast ที่ useSources() คำนวณให้แล้วมาโชว์เด่นขึ้นตรงหน้าแรก แทนที่จะฝังอยู่ใน
   แท็บผู้ดูแลเท่านั้น) แสดงเฉพาะแหล่งที่คาดว่าจะถึงวิกฤตภายใน HORIZON_DAYS วัน กันข้อมูลล้นจอ
───────────────────────────────────────────── */
const HORIZON_DAYS = 45;

export default function RiskForecastBanner({ sources, theme }) {
  const { FONT } = theme;
  const urgent = (sources ?? [])
    .filter(s => s.role === "storage" && s.forecast?.central != null && s.forecast.central <= HORIZON_DAYS)
    .sort((a, b) => a.forecast.central - b.forecast.central)
    .slice(0, 3);

  if (urgent.length === 0) return null;

  return (
    <div style={{ background: "#fff7ed", border: "1.5px solid #fdba74", borderRadius: 12, padding: "12px 16px", margin: "12px 0", fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#c2410c", fontSize: 14, marginBottom: 6 }}>
        <IconTrend size={18} color="#c2410c" />
        ประมาณการแนวโน้มถึงจุดวิกฤต
      </div>
      {urgent.map(s => (
        <div key={s.id} style={{ fontSize: 12.5, color: "#9a3412", marginTop: 2 }}>
          <strong>{s.name}</strong> — คาดว่าจะถึงจุดวิกฤต (20%) ใน <strong>~{s.forecast.central} วัน</strong>
          {s.forecast.dateCentral ? ` (${fmtDate(s.forecast.dateCentral)})` : ""}
        </div>
      ))}
      <div style={{ fontSize: 10.5, color: "#c2733f", marginTop: 6 }}>
        * ค่าประมาณจาก regression แนวโน้มย้อนหลัง ดูรายละเอียดและช่วงความไม่แน่นอนเต็มรูปแบบได้ที่แท็บ "ความเสี่ยง"
      </div>
    </div>
  );
}
