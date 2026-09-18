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
import { IconMap, IconNetwork, IconPrinter } from "../lib/icons";
import RiskForecastBanner from "./RiskForecastBanner";
import TimelineScrubber from "./TimelineScrubber";

export default function VillagerView({ sources, snap, tambon, theme, ts }) {
  const [tab, setTab] = useState("map");
  const [selectedId, setSelectedId] = useState(null);
  const [histDate, setHistDate] = useState(null); // null = ล่าสุด (live); ตั้งค่าจาก TimelineScrubber
  const { C, FONT } = theme;

  // ผังน้ำ (nw schema, อ่านอย่างเดียว) — ใช้หาป้าย "เชื่อมต่อกับ..." จาก label
  // ของเส้นทาง (edge) ที่พาดผ่านโหนดของแหล่งน้ำนั้นๆ บนผังน้ำจริง แทนการ hardcode
  // ตารางเชื่อมต่อแบบต้นแบบนครป่าหมาก (ซึ่งผูกกับตำบลเดียว ใช้ซ้ำกับระบบ multi-tenant นี้ไม่ได้)
  const { nodes, edges } = useWaterNetworkDiagram(tambon?.tambon_id);

  // สถานีโทรมาตรจริง (data_feeds/HII) ของทุกแหล่งน้ำในตำบลนี้ — ใช้แสดงผลเมื่อกด
  // สัญลักษณ์สถานีโทรมาตรบนผังน้ำ (ผู้ใช้เพิ่ม node เองแล้ว ตั้ง label เป็นรหัสสถานี)
  // ส่ง sources เต็ม (ไม่ใช่แค่ id) เพราะต้องใช้ spillwayLevel/capacity คำนวณปริมาณน้ำปัจจุบันด้วย
  const { telemetryByCode } = useTelemetry(sources);

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

  // ── มุมมองย้อนหลัง (TimelineScrubber) — ฉาย pct/m3 ของแต่ละแหล่ง storage ณ วันที่เลือก
  // จาก ts (ระดับน้ำรายวันที่โหลดมาแล้ว) แทนค่า "ล่าสุด" ปกติ ไม่ได้ query เพิ่ม/แก้ useSources()
  // สูตร totalPct ใช้ round((total/max)*1000)/10 แบบเดียวกับ snap เดิมใน lib/dataHooks.js เป๊ะๆ
  const displaySources = useMemo(() => {
    if (!histDate || !ts) return sources;
    const row = ts.find(r => r.iso === histDate);
    if (!row) return sources;
    return sources.map(s => {
      if (s.role !== "storage") return s;
      const pctRaw = row[s.id];
      const pct = pctRaw != null ? Math.round(pctRaw * 10) / 10 : null;
      const m3 = pct != null && s.maxM3 != null ? Math.round((pct / 100) * s.maxM3) : null;
      return { ...s, pct, m3 };
    });
  }, [sources, ts, histDate]);

  const displaySnap = useMemo(() => {
    if (!histDate) return snap;
    const storageWithData = displaySources.filter(s => s.role === "storage" && s.pct != null);
    const totalM3 = storageWithData.reduce((sum, s) => sum + (s.m3 ?? 0), 0);
    const maxM3 = displaySources.filter(s => s.role === "storage").reduce((sum, s) => sum + (s.maxM3 ?? 0), 0);
    return {
      date: histDate,
      totalM3,
      maxM3,
      totalPct: maxM3 > 0 ? Math.round((totalM3 / maxM3) * 1000) / 10 : null,
      storageCount: snap?.storageCount,
      structureCount: snap?.structureCount,
    };
  }, [histDate, displaySources, snap]);

  const selectedSource = displaySources.find(s => s.id === selectedId);
  const selectedHistory = useMemo(() => {
    if (!selectedId || !ts) return [];
    return ts.map(row => ({ iso: row.iso, pct: row[selectedId] ?? null }));
  }, [selectedId, ts]);

  const SUB_TABS = [
    { id: "map", label: "แผนที่", Icon: IconMap },
    { id: "water", label: "ผังน้ำ", Icon: IconNetwork },
  ];

  return (
    <div>
      <AlertBanner sources={displaySources} theme={theme} />
      {!histDate && <RiskForecastBanner sources={sources} theme={theme} />}
      <TotalBar snap={displaySnap} theme={theme} />
      <StatusSummary sources={displaySources} theme={theme} />
      <TimelineScrubber ts={ts} onChange={setHistDate} theme={theme} />

      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {SUB_TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              border: `1.5px solid ${active ? C.sky : "#cbd5e1"}`,
              background: active ? "#e0f2fe" : "#fff",
              borderRadius: "8px 8px 0 0", padding: "8px 16px", cursor: "pointer",
              fontFamily: FONT, fontSize: 13, fontWeight: active ? 700 : 400,
              display: "flex", alignItems: "center", gap: 6,
              color: active ? C.navy : C.muted,
            }}>
              <t.Icon size={16} color={active ? C.navy : C.muted} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "map" ? (
        <>
          <WaterMap sources={displaySources} tambon={tambon} theme={theme} selectedId={selectedId} onSelect={setSelectedId} />
          {selectedSource && (
            <SourceDetailCard
              source={selectedSource}
              theme={theme}
              history={selectedHistory}
              connectionLabel={connectionsBySourceId[selectedId]}
              onClose={() => setSelectedId(null)}
              histDate={histDate}
            />
          )}
        </>
      ) : (
        <WaterNetworkPanel
          sources={displaySources} tambonId={tambon?.tambon_id} theme={theme} selectedId={selectedId} onSelect={setSelectedId}
          telemetryByCode={telemetryByCode}
          selectedSource={selectedSource} selectedHistory={selectedHistory}
          connectionLabel={connectionsBySourceId[selectedId]} onCloseDetail={() => setSelectedId(null)}
          histDate={histDate}
        />
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
        <button onClick={() => window.print()} style={{
          background: "#fff", color: C.navy, border: `1.5px solid ${C.navy}`, borderRadius: 10,
          padding: "10px 20px", fontFamily: FONT, fontSize: 14, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <IconPrinter size={17} color={C.navy} />
          พิมพ์รายงาน / บันทึก PDF
        </button>
        <VillagerFormButton tambonId={tambon?.tambon_id} theme={theme} />
      </div>

      <PrintReport sources={sources} snap={snap} tambon={tambon} theme={theme} />
    </div>
  );
}
