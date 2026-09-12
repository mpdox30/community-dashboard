import rawSvg from "../assets/water-network-diagram.svg?raw";
import { STATUS_CONFIG, getStatus } from "../lib/status";

/* ─────────────────────────────────────────────
   ผังน้ำ — SVG flow diagram with colored % overlay boxes
   (เทคนิคเดียวกับต้นฉบับ: ฝัง SVG จริงเป็นพื้นหลัง แล้ววางกล่องสี
   ทับตำแหน่งพิกัดของแต่ละแหล่งน้ำ)

   พิกัดกล่อง (SVG_NODE_BOXES) วัดจากไฟล์ผังน้ำต้นฉบับ (viewBox 0 0 3178
   2246) โดยแกะพิกัด path/rect ของสัญลักษณ์อ่างเก็บน้ำและกล่องข้อมูล
   แหล่งน้ำ (Name/Capacity) ตรงๆ จาก SVG source แล้วตรวจสอบไขว้กับไฟล์
   "ผังน้ำ แม่นาเรือ ชี้เป้าแหล่งน้ำ.png" ที่ผู้ใช้วาดเส้นสีแดงชี้เป้าไว้ —
   ยืนยันแล้วว่าเส้นสีแดงทุกเส้นชี้มาที่พิกัดที่คำนวณได้พอดีทั้ง 8 จุด
   (พิกัดเดียวกันนี้ใช้ได้กับทุกเวอร์ชันของไฟล์ผังที่ผู้ใช้ส่งมา เพราะ
   ตำแหน่งป้ายชื่อ/กล่องข้อมูลในไฟล์คงที่ทุกเวอร์ชัน)

   รูปทรงกล่องสี: อ่างเก็บน้ำ = สามเหลี่ยม (ยอดชี้ขึ้น ตรงกับสัญลักษณ์
   Reservoir บนผัง), แก้มลิง/สระ = สี่เหลี่ยม (ตรงกับกล่อง Name/Capacity)
───────────────────────────────────────────── */

// viewBox ต้นฉบับของไฟล์ SVG
const VB_W = 3178;
const VB_H = 2246;

// shape: "triangle" = อ่างเก็บน้ำ (ตรงกับสัญลักษณ์ Reservoir บนผัง),
//        "rect"     = แก้มลิง/สระ (ตรงกับกล่อง Name/Capacity บนผัง)
const SVG_NODE_BOXES = [
  // MNR-01 อ่างเก็บน้ำแม่นาเรือ
  { id: "195dfdb8-501c-4183-8f98-95d43a900fda", x: 870, y: 201.9, w: 103, h: 108, shape: "triangle" },
  // MNR-02 อ่างเก็บน้ำวิทยาลัยเกษตร (PYCAT)
  { id: "798b5589-b76b-4288-91e0-a4e18f3e3935", x: 1060, y: 362.9, w: 102, h: 108, shape: "triangle" },
  // MNR-06 แก้มลิงโป่งหินน้อย (Pong Hin Noi) — เดิมชื่อ "แก้มลิงม่อนโป่งหิน" เปลี่ยนตามไฟล์ source code 2026-09-12
  { id: "ecbe9b4d-35d0-4c91-bfea-398b9b713b2b", x: 1439, y: 474.9, w: 177, h: 110, shape: "rect" },
  // MNR-03 อ่างเก็บน้ำห้วยถ้ำ
  { id: "344e9355-808d-4c16-84a2-9625d90be011", x: 883, y: 804.8, w: 102, h: 109, shape: "triangle" },
  // MNR-07 แก้มลิงร่องซุ้ม (Rong Sum) — เดิมชื่อ "แก้มลิงร่องแล้ง" เปลี่ยนตามไฟล์ source code 2026-09-12
  { id: "4f99b0d3-5218-4829-aa12-76a4888d26a0", x: 1399, y: 1260.7, w: 177, h: 109, shape: "rect" },
  // MNR-04 อ่างเก็บน้ำห้วยโซ้
  { id: "0fd9ed88-9e31-4304-91d9-e0d136709368", x: 887, y: 1439.6, w: 102, h: 108, shape: "triangle" },
  // MNR-05 อ่างเก็บน้ำห้วยจำตุ้ม
  { id: "e81ea50c-3274-430b-9e25-e6e5684f50cd", x: 836, y: 1952.5, w: 102, h: 109, shape: "triangle" },
  // MNR-08 แก้มลิงห้วยน้ำขาว (Huai Nam Kao) — เดิมชื่อ "สระห้วยน้ำขาว" เปลี่ยนตามไฟล์ source code 2026-09-12
  { id: "4f950fc6-54fa-4c5a-9686-8b93ace8a670", x: 1179, y: 2084.5, w: 177, h: 110, shape: "rect" },
];

