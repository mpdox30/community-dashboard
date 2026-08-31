import { STATUS_CONFIG, getStatus } from "../lib/status";

export default function AlertBanner({ sources, theme }) {
  const { FONT } = theme;
  const critical = sources.filter(s => s.role === "storage" && getStatus(s.pct) === "critical");
  if (critical.length === 0) return null;
  const cfg = STATUS_CONFIG.critical;
  return (
    <div style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 12, padding: "12px 16px", margin: "12px 0", fontFamily: FONT }}>
      <div style={{ fontWeight: 700, color: cfg.text, fontSize: 14 }}>
        🚨 แหล่งน้ำวิกฤต {critical.length} แห่ง (ต่ำกว่า 20%)
      </div>
      <div style={{ fontSize: 12, color: cfg.text, marginTop: 4 }}>
        {critical.map(s => s.name).join(", ")}
      </div>
    </div>
  );
}
