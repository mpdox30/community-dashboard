import { useMemo, useState, useEffect } from "react";
import { fmtDate } from "../lib/status";
import { IconTrend } from "../lib/icons";

/* ─────────────────────────────────────────────
   สไลเดอร์ย้อนดูสถานะแผนที่/สรุป ณ วันที่ในอดีต — ใช้ข้อมูล ts (ระดับน้ำรายวัน %ต่อแหล่ง)
   ที่โหลดมาแล้วสำหรับกราฟแนวโน้มอยู่แล้ว ไม่ได้ยิง query เพิ่ม
   ค่าเริ่มต้น = "ล่าสุด" (live) เหมือนเดิมทุกประการ ต่อเมื่อผู้ใช้ลากสไลเดอร์เท่านั้นจึงจะ
   สลับไปแสดงข้อมูลย้อนหลัง (ไม่กระทบพฤติกรรมเดิมของใครที่ไม่แตะสไลเดอร์เลย)
───────────────────────────────────────────── */
export default function TimelineScrubber({ ts, onChange, theme }) {
  const { C, FONT } = theme;
  const dates = useMemo(() => (ts ?? []).map(r => r.iso), [ts]);
  const [idx, setIdx] = useState(Math.max(0, dates.length - 1));

  useEffect(() => { setIdx(Math.max(0, dates.length - 1)); }, [dates.length]);

  if (dates.length < 2) return null;

  const isLive = idx >= dates.length - 1;
  const selectedIso = dates[idx];

  const handle = (e) => {
    const v = Number(e.target.value);
    setIdx(v);
    onChange(v >= dates.length - 1 ? null : dates[v]);
  };

  return (
    <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", marginBottom: 10, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <IconTrend size={15} color={C.navy} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.navy }}>ดูย้อนหลัง:</span>
        <span style={{ fontSize: 12.5, color: isLive ? "#15803d" : "#c2410c", fontWeight: 700 }}>
          {isLive ? "ล่าสุด (วันนี้)" : fmtDate(selectedIso)}
        </span>
        {!isLive && (
          <button onClick={() => { setIdx(dates.length - 1); onChange(null); }} style={{
            marginLeft: "auto", fontSize: 11, border: "1px solid #cbd5e1", background: "#fff",
            borderRadius: 999, padding: "2px 10px", cursor: "pointer", fontFamily: FONT, color: C.muted,
          }}>กลับไปล่าสุด</button>
        )}
      </div>
      <input type="range" min={0} max={dates.length - 1} value={idx} onChange={handle}
        style={{ width: "100%", accentColor: C.navy }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 2 }}>
        <span>{fmtDate(dates[0])}</span>
        <span>{fmtDate(dates[dates.length - 1])}</span>
      </div>
    </div>
  );
}
