import { fmt, fmtDate, getStatus, STATUS_CONFIG, trendArrowInfo } from "../lib/status";

/* ─────────────────────────────────────────────
   รายงานสำหรับพิมพ์/PDF — ซ่อนบนหน้าจอ โชว์เฉพาะตอนพิมพ์
   (pitfall §6: ต้องใช้ @media print เท่านั้น, ไม่ใช้ display:none conditional
   เพราะจะทำให้ React ไม่ mount DOM ตอนพิมพ์)

   เวอร์ชันนี้เติมส่วนที่ขาดเทียบกับรายงานของต้นแบบ (GAP_ANALYSIS §2.1):
   การ์ด KPI 4 ช่อง, หลอด progress รวมแบบมีตัวเลข% ทับ, การ์ดนับจำนวนแหล่งตามสถานะ 4 สี,
   กล่องเตือนแยกรายชื่อแหล่งวิกฤต/เฝ้าระวังพร้อมอัตราการลด, คำอธิบายสัญลักษณ์ผังน้ำ,
   ท้ายกระดาษโลโก้ 2 หน่วยงาน (สสน./อบต. — ดึงจากไฟล์ต้นแบบจริง)
───────────────────────────────────────────── */
export default function PrintReport({ sources, snap, tambon, theme }) {
  const { C, FONT } = theme;
  // แสดงเฉพาะแหล่งเก็บกัก — ฝาย/เช็คดำไม่มีการติดตาม % จึงไม่แสดงในรายงาน
  // (สอดคล้องกับแท็บภาพรวมและผังน้ำที่ตัดส่วนนี้ออกไปแล้ว)
  const storage = sources.filter(s => s.role === "storage");

  const counts = { critical: 0, warning: 0, medium: 0, safe: 0, unknown: 0 };
  storage.forEach(s => { counts[getStatus(s.pct)]++; });

  const criticalSources = storage.filter(s => getStatus(s.pct) === "critical").sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0));
  const warningSources = storage.filter(s => getStatus(s.pct) === "warning").sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0));

  const kpis = [
    { icon: "💧", label: "ปริมาณน้ำรวม", val: `${fmt(snap?.totalM3)} ลบ.ม.`, sub: `${snap?.totalPct ?? "—"}% ของความจุรวม` },
    { icon: "🏞️", label: "แหล่งเก็บกักทั้งหมด", val: `${storage.length} แห่ง`, sub: snap?.structureCount > 0 ? `+ ฝาย/เช็คดำ ${snap.structureCount} จุด` : "" },
    { icon: "🚨", label: "วิกฤต + เฝ้าระวัง", val: `${counts.critical + counts.warning} แห่ง`, sub: `วิกฤต ${counts.critical} · เฝ้าระวัง ${counts.warning}`, warn: counts.critical + counts.warning > 0 },
    { icon: "📅", label: "ข้อมูล ณ", val: fmtDate(snap?.date), sub: "" },
  ];

  return (
    <div id="print-report" style={{ fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, borderBottom: `3px solid ${C.navy}`, paddingBottom: 10 }}>
        {tambon?.logo_url && <img src={tambon.logo_url} style={{ height: 50, width: 50, borderRadius: "50%" }} alt="logo" />}
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>รายงานสถานการณ์น้ำ {tambon?.name_th}</div>
          <div style={{ fontSize: 12, color: C.muted }}>
            อ.{tambon?.amphoe_th} จ.{tambon?.province_th} · ข้อมูล ณ {fmtDate(snap?.date)}
          </div>
        </div>
      </div>

      {/* ── KPI 4 ช่อง ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            border: `2px solid ${k.warn ? "#ef4444" : C.navy}`, borderRadius: 8, padding: "8px 10px",
            background: k.warn ? "#fef2f2" : "#f0f9ff",
          }}>
            <div style={{ fontSize: 8, color: C.muted, marginBottom: 2 }}>{k.icon} {k.label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: k.warn ? "#b91c1c" : C.navy }}>{k.val}</div>
            {k.sub && <div style={{ fontSize: 8, color: C.muted }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── หลอด progress รวม พร้อมตัวเลข% ทับ ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>ระดับน้ำรวมของตำบล</div>
        <div style={{ background: "#e0f2fe", borderRadius: 999, height: 16, overflow: "hidden", position: "relative" }}>
          <div style={{
            width: `${Math.min(100, snap?.totalPct ?? 0)}%`, height: "100%",
            background: STATUS_CONFIG[getStatus(snap?.totalPct)].badge, borderRadius: 999,
          }} />
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: C.navy,
          }}>{snap?.totalPct != null ? `${snap.totalPct}%` : "—"}</div>
        </div>
      </div>

      {/* ── การ์ดนับจำนวนแหล่งตามสถานะ 4 สี ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
        {Object.entries(STATUS_CONFIG).filter(([k]) => k !== "unknown" || counts.unknown > 0).map(([key, cfg]) => (
          <div key={key} style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 14 }}>{cfg.dot}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: cfg.text }}>{counts[key]}</div>
            <div style={{ fontSize: 9, color: cfg.text }}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* ── กล่องเตือนแหล่งวิกฤต/เฝ้าระวัง พร้อมอัตราการลด ── */}
      {(criticalSources.length > 0 || warningSources.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: criticalSources.length > 0 && warningSources.length > 0 ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 16 }}>
          {criticalSources.length > 0 && (
            <div style={{ background: "#fef2f2", border: "1.5px solid #ef4444", borderRadius: 8, padding: 10 }}>
              <div style={{ fontWeight: 700, color: "#b91c1c", marginBottom: 6, fontSize: 11 }}>🚨 วิกฤต — ต่ำกว่า 20%</div>
              {criticalSources.map(s => {
                const tr = trendArrowInfo(s.dW);
                return (
                  <div key={s.id} style={{ fontSize: 10, color: "#b91c1c", borderBottom: "1px solid #fecaca", padding: "3px 0" }}>
                    {s.name} — เหลือ {s.pct ?? "—"}% · {tr.icon} {tr.label}
                  </div>
                );
              })}
            </div>
          )}
          {warningSources.length > 0 && (
            <div style={{ background: "#fff7ed", border: "1.5px solid #f97316", borderRadius: 8, padding: 10 }}>
              <div style={{ fontWeight: 700, color: "#c2410c", marginBottom: 6, fontSize: 11 }}>⚠️ เฝ้าระวัง — 20–40%</div>
              {warningSources.map(s => {
                const tr = trendArrowInfo(s.dW);
                return (
                  <div key={s.id} style={{ fontSize: 10, color: "#c2410c", borderBottom: "1px solid #fed7aa", padding: "3px 0" }}>
                    {s.name} — เหลือ {s.pct ?? "—"}% · {tr.icon} {tr.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ background: "#e0f2fe" }}>
            <th style={{ textAlign: "left", padding: 4, border: "1px solid #cbd5e1" }}>แหล่งน้ำ</th>
            <th style={{ textAlign: "left", padding: 4, border: "1px solid #cbd5e1" }}>หมู่</th>
            <th style={{ textAlign: "right", padding: 4, border: "1px solid #cbd5e1" }}>%</th>
            <th style={{ textAlign: "right", padding: 4, border: "1px solid #cbd5e1" }}>ลบ.ม.</th>
            <th style={{ textAlign: "left", padding: 4, border: "1px solid #cbd5e1" }}>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {[...storage].sort((a, b) => (a.pct ?? 999) - (b.pct ?? 999)).map(s => {
            const cfg = STATUS_CONFIG[getStatus(s.pct)];
            return (
              <tr key={s.id}>
                <td style={{ padding: 4, border: "1px solid #e2e8f0" }}>{s.name}</td>
                <td style={{ padding: 4, border: "1px solid #e2e8f0" }}>{s.moo ?? "—"}</td>
                <td style={{ padding: 4, border: "1px solid #e2e8f0", textAlign: "right" }}>{s.pct ?? "—"}</td>
                <td style={{ padding: 4, border: "1px solid #e2e8f0", textAlign: "right" }}>{fmt(s.m3)}</td>
                <td style={{ padding: 4, border: "1px solid #e2e8f0", color: cfg.text }}>{cfg.dot} {cfg.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <img className="print-diagram" src="/assets/water-network.png" alt={`ผังน้ำ${tambon?.name_th ?? ""}`} style={{ width: "100%", marginTop: 16 }} />

      {/* ── คำอธิบายสัญลักษณ์ผังน้ำ ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 9, color: C.muted, marginTop: 6 }}>
        <span style={{ fontWeight: 700 }}>คำอธิบายสัญลักษณ์:</span>
        {Object.values(STATUS_CONFIG).filter(cfg => cfg.label !== "ไม่มีข้อมูล").map(cfg => (
          <span key={cfg.label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 9, height: 9, background: cfg.badge, display: "inline-block", borderRadius: 2 }} />{cfg.dot} {cfg.label}
          </span>
        ))}
      </div>

      {/* ── ท้ายกระดาษ: โลโก้ 2 หน่วยงาน ──
          ฝั่งซ้าย (สสน./HII) เป็นโลโก้สถาบันกลางที่ใช้ร่วมกันทุกตำบลในระบบนี้ — เก็บเป็น static asset
          ฝั่งขวาต้องเป็นโลโก้ อบต. ของ "ตำบลนั้นๆ" ไม่ใช่ hardcode ของนครป่าหมาก — ใช้ tambon.logo_url
          (ต่อตำบล, ตั้งค่าได้จาก Supabase โดยไม่ต้อง deploy ใหม่) ไม่โชว์ถ้ายังไม่ได้ตั้งค่าให้ตำบลนั้น */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20, paddingTop: 10, borderTop: "1px solid #e0f2fe" }}>
        <img src="/assets/logo_hii.png" alt="สสน." style={{ height: 36, width: 36, borderRadius: "50%", objectFit: "cover" }} />
        <div style={{ textAlign: "center", fontSize: 9, color: C.muted }}>
          <div>สถาบันสารสนเทศทรัพยากรน้ำ (องค์การมหาชน)</div>
          <div>ร่วมกับ องค์การบริหารส่วนตำบล{tambon?.name_th?.replace("ตำบล", "")} อ.{tambon?.amphoe_th} จ.{tambon?.province_th}</div>
        </div>
        {tambon?.logo_url && <img src={tambon.logo_url} alt={tambon.name_th} style={{ height: 36, width: 36, borderRadius: "50%", objectFit: "cover" }} />}
      </div>

      <div style={{ marginTop: 6, fontSize: 9, color: C.muted, textAlign: "center" }}>
        พิมพ์จากระบบติดตามสถานการณ์น้ำ {tambon?.name_th} — {new Date().toLocaleDateString("th-TH")}
      </div>
    </div>
  );
}
