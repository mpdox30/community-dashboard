import { STATUS_CONFIG, getStatus } from "../lib/status";
import { IconAlertOctagon, IconAlertTriangle, IconAlertCircle, IconCheckCircle, IconHelpCircle } from "../lib/icons";

const STATUS_ICON = {
  critical: IconAlertOctagon,
  warning: IconAlertTriangle,
  medium: IconAlertCircle,
  safe: IconCheckCircle,
  unknown: IconHelpCircle,
};

// สรุปจำนวนแหล่งน้ำ (เฉพาะ role=storage) แยกตามสถานะ — เหมือนต้นฉบับ
export default function StatusSummary({ sources, theme }) {
  const { C, FONT } = theme;
  const storage = sources.filter(s => s.role === "storage");
  const counts = { critical: 0, warning: 0, medium: 0, safe: 0, unknown: 0 };
  storage.forEach(s => { counts[getStatus(s.pct)]++; });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px,1fr))", gap: 8, margin: "16px 0" }}>
      {Object.entries(STATUS_CONFIG).filter(([k]) => k !== "unknown" || counts.unknown > 0).map(([key, cfg]) => {
        const Icon = STATUS_ICON[key];
        return (
          <div key={key} style={{
            background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 12,
            padding: "10px 12px", textAlign: "center",
          }}>
            <div style={{ display: "flex", justifyContent: "center" }}><Icon size={22} color={cfg.text} /></div>
            <div style={{ fontSize: 22, fontWeight: 800, color: cfg.text, fontFamily: FONT }}>{counts[key]}</div>
            <div style={{ fontSize: 11, color: cfg.text, fontFamily: FONT }}>{cfg.label}</div>
          </div>
        );
      })}
    </div>
  );
}