// จุดสามเหลี่ยม (ยอดชี้ขึ้น) ทับกรอบพิกัดเดิม — ทิศทางเดียวกับสัญลักษณ์ "Reservoir" บนผัง
function trianglePoints(x, y, w, h, pad = 0) {
  const x0 = x - pad, y0 = y - pad, w0 = w + pad * 2, h0 = h + pad * 2;
  return `${x0 + w0 / 2},${y0} ${x0},${y0 + h0} ${x0 + w0},${y0 + h0}`;
}
// จุดศูนย์กลางมวล (centroid) ของสามเหลี่ยมด้านบน สำหรับวางข้อความ %
function triangleTextY(y, h) {
  return y + (h * 2) / 3;
}

// ดึงเนื้อหาภายใน <svg>...</svg> ออกมา (defs + g) เพื่อฝังเป็นพื้นหลัง
const SVG_INNER = (() => {
  const m = rawSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  return m ? m[1] : "";
})();

export default function WaterFlowDiagram({ sources, theme, selectedId, onSelect }) {
  const { C, FONT } = theme;
  const srcMap = Object.fromEntries(sources.map(s => [s.id, s]));

  // ผังนี้ hardcode พิกัดกล่องต่อ source_id ของแม่นาเรือเท่านั้น (ดู SVG_NODE_BOXES ด้านบน)
  // ตำบลอื่นที่ยังไม่มีผังของตัวเอง (เช่นนครป่าหมากก่อนเฟส Cytoscape) จะไม่มี source_id ไหนตรงเลย —
  // กันไม่ให้โชว์รูปผังน้ำของแม่นาเรือแบบไม่มีกล่องทับ (ดูเหมือนข้อมูลผิดตำบล) ด้วยการโชว์ placeholder แทน
  const hasMatchingDiagram = sources.some(s => SVG_NODE_BOXES.some(b => b.id === s.id));
  if (!hasMatchingDiagram) {
    return (
      <div style={{
        borderRadius: 12, border: `1.5px solid ${C.border}`, background: "#f8fafc",
        padding: "48px 20px", textAlign: "center", fontFamily: FONT,
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🗺️</div>
        <div style={{ fontWeight: 700, color: C.navy, marginBottom: 4 }}>ผังน้ำแบบอินเทอร์แอกทีฟกำลังจัดทำ</div>
        <div style={{ fontSize: 12, color: C.muted }}>ดูรายละเอียดแต่ละแหล่งน้ำได้จากการ์ดด้านล่าง</div>
      </div>
    );
  }

  return (
    <div style={{
      position: "relative", borderRadius: 12, overflow: "hidden",
      border: `1.5px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", background: "#fff",
    }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={{ display: "block", width: "100%", height: "auto" }}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <g dangerouslySetInnerHTML={{ __html: SVG_INNER }} />

        {SVG_NODE_BOXES.map(node => {
          const src = srcMap[node.id];
          if (!src) return null;
          const cfg = STATUS_CONFIG[getStatus(src.pct)];
          const sel = node.id === selectedId;
          const fontSize = Math.min(node.w, node.h) * 0.32;
          const isTri = node.shape === "triangle";
          const textY = isTri
            ? triangleTextY(node.y, node.h) + fontSize * 0.3
            : node.y + node.h / 2 + fontSize * 0.35;
          return (
            <g key={node.id} onClick={() => onSelect && onSelect(node.id)} style={{ cursor: "pointer" }}>
              {sel && (
                isTri ? (
                  <polygon points={trianglePoints(node.x, node.y, node.w, node.h, 6)}
                           fill={cfg.badge} opacity={0.25} />
                ) : (
                  <rect x={node.x - 6} y={node.y - 6} width={node.w + 12} height={node.h + 12}
                        fill={cfg.badge} opacity={0.25} rx={6} />
                )
              )}
              {isTri ? (
                <polygon points={trianglePoints(node.x, node.y, node.w, node.h)}
                         fill={sel ? cfg.badge : cfg.bg} opacity={0.92}
                         stroke={sel ? "#0c4a6e" : cfg.badge} strokeWidth={sel ? 4 : 2.5}
                         strokeLinejoin="round" />
              ) : (
                <rect x={node.x} y={node.y} width={node.w} height={node.h}
                      fill={sel ? cfg.badge : cfg.bg} opacity={0.92}
                      stroke={sel ? "#0c4a6e" : cfg.badge} strokeWidth={sel ? 4 : 2.5} rx={6} />
              )}
              <text x={node.x + node.w / 2} y={textY}
                    textAnchor="middle" fill={sel ? "#fff" : cfg.text}
                    fontSize={fontSize} fontWeight="700" fontFamily="Sarabun,Tahoma,sans-serif">
                {src.pct != null ? `${Math.round(src.pct)}%` : "—"}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{
        position: "absolute", bottom: 8, right: 8,
        background: "rgba(255,255,255,0.92)", borderRadius: 8,
        padding: "5px 10px", fontSize: 10, fontFamily: FONT,
        boxShadow: "0 1px 6px rgba(0,0,0,0.15)",
        display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end",
      }}>
        {Object.values(STATUS_CONFIG).filter(cfg => cfg.label !== "ไม่มีข้อมูล").map(cfg => (
          <div key={cfg.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 14, height: 9, borderRadius: 2, background: cfg.badge, flexShrink: 0 }} />
            <span style={{ color: cfg.text }}>{cfg.dot} {cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
