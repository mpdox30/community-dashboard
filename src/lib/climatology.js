/* ─────────────────────────────────────────────
   ค่าเฉลี่ยฝนรายเดือนตามภูมิอากาศ (climatology) — ย้ายมาจาก CropWaterPlanner.jsx เดิม
   (ฟังก์ชัน buildMonthlyClimatology) โดยไม่แก้ไข algorithm ใดๆ เพื่อให้ใช้ร่วมกันได้ทั้ง
   ตัวจำลองสมดุลน้ำ (CropWaterPlanner) และตัวตรวจจับฝนผิดปกติ (anomaly badge ใน TabRainfall)
   — คำนวณค่าเฉลี่ยรายเดือน (เดือน 1-12) จากข้อมูลฝนรายเดือนหลายปีจริง
───────────────────────────────────────────── */
export function buildMonthlyClimatology(rainMonthly) {
  const sums = Array(13).fill(0);
  const counts = Array(13).fill(0);
  Object.entries(rainMonthly ?? {}).forEach(([ym, mm]) => {
    const month = parseInt(ym.slice(5, 7), 10);
    if (month >= 1 && month <= 12 && typeof mm === "number") {
      sums[month] += mm;
      counts[month] += 1;
    }
  });
  const avg = {};
  for (let m = 1; m <= 12; m++) avg[m] = counts[m] > 0 ? sums[m] / counts[m] : 0;
  return avg;
}
