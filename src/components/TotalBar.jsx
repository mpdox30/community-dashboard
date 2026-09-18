import { useEffect, useRef, useState } from "react";
import { fmt, getStatus, STATUS_CONFIG } from "../lib/status";
import { IconDroplet } from "../lib/icons";

// นับเลข % ไล่ขึ้น/ลงแบบนุ่มๆ แทนการกระโดดเปลี่ยนค่าทันที (ease-out cubic) — ของตกแต่งล้วนๆ
// ไม่แตะ getStatus/STATUS_CONFIG หรือค่า totalPct จริงที่ใช้คำนวณสถานะแต่อย่างใด
function useCountUp(target, duration = 700) {
  const [display, setDisplay] = useState(target ?? 0);
  const fromRef = useRef(target ?? 0);
  useEffect(() => {
    if (target == null) return;
    const from = fromRef.current;
    const to = target;
    if (from === to) { setDisplay(to); return; }
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return target == null ? null : display;
}

export default function TotalBar({ snap, theme }) {
  const { C, FONT } = theme;
  const animatedPct = useCountUp(snap?.totalPct ?? null);
  if (!snap || snap.maxM3 === 0) return null;
  const cfg = STATUS_CONFIG[getStatus(snap.totalPct)];
  const barPct = animatedPct != null ? Math.round(animatedPct * 10) / 10 : (snap.totalPct ?? 0);
  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden" }}>
      {/* บลอบสีเบลอ (จากสีแบรนด์ของตำบล) ให้แผ่นกระจกด้านหน้ามีอะไรให้ "มองทะลุ" เห็นความโปร่งจริง */}
      <div style={{
        position: "absolute", width: 160, height: 160, borderRadius: "50%",
        left: -40, top: -60, background: `radial-gradient(circle, ${C.navy}, transparent 70%)`,
        opacity: 0.5, filter: "blur(6px)",
      }} />
      <div style={{
        position: "absolute", width: 160, height: 160, borderRadius: "50%",
        right: -50, bottom: -70, background: `radial-gradient(circle, ${C.teal}, transparent 70%)`,
        opacity: 0.45, filter: "blur(6px)",
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.65)",
        borderRadius: 16, padding: "16px 18px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.6)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 14, color: C.navy, fontFamily: FONT }}>
            <IconDroplet size={16} color={C.navy} />
            ปริมาณน้ำรวม ({snap.storageCount} แหล่งเก็บกัก)
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: cfg.text, fontFamily: FONT }}>
            {snap.totalPct != null ? `${barPct}%` : "—"}
          </div>
        </div>
        <div style={{ background: "rgba(226,232,240,0.8)", borderRadius: 999, height: 14, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, barPct)}%`, height: "100%", background: cfg.badge, borderRadius: 999, transition: "width 0.6s ease-out" }} />
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 6, fontFamily: FONT }}>
          {fmt(snap.totalM3)} / {fmt(snap.maxM3)} ลบ.ม.
          {snap.structureCount > 0 && ` · มีฝาย/เช็คดำอีก ${snap.structureCount} จุด (ไม่นับรวม %)`}
        </div>
      </div>
    </div>
  );
}
