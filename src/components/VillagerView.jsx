import { useState, useMemo } from "react";
import StatusSummary from "./StatusSummary";
import TotalBar from "./TotalBar";
import AlertBanner from "./AlertBanner";
import WaterMap from "./WaterMap";
import WaterNetworkPanel from "./WaterNetworkPanel";
import VillagerFormButton from "./VillagerFormButton";
import PrintReport from "./PrintReport";
import SourceDetailCard from "./SourceDetailCard";
import { useWaterNetworkDiagram, useTelemetry } from "../lib/dataHooks";

export default function VillagerView({ sources, snap, tambon, theme, ts }) {
  const [tab, setTab] = useState("map");
  const [selectedId, setSelectedId] = useState(null);
  const { C, FONT } = theme;

  // ผังน้ำ (nw schema, อ่านอย่างเดียว) — ใช้หาป้าย "เชื่อมต่อกับ..." จาก label
  // ของเส้นทาง (edge) ที่พาดผ่านโหนดของแหล่งน้ำนั้นๆ บนผังน้ำจริง แทนการ hardcode
  // ตารางเชื่อมต่อแบบต้นแบบนครป่าหมาก (ซึ่งผูกกับตำบลเดียว ใช้ซ้ำกับระบบ multi-tenant นี้ไม่ได้)
  const { nodes, edges } = useWaterNetworkDiagram(tambon?.tambon_id);

  // สถานีโทรมาตรจริง (data_feeds/HII) ของทุกแหล่งน้ำในตำบลนี้ — ใช้แสดงผลเมื่อกด
  // สัญลักษณ์สถานีโทรมาตรบนผังน้ำ (ผู้ใช้เพิ่ม node เองแล้ว ตั้ง label เป็นรหัสสถานี)
  const sourceIds = useMemo(() => sources.map(s => s.id), [sources]);
  const { telemetryByCode } = useTelemetry(sourceIds);

  const connectionsBySourceId = useMemo(() => {
    if (!nodes || !edges || !sources) return {};
    const refToId = Object.fromEntries(sources.filter(s => s.curveNodeKey).map(s => [s.curveNodeKey, s.id]));
    const nodeByKey = Object.fromEntries(nodes.map(n => [n.node_key, n]));
    const map = {};
    edges.forEach(e => {
      const label = (e.label || "").trim();
      if (!label) return;
      [e.source_node_key, e.target_node_key].forEach(key => {
        const node = nodeByKey[key];
        const ref = node?.source_ref;
        const sourceId = ref && refToId[ref];
        if (sourceId && !map[sourceId]) map[sourceId] = label;
      });
    });
    return map;
  }, [nodes, edges, sources]);

  const selectedSource = sources.find(s => s.id === selectedId);
  const selectedHistory = useMemo(() => {
    if (!selectedId || !ts) return [];
    return ts.map(row => ({ iso: row.iso, pct: row[selectedId] ?? null }));
  }, [selectedId, ts]);

  return (
    <div>
      <AlertBanner sources={sources} theme={theme} />
      <TotalBar snap={snap} theme={theme} />
      <StatusSummary sources={sources} theme={theme} />

      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {[{ id: "map", label: "🗺️ แผนที่" }, { id: "water", label: "💧 ผังน้ำ" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            border: `1.5px solid ${tab === t.id ? C.sky : "#cbd5e1"}`,
            background: tab === t.id ? "#e0f2fe" : "#fff",
            borderRadius: "8px 8px 0 0", padding: "8px 16px", cursor: "pointer",
            fontFamily: FONT, fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "map"
        ? <WaterMap sources={sources} tambon={tambon} theme={theme} selectedId={selectedId} onSelect={setSelectedId} />
        : <WaterNetworkPanel sources={sources} tambonId={tambon?.tambon_id} theme={theme} selectedId={selectedId} onSelect={setSelectedId} telemetryByCode={telemetryByCode} />}

      {selectedSource && (
        <SourceDetailCard
          source={selectedSource}
          theme={theme}
          history={selectedHistory}
          connectionLabel={connectionsBySourceId[selectedId]}
          onClose={() => setSelectedId(null)}
        />
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
        <button onClick={() => window.print()} style={{
          background: "#fff", color: C.navy, border: `1.5px solid ${C.navy}`, borderRadius: 10,
          padding: "10px 20px", fontFamily: FONT, fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}>🖨️ พิมพ์รายงาน / บันทึก PDF</button>
        <VillagerFormButton tambonId={tambon?.tambon_id} theme={theme} />
      </div>

      <PrintReport sources={sources} snap={snap} tambon={tambon} theme={theme} />
    </div>
  );
}
