import { STATUS_CONFIG, getStatus, fmt, trendArrowInfo } from "../lib/status";

export default function SourceCard({ src, theme, selected, onClick }) {
  const { C, FONT } = theme;

  if (src.role === "structure") {
    return (
      <div onClick={onClick} style={{
        background: C.card, border: `1.5px solid ${selected ? C.sky : C.border}`, borderRadius: 12,
        padding: "10px 14px", cursor: onClick ? "pointer" : "default",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.text, fontFamily: FONT }}>🚧 {src.name}</div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT }}>
            {src.type === "weir" ? "ฝาย" : src.type === "check_dam" ? "เช็คดำ" : src.type} · หมู่ {src.moo ?? "—"} {src.village ? `(${src.village})` : ""}
          </div>
        </div>
        <span style={{ fontSize: 10, color: C.muted, fontFamily: FONT }}>ไม่มีข้อมูล %</span>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[getStatus(src.pct)];
  const trend = trendArrowInfo(src.dW);

  return (
    <div onClick={onClick} style={{
      background: cfg.bg, border: `1.5px solid ${selected ? C.navy : cfg.border}`, borderRadius: 12,
      padding: "12px 14px", cursor: onClick ? "pointer" : "default",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.text, fontFamily: FONT }}>{src.name}</div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT }}>
            หมู่ {src.moo ?? "—"} {src.village ? `(${src.village})` : ""}
            {src.isolated && " · ☁ รับน้ำจากฝนเท่านั้น"}
          </div>
        </div>
        <span style={{ background: cfg.badge, color: cfg.badgeText, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999, fontFamily: FONT }}>
          {cfg.dot} {cfg.label}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: cfg.text, fontFamily: FONT }}>
          {src.pct != null ? `${src.pct}%` : "—"}
        </div>
        <div style={{ fontSize: 12, color: C.muted, fontFamily: FONT }}>
          {src.m3 != null ? `${fmt(src.m3)} / ${fmt(src.maxM3)} ลบ.ม.` : "ไม่มีข้อมูลระดับน้ำ"}
        </div>
      </div>
      <div style={{ background: "#e2e8f0", borderRadius: 999, height: 8, overflow: "hidden", marginTop: 6 }}>
        <div style={{ width: `${Math.min(100, src.pct ?? 0)}%`, height: "100%", background: cfg.badge, borderRadius: 999 }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 12, fontFamily: FONT }}>
        <span style={{ color: trend.color, fontWeight: 700 }}>{trend.icon} {trend.label}</span>
      </div>
    </div>
  );
}
