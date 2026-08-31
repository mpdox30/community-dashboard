import { useState } from "react";
import { fmt, getStatus, STATUS_CONFIG, trendArrowInfo } from "../lib/status";

export default function TabOverview({ sources, theme }) {
  const { C, FONT } = theme;
  const [sortBy, setSortBy] = useState("pct");
  const storage = sources.filter(s => s.role === "storage");

  const sorted = [...storage].sort((a, b) => {
    if (sortBy === "pct") return (a.pct ?? 999) - (b.pct ?? 999);
    if (sortBy === "name") return a.name.localeCompare(b.name, "th");
    if (sortBy === "moo") return (a.moo ?? 999) - (b.moo ?? 999);
    if (sortBy === "dW") return (a.dW ?? 0) - (b.dW ?? 0);
    return 0;
  });

  const cols = [
    { id: "name", label: "แหล่งน้ำ" },
    { id: "moo", label: "หมู่" },
    { id: "pct", label: "% ปัจจุบัน" },
    { id: "dW", label: "แนวโน้ม" },
  ];

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 10, fontFamily: FONT }}>
        🗺️ ภาพรวมแหล่งน้ำเก็บกัก ({storage.length} แห่ง)
      </div>
      <div style={{ background: C.card, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: FONT }}>
          <thead>
            <tr style={{ background: "#e0f2fe" }}>
              {cols.map(c => (
                <th key={c.id} onClick={() => setSortBy(c.id)} style={{
                  padding: "8px 12px", textAlign: "left", color: C.navy, fontWeight: 700, cursor: "pointer",
                }}>
                  {c.label} {sortBy === c.id && "▾"}
                </th>
              ))}
              <th style={{ padding: "8px 12px", textAlign: "left", color: C.navy, fontWeight: 700 }}>ลบ.ม.</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(s => {
              const cfg = STATUS_CONFIG[getStatus(s.pct)];
              const trend = trendArrowInfo(s.dW);
              return (
                <tr key={s.id} style={{ borderBottom: "1px solid #e0f2fe" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: "8px 12px" }}>{s.moo ?? "—"}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{ background: cfg.badge, color: cfg.badgeText, fontSize: 11, padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>
                      {s.pct != null ? `${s.pct}%` : "—"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", color: trend.color, fontWeight: 600 }}>{trend.icon} {trend.label}</td>
                  <td style={{ padding: "8px 12px", color: C.muted }}>{s.m3 != null ? `${fmt(s.m3)} / ${fmt(s.maxM3)}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
