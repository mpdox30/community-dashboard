import { fmt, getStatus, STATUS_CONFIG } from "../lib/status";

export default function TotalBar({ snap, theme }) {
  const { C, FONT } = theme;
  if (!snap || snap.maxM3 === 0) return null;
  const cfg = STATUS_CONFIG[getStatus(snap.totalPct)];
  return (
    <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, fontFamily: FONT }}>
          💧 ปริมาณน้ำรวม ({snap.storageCount} แหล่งเก็บกัก)
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: cfg.text, fontFamily: FONT }}>
          {snap.totalPct != null ? `${snap.totalPct}%` : "—"}
        </div>
      </div>
      <div style={{ background: "#e2e8f0", borderRadius: 999, height: 14, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, snap.totalPct ?? 0)}%`, height: "100%", background: cfg.badge, borderRadius: 999 }} />
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 6, fontFamily: FONT }}>
        {fmt(snap.totalM3)} / {fmt(snap.maxM3)} ลบ.ม.
        {snap.structureCount > 0 && ` · มีฝาย/เช็คดำอีก ${snap.structureCount} จุด (ไม่นับรวม %)`}
      </div>
    </div>
  );
}
