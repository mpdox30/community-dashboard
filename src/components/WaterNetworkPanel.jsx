import { useState, useMemo } from "react";
import SourceCard from "./SourceCard";
import WaterFlowDiagramAuto from "./WaterFlowDiagramAuto";
import SourceDetailCard from "./SourceDetailCard";

/* ─────────────────────────────────────────────
   ผังน้ำ — ใช้ไฟล์ Mae_Na_Rua_water_diagram.svg ที่ผู้ใช้จัดทำขึ้น
   พร้อมกล่องสีทับตำแหน่งแหล่งน้ำ (SVG_NODE_BOXES ใน WaterFlowDiagram.jsx)
   วัดพิกัดตรงจาก SVG source และตรวจสอบไขว้กับไฟล์ "ชี้เป้าแหล่งน้ำ"
   ที่ผู้ใช้วาดเส้นสีแดงกำกับไว้แล้ว — ครบทั้ง 8 แหล่งเก็บกัก
───────────────────────────────────────────── */
export default function WaterNetworkPanel({ sources, tambonId, theme, selectedId, onSelect, telemetryByCode, selectedSource, selectedHistory, connectionLabel, onCloseDetail }) {
  const { C, FONT } = theme;
  const [filterMoo, setFilterMoo] = useState("all");

  // แสดงเฉพาะแหล่งเก็บกัก (role=storage) — ฝาย/เช็คดำไม่มีข้อมูล % จึงไม่แสดงในรายการนี้
  const storage = useMemo(() => sources.filter(s => s.role === "storage"), [sources]);

  const moos = useMemo(() => {
    const set = new Set(storage.map(s => s.moo).filter(Boolean));
    return Array.from(set).sort((a, b) => a - b);
  }, [storage]);

  const filtered = filterMoo === "all" ? storage : storage.filter(s => s.moo === filterMoo);

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <WaterFlowDiagramAuto tambonId={tambonId} sources={sources} theme={theme} selectedId={selectedId} onSelect={onSelect} telemetryByCode={telemetryByCode} />
        <div style={{ padding: "8px 2px", fontSize: 11, color: C.muted, fontFamily: FONT }}>
          กล่องสี % ทับตำแหน่งแหล่งเก็บกักบนผังน้ำ — กดเพื่อดูรายละเอียด (ฝาย/เช็คดำไม่แสดง % เนื่องจากไม่มีการติดตาม)
        </div>
      </div>

      {/* การ์ดรายละเอียดแหล่งน้ำ — อยู่ใต้ผังน้ำทันที ก่อนรายการการ์ดทั้งหมดด้านล่าง */}
      {selectedSource && (
        <div style={{ marginBottom: 14 }}>
          <SourceDetailCard
            source={selectedSource}
            theme={theme}
            history={selectedHistory}
            connectionLabel={connectionLabel}
            onClose={onCloseDetail}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: C.muted, fontFamily: FONT }}>กรองตามหมู่:</span>
        <button onClick={() => setFilterMoo("all")} style={{
          border: `1.5px solid ${filterMoo === "all" ? C.navy : "#cbd5e1"}`,
          background: filterMoo === "all" ? C.navy : "#fff", color: filterMoo === "all" ? "#fff" : C.text,
          borderRadius: 999, padding: "3px 12px", fontSize: 12, cursor: "pointer", fontFamily: FONT,
        }}>ทั้งหมด</button>
        {moos.map(m => (
          <button key={m} onClick={() => setFilterMoo(m)} style={{
            border: `1.5px solid ${filterMoo === m ? C.navy : "#cbd5e1"}`,
            background: filterMoo === m ? C.navy : "#fff", color: filterMoo === m ? "#fff" : C.text,
            borderRadius: 999, padding: "3px 12px", fontSize: 12, cursor: "pointer", fontFamily: FONT,
          }}>หมู่ {m}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 8 }}>
        {filtered.map(s => (
          <SourceCard key={s.id} src={s} theme={theme} selected={s.id === selectedId} onClick={() => onSelect && onSelect(s.id)} />
        ))}
      </div>
    </div>
  );
}
