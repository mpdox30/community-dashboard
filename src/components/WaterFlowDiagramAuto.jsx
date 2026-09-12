import { useWaterNetworkDiagram } from "../lib/dataHooks";
import WaterFlowDiagram from "./WaterFlowDiagram";
import WaterFlowDiagramCytoscape from "./WaterFlowDiagramCytoscape";

/* ─────────────────────────────────────────────
   เลือกอัตโนมัติว่าจะโชว์ผังน้ำแบบไหน:
   - ถ้าตำบลนี้มีผังจากระบบ nw (มี node ประเภท waterbody ผูก source_ref
     ไว้แล้ว เช่นนครป่าหมาก) -> ใช้เวอร์ชัน Cytoscape แบบอินเทอร์แอกทีฟ
   - ถ้าไม่มี (เช่นแม่นาเรือตอนนี้ที่ยังไม่มี node ไหนผูก source_ref เลย)
     -> fallback ไปใช้ผัง SVG hardcode เดิม (ซึ่งมี placeholder guard ของ
     ตัวเองอยู่แล้วถ้าไม่เจอ source_id ที่ตรงกันสักตัว)
───────────────────────────────────────────── */
export default function WaterFlowDiagramAuto({ tambonId, sources, theme, selectedId, onSelect }) {
  const { C, FONT } = theme;
  const { nodes, edges, loading } = useWaterNetworkDiagram(tambonId);

  if (loading) {
    return (
      <div style={{
        borderRadius: 12, border: `1.5px solid ${C.border}`, background: "#f8fafc",
        padding: "60px 20px", textAlign: "center", fontFamily: FONT, color: C.muted, fontSize: 13,
      }}>
        กำลังโหลดผังน้ำ…
      </div>
    );
  }

  const hasNwDiagram = (nodes ?? []).some(n => n.node_type === "waterbody" && n.source_ref);

  if (hasNwDiagram) {
    return (
      <WaterFlowDiagramCytoscape
        nodes={nodes} edges={edges} sources={sources} theme={theme}
        selectedId={selectedId} onSelect={onSelect}
      />
    );
  }

  return <WaterFlowDiagram sources={sources} theme={theme} selectedId={selectedId} onSelect={onSelect} />;
}
