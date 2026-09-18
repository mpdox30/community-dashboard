import { fmtDate } from "../lib/status";
import { IconAlertCircle } from "../lib/icons";

/* ─────────────────────────────────────────────
   ตรวจจับแหล่งน้ำ/ข้อมูลฝนที่ "ค้าง" ไม่มีการอัปเดตข้อมูลใหม่มาหลายวัน (กรณีที่เคยเจอมาก่อน
   คือสถานีโทรมาตรค้างหลายวันโดยไม่มีใครสังเกตเห็น) — ใช้ข้อมูลที่มีอยู่แล้วทั้งหมด
   (sources[].currentDate จาก v_source_risk_forecast, rainDaily ล่าสุด) ไม่ต้อง query เพิ่ม
   เกณฑ์ ≥3 วัน = ค้าง (ยึดตามรอบอัปเดตโทรมาตร/กรอกข้อมูลที่ควรมาทุกวัน) — เฉพาะฝั่งผู้ดูแล
───────────────────────────────────────────── */
const STALE_DAYS = 3;

function daysSince(dateStr) {
  if (!dateStr) return null;
  const nowBangkok = new Date(Date.now() + 7 * 3600 * 1000);
  const todayIso = nowBangkok.toISOString().slice(0, 10);
  const d1 = new Date(todayIso + "T00:00:00");
  const d2 = new Date(dateStr + "T00:00:00");
  return Math.round((d1 - d2) / 86400000);
}

export default function DataHealthPanel({ sources, rainDaily, theme }) {
  const { FONT } = theme;
  const storage = (sources ?? []).filter(s => s.role === "storage");
  const staleSources = storage
    .map(s => ({ ...s, staleDays: daysSince(s.currentDate) }))
    .filter(s => s.staleDays != null && s.staleDays >= STALE_DAYS)
    .sort((a, b) => b.staleDays - a.staleDays);

  const lastRainIso = rainDaily && rainDaily.length ? rainDaily[rainDaily.length - 1].iso : null;
  const rainStaleDays = daysSince(lastRainIso);
  const rainStale = rainStaleDays != null && rainStaleDays >= STALE_DAYS;

  if (staleSources.length === 0 && !rainStale) return null;

  return (
    <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#475569", fontSize: 13, marginBottom: 6 }}>
        <IconAlertCircle size={17} color="#475569" />
        ตรวจสุขภาพข้อมูล — พบข้อมูลที่ยังไม่อัปเดต
      </div>
      {staleSources.map(s => (
        <div key={s.id} style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          • <strong>{s.name}</strong> — ไม่มีข้อมูลใหม่มา {s.staleDays} วันแล้ว (ล่าสุด {fmtDate(s.currentDate)})
        </div>
      ))}
      {rainStale && (
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          • <strong>ข้อมูลฝนระดับตำบล</strong> — ไม่มีข้อมูลใหม่มา {rainStaleDays} วันแล้ว (ล่าสุด {fmtDate(lastRainIso)})
        </div>
      )}
    </div>
  );
}
