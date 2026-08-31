/* ─────────────────────────────────────────────
   สถานะระดับน้ำ — logic เดิมจาก water-dashboard.jsx
   ต้นฉบับ: critical<20% / warning<40% / medium<60% / else safe
   ห้ามแก้ threshold เหล่านี้ (ผ่านการ debug จริงมาแล้ว)
───────────────────────────────────────────── */
export function getStatus(pct) {
  if (pct === null || pct === undefined) return "unknown";
  if (pct < 20) return "critical";
  if (pct < 40) return "warning";
  if (pct < 60) return "medium";
  return "safe";
}

export const STATUS_CONFIG = {
  critical: { label: "วิกฤต",     bg: "#fef2f2", border: "#ef4444", text: "#b91c1c", badge: "#ef4444", badgeText: "#fff", dot: "🔴" },
  warning:  { label: "เฝ้าระวัง", bg: "#fff7ed", border: "#f97316", text: "#c2410c", badge: "#f97316", badgeText: "#fff", dot: "🟠" },
  medium:   { label: "ปานกลาง",   bg: "#fefce8", border: "#eab308", text: "#a16207", badge: "#eab308", badgeText: "#fff", dot: "🟡" },
  safe:     { label: "ปลอดภัย",   bg: "#f0fdf4", border: "#22c55e", text: "#15803d", badge: "#22c55e", badgeText: "#fff", dot: "🟢" },
  unknown:  { label: "ไม่มีข้อมูล", bg: "#f8fafc", border: "#cbd5e1", text: "#64748b", badge: "#94a3b8", badgeText: "#fff", dot: "⚪" },
};

// สำหรับ reliability badge บนแท็บความเสี่ยง (OLS R²)
export const REL_CONFIG = {
  "สูง":     { bg: "#f0fdf4", border: "#86efac", color: "#15803d", label: "ความเชื่อมั่นสูง (R² ≥ 0.90)" },
  "ปานกลาง": { bg: "#fffbeb", border: "#fcd34d", color: "#92400e", label: "ความเชื่อมั่นปานกลาง (R² ≥ 0.75)" },
  "ต่ำ":     { bg: "#fef2f2", border: "#fca5a5", color: "#b91c1c", label: "ความเชื่อมั่นต่ำ (R² < 0.75)" },
};

export function relFromR2(r2) {
  if (r2 === null || r2 === undefined) return null;
  if (r2 >= 0.9) return "สูง";
  if (r2 >= 0.75) return "ปานกลาง";
  return "ต่ำ";
}

export function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return Math.round(n).toLocaleString("th-TH");
}

// เกณฑ์ ±0.5%/สัปดาห์ ตรงกับต้นฉบับ (TrendArrow)
export function trendArrowInfo(dW) {
  if (dW === null || dW === undefined) return { icon: "—", label: "ไม่มีข้อมูล", color: "#94a3b8" };
  if (dW > 0.5) return { icon: "▲", label: `+${dW.toFixed(1)}%/สัปดาห์`, color: "#22c55e" };
  if (dW < -0.5) return { icon: "▼", label: `${dW.toFixed(1)}%/สัปดาห์`, color: "#ef4444" };
  return { icon: "—", label: "คงที่", color: "#94a3b8" };
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const TH_MON = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  const beYear = d.getFullYear() + 543;
  return `${d.getDate()} ${TH_MON[d.getMonth() + 1]} ${beYear}`;
}

/* ฝนรายวัน — 8 ระดับ ตรงกับ fn_rain_category() ใน Supabase (§5 ต้นฉบับ) */
export const RAIN_THRESHOLDS = [
  { max: 0,   level: 0, label: "ไม่มีฝน",    color: "#f1f5f9" },
  { max: 10,  level: 1, label: "ฝนเล็กน้อย", color: "#bae6fd" },
  { max: 20,  level: 2, label: "ฝนปานกลาง",  color: "#7dd3fc" },
  { max: 35,  level: 3, label: "ฝนปานกลาง",  color: "#38bdf8" },
  { max: 50,  level: 4, label: "ฝนหนัก",     color: "#0ea5e9" },
  { max: 70,  level: 5, label: "ฝนหนัก",     color: "#0284c7" },
  { max: 90,  level: 6, label: "ฝนหนัก",     color: "#0369a1" },
  { max: Infinity, level: 7, label: "ฝนหนักมาก", color: "#075985" },
];

export function getRainThreshold(mm) {
  if (mm === null || mm === undefined) return null;
  if (mm <= 0) return RAIN_THRESHOLDS[0];
  for (const t of RAIN_THRESHOLDS) if (mm <= t.max) return t;
  return RAIN_THRESHOLDS[RAIN_THRESHOLDS.length - 1];
}

export const FONT = "'Sarabun', 'Tahoma', sans-serif";
