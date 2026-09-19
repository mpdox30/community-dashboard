import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot, ResponsiveContainer } from "recharts";
import { STATUS_CONFIG, getStatus, fmt, fmtDate, trendArrowInfo } from "../lib/status";

/* ─────────────────────────────────────────────
   การ์ดรายละเอียดแหล่งน้ำ — เปิดเมื่อแตะ/กดเลือกแหล่งน้ำบนผังน้ำหรือแผนที่
   ดีไซน์อ้างอิงจากการ์ดรายละเอียดของต้นแบบตำบลนครป่าหมาก (ภาพตัวอย่างที่ผู้ใช้ส่งมา)
   ใช้ร่วมกันทั้งแท็บ "แผนที่" และ "ผังน้ำ" ใน VillagerView (การ์ดเดียว ไม่แยกโค้ด)

   หมายเหตุ: ช่องรูปภาพเว้นไว้ก่อนตามที่ผู้ใช้ระบุ ("ยกเว้นรูป ให้เว้นไว้ก่อน
   เดี๋ยวจะส่งลิ๊งค์ภาพให้ทีหลัง") — ใช้ placeholder เดียวกับดีไซน์ของต้นแบบ
───────────────────────────────────────────── */
export default function SourceDetailCard({ source, theme, history, connectionLabel, onClose, histDate }) {
  const { C, FONT } = theme;
  if (!source) return null;

  const isStorage = source.role === "storage";
  const cfg = isStorage ? STATUS_CONFIG[getStatus(source.pct)] : null;
  const trend = isStorage ? trendArrowInfo(source.dW) : null;
  const hasHistory = isStorage && history && history.some(h => h.pct != null) && history.length > 1;
  // จุดบนกราฟที่ตรงกับวันที่เลือกใน TimelineScrubber (ถ้ากำลังดูข้อมูลย้อนหลังอยู่)
  const histPoint = histDate && history ? history.find(h => h.iso === histDate) : null;

  return (
    <div style={{
      marginTop: 12, background: C.card, border: `1.5px solid ${isStorage ? cfg.border : C.border}`,
      borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 14px rgba(0,0,0,0.12)", fontFamily: FONT,
    }}>
      {/* ── ช่องรูปภาพ (เว้นไว้ก่อน) ── */}
      <div style={{
        height: 110, background: "#f1f5f9", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 4, color: "#94a3b8", position: "relative",
      }}>
        <span style={{ fontSize: 24 }}>📷</span>
        <span style={{ fontSize: 11 }}>ยังไม่มีรูปภาพ</span>
        <button onClick={onClose} title="ปิด" style={{
          position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%",
          border: "none", background: "rgba(15,23,42,0.55)", color: "#fff", cursor: "pointer", fontSize: 14, lineHeight: 1,
        }}>✕</button>
      </div>

      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{source.name}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              หมู่ {source.moo ?? "—"} {source.village ? `(${source.village})` : ""}
              {source.isolated && " · ☁ รับน้ำจากฝนเท่านั้น"}
            </div>
          </div>
          {isStorage && (
            <span style={{ background: cfg.badge, color: cfg.badgeText, fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 999, whiteSpace: "nowrap" }}>
              {cfg.dot} {cfg.label} {source.pct != null ? `· ${source.pct}%` : ""}
            </span>
          )}
        </div>

        {connectionLabel && (
          <div style={{ display: "inline-block", marginTop: 8, fontSize: 11, color: "#0369a1", background: "#e0f2fe", border: "1px solid #bae6fd", borderRadius: 999, padding: "2px 10px" }}>
            🔗 เชื่อมต่อกับ {connectionLabel}
          </div>
        )}

        {!isStorage ? (
          <div style={{ marginTop: 10, fontSize: 12, color: "#78716c" }}>
            🚧 {source.type === "weir" ? "ฝาย" : source.type === "check_dam" ? "เช็คดำ" : "โครงสร้าง"} — ไม่มีการติดตามปริมาณน้ำ
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, color: C.muted }}>ปริมาตรน้ำ</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>
                  {source.m3 != null ? `${fmt(source.m3)} / ${fmt(source.maxM3)} ลบ.ม.` : "ไม่มีข้อมูล"}
                </div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, color: C.muted }}>แนวโน้ม/สัปดาห์</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: trend.color }}>{trend.icon} {trend.label}</div>
              </div>
            </div>

            {hasHistory ? (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span>📈 ระดับน้ำย้อนหลัง (%)</span>
                  {histDate && (
                    <span style={{ color: "#c2410c", fontWeight: 700 }}>
                      · 📍 กำลังดู {fmtDate(histDate)}{histPoint?.pct != null ? ` (${histPoint.pct}%)` : ""}
                    </span>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={history} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="iso" tickFormatter={fmtDate} fontSize={9} minTickGap={26} />
                    <YAxis domain={[0, (dataMax) => Math.max(100, Math.ceil(dataMax / 10) * 10)]} fontSize={10} unit="%" />
                    <Tooltip labelFormatter={fmtDate} formatter={v => [`${v}%`, "ระดับน้ำ"]} contentStyle={{ fontFamily: FONT, fontSize: 11 }} />
                    <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "เต็มความจุ", position: "insideTopRight", fontSize: 9, fill: "#16a34a" }} />
                    <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "วิกฤต", position: "insideBottomRight", fontSize: 9, fill: "#b91c1c" }} />
                    {histDate && (
                      <ReferenceLine x={histDate} stroke="#c2410c" strokeDasharray="3 3"
                        label={{ value: "วันที่เลือก", position: "top", fontSize: 9, fill: "#c2410c" }} />
                    )}
                    <Line type="monotone" dataKey="pct" stroke={C.navy} strokeWidth={2} dot={false} connectNulls />
                    {histDate && histPoint?.pct != null && (
                      <ReferenceDot x={histDate} y={histPoint.pct} r={5} fill="#c2410c" stroke="#fff" strokeWidth={1.5} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ marginTop: 12, fontSize: 11, color: C.muted, textAlign: "center", padding: "10px 0" }}>
                ยังไม่มีข้อมูลย้อนหลังเพียงพอสำหรับกราฟ
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
