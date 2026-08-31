/* ─────────────────────────────────────────────
   Theme tokens — โครงสร้างเดียวกับต้นฉบับ (FONT/C/base)
   แต่สี "แบรนด์" (navy/teal) ดึงจาก tambons.brand_primary_color /
   brand_secondary_color แทนการ hardcode เพื่อให้ใช้ซ้ำได้ทุกตำบล
   ส่วนสีสถานะ (แดง/ส้ม/เหลือง/เขียว) คงเดิมเสมอ — เป็น business logic
   ไม่ใช่ branding
───────────────────────────────────────────── */
export const FONT = "'Sarabun', 'Tahoma', sans-serif";

export function buildTheme(tambon) {
  const primary = tambon?.brand_primary_color || "#0c4a6e";
  const secondary = tambon?.brand_secondary_color || "#0369a1";
  const C = {
    navy: primary,
    teal: secondary,
    sky: "#0ea5e9",
    bg: "#f9f6ef",
    card: "#ffffff",
    border: "#eee3cc",
    text: "#0f172a",
    muted: "#64748b",
  };
  const base = {
    fontFamily: FONT,
    background: C.bg,
    minHeight: "100vh",
    color: C.text,
    fontSize: 15,
  };
  const BRAND_GRAD = `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
  return { C, base, BRAND_GRAD, FONT };
}
