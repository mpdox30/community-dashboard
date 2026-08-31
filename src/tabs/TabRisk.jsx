import { REL_CONFIG, fmtDate, getStatus, STATUS_CONFIG } from "../lib/status";

function ForecastRow({ src, theme }) {
  const { C, FONT } = theme;
  const cfg = STATUS_CONFIG[getStatus(src.pct)];
  const f = src.forecast;
  const rel = REL_CONFIG[f.rel];
  return (
    <tr style={{ borderBottom: "1px solid #e0f2fe" }}>
      <td style={{ padding: "8px 12px", fontWeight: 600 }}>{src.name}</td>
      <td style={{ padding: "8px 12px" }}>
        <span style={{ background: cfg.badge, color: cfg.badgeText, fontSize: 11, padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>{src.pct}%</span>
      </td>
      <td style={{ padding: "8px 12px", fontSize: 12 }}>
        <div>
          ถึง 20% ใน <strong>{f.central}</strong> วัน ({f.dateCentral ? fmtDate(f.dateCentral) : "—"})
        </div>
        <div style={{ color: C.muted, fontSize: 11 }}>
          ช่วง 90%: {f.opt ?? "—"}–{f.pess ?? "—"} วัน
        </div>
        {rel && (
          <span style={{ background: rel.bg, border: `1px solid ${rel.border}`, color: rel.color, fontSize: 10, padding: "1px 8px", borderRadius: 999, marginTop: 3, display: "inline-block" }}>
            {rel.label}
          </span>
        )}
      </td>
    </tr>
  );
}

export default function TabRisk({ storageSources, theme }) {
  const { C, FONT } = theme;
  const withForecast = storageSources.filter(s => s.forecast && s.forecast.central !== null);
  const rest = storageSources.filter(s => !s.forecast || s.forecast.central === null);

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 6, fontFamily: FONT }}>
        📐 ประมาณการถึงระดับวิกฤต (20%) — Regression OLS หลังจุดพีค
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, fontFamily: FONT }}>
        คำนวณจาก OLS regression ของข้อมูลหลังจุดสูงสุด (peak) ของแต่ละแหล่ง เทียบกับข้อมูลสะสมทั้งหมด
      </div>
      <div style={{ fontSize: 12, color: "#92400e", marginBottom: 12, background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "8px 12px", fontFamily: FONT }}>
        ⚠️ <strong>ข้อควรระวัง:</strong> ตัวเลขเป็น <em>ค่าประมาณ</em> สมมติให้อัตราการลดลงคงที่ ไม่รวมผลของฝน ความชื้น หรือการเปลี่ยนแปลงอุณหภูมิ ช่วง 90% กว้างแสดงว่าไม่ควรยึดตัวเลขกลางเพียงอย่างเดียว
      </div>

      <div style={{ background: C.card, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: FONT }}>
          <thead>
            <tr style={{ background: "#e0f2fe" }}>
              <th style={{ padding: "8px 12px", textAlign: "left", color: C.navy, fontWeight: 700 }}>แหล่งน้ำ</th>
              <th style={{ padding: "8px 12px", textAlign: "left", color: C.navy, fontWeight: 700 }}>% ปัจจุบัน</th>
              <th style={{ padding: "8px 12px", textAlign: "left", color: C.navy, fontWeight: 700 }}>ประมาณการ (ช่วงความไม่แน่นอน 90%)</th>
            </tr>
          </thead>
          <tbody>
            {[...withForecast].sort((a, b) => (a.forecast.central ?? 999) - (b.forecast.central ?? 999)).map(s => (
              <ForecastRow key={s.id} src={s} theme={theme} />
            ))}
            {rest.map(s => (
              <tr key={s.id} style={{ borderBottom: "1px solid #e0f2fe", opacity: 0.6 }}>
                <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: "8px 12px" }}>
                  <span style={{ background: STATUS_CONFIG[getStatus(s.pct)].badge, color: "#fff", fontSize: 11, padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>{s.pct ?? "—"}%</span>
                </td>
                <td style={{ padding: "8px 12px", color: C.muted, fontSize: 12 }}>
                  {s.dW > 0 ? "✅ น้ำเพิ่มขึ้น — ไม่ประมาณการ" :
                   s.forecastStatus === "insufficient_data" ? "— ข้อมูลหลังจุดพีคไม่พอ (ต้อง ≥3 จุด)" :
                   s.forecastStatus === "low_confidence" ? "— ความเชื่อมั่นต่ำเกินไป (R² < 0.70)" :
                   "— ไม่มีข้อมูลเพียงพอ"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: C.muted, display: "flex", gap: 16, flexWrap: "wrap", fontFamily: FONT }}>
        {Object.entries(REL_CONFIG).map(([k, v]) => (
          <span key={k} style={{ background: v.bg, border: `1px solid ${v.border}`, color: v.color, padding: "2px 8px", borderRadius: 999 }}>{v.label}</span>
        ))}
        <span>R² = ความสอดคล้องของแนวโน้ม (1.0 = สมบูรณ์แบบ) · n = จำนวนจุดข้อมูลหลังจุดพีค</span>
      </div>
    </div>
  );
}
