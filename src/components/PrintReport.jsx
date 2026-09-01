import { fmt, fmtDate, getStatus, STATUS_CONFIG } from "../lib/status";

/* ─────────────────────────────────────────────
   รายงานสำหรับพิมพ์/PDF — ซ่อนบนหน้าจอ โชว์เฉพาะตอนพิมพ์
   (pitfall §6: ต้องใช้ @media print เท่านั้น, ไม่ใช้ display:none conditional
   เพราะจะทำให้ React ไม่ mount DOM ตอนพิมพ์)
───────────────────────────────────────────── */
export default function PrintReport({ sources, snap, tambon, theme }) {
  const { C, FONT } = theme;
  const storage = sources.filter(s => s.role === "storage");
  const structure = sources.filter(s => s.role === "structure");

  return (
    <div id="print-report" style={{ fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        {tambon?.logo_url && <img src={tambon.logo_url} style={{ height: 50, width: 50, borderRadius: "50%" }} alt="logo" />}
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>รายงานสถานการณ์น้ำ {tambon?.name_th}</div>
          <div style={{ fontSize: 12, color: C.muted }}>
            อ.{tambon?.amphoe_th} จ.{tambon?.province_th} · ข้อมูล ณ {fmtDate(snap?.date)}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
        <div><strong>ปริมาณน้ำรวม:</strong> {fmt(snap?.totalM3)} / {fmt(snap?.maxM3)} ลบ.ม. ({snap?.totalPct}%)</div>
        <div><strong>แหล่งเก็บกัก:</strong> {storage.length} แห่ง</div>
        <div><strong>ฝาย/เช็คดำ:</strong> {structure.length} จุด</div>
      </div>

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

      {structure.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 11, color: C.muted }}>
          🚧 ฝาย/เช็คดำ ({structure.length} จุด): {structure.map(s => s.name).join(", ")}
        </div>
      )}

      <img className="print-diagram" src={`${import.meta.env.BASE_URL}assets/water-network.png`} alt="ผังน้ำแม่นาเรือ" style={{ width: "100%", marginTop: 16 }} />

      <div style={{ marginTop: 10, fontSize: 9, color: C.muted, textAlign: "center" }}>
        พิมพ์จากระบบติดตามสถานการณ์น้ำ {tambon?.name_th} — {new Date().toLocaleDateString("th-TH")}
      </div>
    </div>
  );
}
