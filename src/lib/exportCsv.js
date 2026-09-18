/* ─────────────────────────────────────────────
   ส่งออกข้อมูลตารางเป็นไฟล์ CSV — ดาวน์โหลดฝั่ง client ล้วนๆ ไม่ยิง request ใดๆ เพิ่ม
   ใช้ร่วมกันได้ทุกแท็บที่มีข้อมูลย้อนหลังเป็นตาราง (แนวโน้มระดับน้ำ / ฝนรายวัน ฯลฯ)
───────────────────────────────────────────── */
function csvEscape(val) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportCsv(filename, columns, rows) {
  const header = columns.map(c => csvEscape(c.label)).join(",");
  const body = (rows ?? []).map(row =>
    columns.map(c => csvEscape(typeof c.value === "function" ? c.value(row) : row[c.key])).join(",")
  ).join("\n");
  // เติม BOM (﻿) กันปัญหาภาษาไทยเพี้ยนตอนเปิดด้วย Excel บน Windows
  const csv = "﻿" + header + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
