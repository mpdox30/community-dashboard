import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import { STATUS_CONFIG, getStatus, fmt } from "../lib/status";

/* ─────────────────────────────────────────────
   ผังน้ำแบบอินเทอร์แอกทีฟ (Cytoscape) — พอร์ตมาจาก `WaterFlowDiagramSupabase`
   ของเว็บต้นแบบ (fluffy-monstera-2dd0a8.netlify.app, App.jsx บรรทัด ~2967-3593)
   ซึ่งใช้งานจริงกับข้อมูลนครป่าหมากอยู่แล้วตอนนี้ และผ่านการแก้บั๊กมาหลายรอบแล้ว
   (fit ผิดกรอบเพราะ orphan node, race condition ฟอนต์โหลดไม่ทัน, ResizeObserver
   ทับ pan/zoom ของผู้ใช้ ฯลฯ — ดูคอมเมนต์เดิมในแต่ละจุดที่คัดลอกมา) —
   **ไม่ได้เขียนใหม่จากศูนย์** ตามหลักการห้ามคิดใหม่/ลดทอนของเดิมที่ debug มาแล้ว

   ต่างจากต้นฉบับ 2 จุดเท่านั้น (เพราะ codebase นี้เป็นระบบ multi-tenant ใช้ร่วม
   หลายตำบล ไม่ได้ hardcode เฉพาะนครป่าหมากเหมือนต้นแบบ):
   1. sources[].id ของระบบนี้คือ source_id (uuid) เสมอ (ใช้ทั่วทั้งแอปสำหรับ
      SourceCard/WaterMap/selection ฯลฯ) ในขณะที่ node.sourceRef บนผังเป็นรหัส
      ข้อความ (เช่น "NP-01") — จึงต้องมี refToId/idToRef แปลงไปมาผ่าน
      sources[].curveNodeKey (มาจาก water_sources.curve_node_key) แทนที่จะ
      เทียบ ref ตรงๆ กับ sources[].id แบบต้นแบบที่ผูกกับนครป่าหมากตำบลเดียว
   2. ไม่มี prop `telemetry` จริงจาก Google Sheets ในระบบนี้ (นครป่าหมากยังไม่มี
      โทรมาตรใช้งาน — data_feeds = 0 แถว) จึงส่ง telemetry=null เสมอ — โค้ด
      ส่วนแสดงผล panel โทรมาตรของเดิมรองรับกรณีนี้อยู่แล้ว (โชว์ข้อความ
      "ยังไม่มีข้อมูล" ตามดีไซน์เดิม) เผื่ออนาคตมีตำบลที่มีโทรมาตรจริงมาต่อ prop นี้
───────────────────────────────────────────── */

const FLOW_ANIM_DEFAULT = true;

export default function WaterFlowDiagramCytoscape({ nodes, edges, sources, theme, selectedId, onSelect, telemetry = null }) {
  const { C, FONT } = theme;

  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const cyRef = useRef(null);
  const fitTargetRef = useRef(null);
  const telemetryRef = useRef(telemetry);
  useEffect(() => { telemetryRef.current = telemetry; }, [telemetry]);

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errMsg, setErrMsg] = useState("");
  const [fontSize, setFontSize] = useState(12);
  const [taggedNodeCount, setTaggedNodeCount] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTaggedWarning, setShowTaggedWarning] = useState(true);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [flowAnimEnabled, setFlowAnimEnabled] = useState(FLOW_ANIM_DEFAULT);
  const flowDotsRef = useRef([]);
  const flowCancelRef = useRef(false);

  // sources[].id (uuid) <-> node.sourceRef (ข้อความ "NP-01") ผ่าน curveNodeKey
  const refToIdRef = useRef({});
  const idToRefRef = useRef({});
  useEffect(() => {
    refToIdRef.current = Object.fromEntries((sources ?? []).filter(s => s.curveNodeKey).map(s => [s.curveNodeKey, s.id]));
    idToRefRef.current = Object.fromEntries((sources ?? []).filter(s => s.curveNodeKey).map(s => [s.id, s.curveNodeKey]));
  }, [sources]);

  // ── ปุ่ม "เต็มจอ" ──
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onFsChange = () => {
      const active = document.fullscreenElement === el;
      setIsFullscreen(active);
      requestAnimationFrame(() => {
        cyRef.current?.resize();
        cyRef.current?.fit(fitTargetRef.current || undefined, 40);
      });
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else wrapperRef.current?.requestFullscreen?.();
  };

  // ── สร้าง cytoscape instance ตอน nodes/edges (จาก nw_diagram_current_nodes/edges) พร้อม ──
  useEffect(() => {
    let cancelled = false;
    let resizeObs = null;
    let userInteracted = false;

    (async () => {
      try {
        if (!nodes || nodes.length === 0) {
          setStatus("error");
          setErrMsg("ไม่พบข้อมูลผังน้ำสำหรับตำบลนี้");
          return;
        }

        const els = nodes.map(r => ({
          data: {
            id: r.node_key, label: r.label || "", type: r.node_type || undefined,
            rotation: r.rotation || 0, dir: r.dir || "h", sourceRef: r.source_ref || "",
            status: r.status || null,
          },
          position: { x: r.pos_x, y: r.pos_y },
        })).concat((edges ?? []).map(r => ({
          data: {
            id: r.edge_key, source: r.source_node_key, target: r.target_node_key,
            label: r.label || "", type: r.edge_type || undefined,
            ...(r.engine_straight ? { engineStraight: true } : {}),
            ...(r.engine_bend ? { engineBend: true, segDist: r.seg_dist, segWeight: r.seg_weight } : {}),
          },
        })));

        const taggedCount = els.filter(e => e.data?.sourceRef).length;
        setTaggedNodeCount(taggedCount);

        // รอฟอนต์ Sarabun โหลดเสร็จก่อน — ป้องกัน layout ขยับหลัง fit() ครั้งแรก
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        await new Promise(r => requestAnimationFrame(r));
        if (cancelled || !containerRef.current) return;

        cyRef.current = cytoscape({
          container: containerRef.current,
          elements: els,
          layout: { name: "preset" }, // สำคัญ: ใช้ตำแหน่งจาก DB ตรงๆ
          style: cytoscapeStyle(FONT),
          userZoomingEnabled: true,
          userPanningEnabled: true,
          boxSelectionEnabled: false,
          autoungrabify: true, // ล็อคไม่ให้ผู้ชมลากขยับโหนด — ยัง pan/zoom/คลิกได้ปกติ
        });

        cyRef.current.on("tap", "node", evt => {
          const ref = evt.target.data("sourceRef");
          if (ref) {
            if (onSelect) onSelect(refToIdRef.current[ref] ?? null);
            setSelectedStructure(null);
            return;
          }
          const ntype = evt.target.data("type");
          if (["gate", "weir", "pump"].includes(ntype)) {
            setSelectedStructure({
              kind: "infra",
              label: evt.target.data("origLabel") || evt.target.data("label") || ntype,
              type: ntype,
              status: evt.target.data("status") || null,
            });
            return;
          }
          if (ntype === "telemetry") {
            setSelectedStructure({
              kind: "telemetry",
              label: evt.target.data("origLabel") || evt.target.data("label") || "สถานีโทรมาตร",
              data: telemetryRef.current,
            });
          }
        });
        cyRef.current.on("tap", evt => { if (evt.target === cyRef.current) setSelectedStructure(null); });
        cyRef.current.on("pan zoom", () => { userInteracted = true; });

        // ── กลุ่มหลัก (largest connected component) กัน fit() บีบกรอบเพราะ orphan node ──
        // แหล่งน้ำที่รับน้ำฝนอย่างเดียวมักไม่เชื่อมกับคลองเลย จึงรวม node ที่มี
        // source_ref/label เข้ากลุ่มหลักเสมอ กันไม่ให้หลุดกรอบไปด้วย
        const components = cyRef.current.elements().components();
        let mainComponent = cyRef.current.elements();
        if (components.length > 1) {
          const largest = components.reduce((a, b) => (a.length >= b.length ? a : b));
          const keepAlways = cyRef.current.elements().filter(ele =>
            ele.isEdge() || ele.data("sourceRef") || (ele.data("label") && ele.data("label").trim())
          );
          mainComponent = largest.union(keepAlways);
        }
        fitTargetRef.current = mainComponent;

        cyRef.current.resize();
        cyRef.current.fit(mainComponent, 40);
        setTimeout(() => {
          if (!cancelled && cyRef.current && !userInteracted) {
            cyRef.current.resize();
            cyRef.current.fit(mainComponent, 40);
          }
        }, 200);

        setStatus("ready");

        resizeObs = new ResizeObserver(() => {
          if (!cyRef.current || userInteracted) return;
          cyRef.current.resize();
          cyRef.current.fit(fitTargetRef.current || undefined, 40);
        });
        resizeObs.observe(containerRef.current);
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrMsg(err.message || "โหลดผังน้ำไม่สำเร็จ");
      }
    })();

    return () => {
      cancelled = true;
      resizeObs?.disconnect();
      cyRef.current?.destroy();
      cyRef.current = null;
      fitTargetRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // ── จุดน้ำไหล: ลอยทับเส้นคลองหลัก (type="main") วิ่งวนจาก source→target ──
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || status !== "ready") return;
    flowCancelRef.current = false;

    if (!flowAnimEnabled) {
      flowDotsRef.current.forEach(d => { if (!d.removed()) d.remove(); });
      flowDotsRef.current = [];
      return;
    }

    const mainEdges = cy.edges('[type = "main"]');
    if (mainEdges.length === 0) return;

    const loopDot = (dot, edge, duration) => {
      if (flowCancelRef.current || dot.removed() || edge.removed()) return;
      const src = edge.sourceEndpoint();
      const mid = edge.midpoint();
      dot.position(src);
      dot.animate({ position: mid }, {
        duration: duration / 2, easing: "linear",
        complete: () => {
          if (flowCancelRef.current || dot.removed() || edge.removed()) return;
          const tgt = edge.targetEndpoint();
          dot.animate({ position: tgt }, { duration: duration / 2, easing: "linear", complete: () => loopDot(dot, edge, duration) });
        },
      });
    };

    mainEdges.forEach((edge, i) => {
      const src = edge.sourceEndpoint();
      const dot = cy.add({ group: "nodes", classes: "flow-dot", data: { id: `flowdot-${edge.id()}` }, position: { x: src.x, y: src.y }, selectable: false, grabbable: false });
      flowDotsRef.current.push(dot);
      setTimeout(() => loopDot(dot, edge, 2200), i * 260);
    });

    return () => {
      flowCancelRef.current = true;
      flowDotsRef.current.forEach(d => { if (!d.removed()) d.remove(); });
      flowDotsRef.current = [];
    };
  }, [status, flowAnimEnabled]);

  // ── ระบายสีโหนดตามสถานะ % ทุกครั้งที่ sources เปลี่ยน ──
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || status !== "ready") return;
    const srcMap = Object.fromEntries((sources ?? []).filter(s => s.curveNodeKey).map(s => [s.curveNodeKey, s]));
    cy.nodes().forEach(node => {
      const ref = node.data("sourceRef");
      const src = ref && srcMap[ref];
      if (!src) return;
      if (node.data("origLabel") === undefined) node.data("origLabel", node.data("label") || ref);
      const cfg = STATUS_CONFIG[getStatus(src.pct)];
      node.data({ hasStatus: true, statusColor: cfg.badge });
      const suffix = src.isolated ? " ☁" : "";
      const pctText = src.pct != null ? `${Math.round(src.pct)}%` : "—";
      node.data("label", `${node.data("origLabel")}${suffix}\n${pctText}`);
    });
  }, [sources, status]);

  // ── ไฮไลต์โหนดที่เลือกอยู่ ──
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || status !== "ready") return;
    cy.nodes().removeClass("selected-source");
    const ref = selectedId ? idToRefRef.current[selectedId] : null;
    if (ref) cy.nodes(`[sourceRef = "${ref}"]`).addClass("selected-source");
  }, [selectedId, status]);

  // ── ปรับขนาดตัวอักษร ──
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || status !== "ready") return;
    cy.style().selector("node").style({ "font-size": `${fontSize}px` })
      .selector("edge").style({ "font-size": `${Math.max(fontSize - 2, 8)}px` })
      .update();
  }, [fontSize, status]);

  const selectedSource = selectedId ? (sources ?? []).find(s => s.id === selectedId) : null;

  return (
    <>
      <div ref={wrapperRef} style={{
        position: "relative", width: "100%", height: isFullscreen ? "100vh" : 460,
        borderRadius: isFullscreen ? 0 : 12, border: `1.5px solid ${C.border}`, overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.10)", background: "#fff", textAlign: "left",
      }}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

        {status === "loading" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.85)", fontFamily: FONT, fontSize: 13, color: C.muted }}>
            ⏳ กำลังโหลดผังน้ำจากฐานข้อมูล...
          </div>
        )}

        {status === "error" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "#fffbeb", fontFamily: FONT, fontSize: 13, color: "#92400e", padding: 20, textAlign: "center" }}>
            <div>⚠️ ไม่สามารถโหลดผังน้ำได้</div>
            <div style={{ fontSize: 11, color: "#a16207" }}>{errMsg}</div>
          </div>
        )}

        {status === "ready" && (
          <>
            <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: "4px 10px 6px", boxShadow: "0 1px 6px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", alignItems: "center", fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#0f172a" }}>
              <div style={{ fontSize: 16, lineHeight: 1 }}>↑</div>
              <div>เหนือ</div>
            </div>

            <div style={{ position: "absolute", top: 8, left: 70, background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: "4px 6px", boxShadow: "0 1px 6px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 4, fontFamily: FONT, fontSize: 11 }}>
              <span style={{ color: C.muted, marginRight: 2 }}>ตัวอักษร</span>
              <button onClick={() => setFontSize(f => Math.max(6, f - 1))} style={btnSq}>−</button>
              <span style={{ width: 16, textAlign: "center" }}>{fontSize}</span>
              <button onClick={() => setFontSize(f => Math.min(24, f + 1))} style={btnSq}>+</button>
              <div style={sep} />
              <button onClick={() => { cyRef.current?.resize(); cyRef.current?.fit(fitTargetRef.current || undefined, 40); }} title="จัดกึ่งกลางผังน้ำใหม่" style={{ ...btnWide, color: C.navy }}>⤢ จัดกึ่งกลาง</button>
              <div style={sep} />
              <button onClick={toggleFullscreen} title={isFullscreen ? "ออกจากเต็มจอ" : "ดูผังน้ำเต็มจอ"} style={{ ...btnWide, color: C.navy }}>{isFullscreen ? "⤡ ออกเต็มจอ" : "⤢ เต็มจอ"}</button>
              <div style={sep} />
              <button onClick={() => setFlowAnimEnabled(v => !v)} title="แสดง/ซ่อนจุดน้ำไหลบนคลองหลัก" style={{ border: `1px solid ${flowAnimEnabled ? "#0ea5e9" : "#cbd5e1"}`, borderRadius: 4, padding: "2px 8px", background: flowAnimEnabled ? "#e0f2fe" : "#fff", cursor: "pointer", fontSize: 11, color: C.navy, fontWeight: 600 }}>💧 {flowAnimEnabled ? "น้ำไหล: เปิด" : "น้ำไหล: ปิด"}</button>
            </div>

            <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: "6px 10px", fontSize: 10, fontFamily: FONT, boxShadow: "0 1px 6px rgba(0,0,0,0.15)", display: "grid", gridTemplateColumns: "auto auto", gap: "3px 10px" }}>
              <LegendItem shape={<div style={{ width: 16, height: 2, background: "#4da6ff" }} />} label="แม่น้ำ/คลอง" />
              <LegendItem shape={<div style={{ width: 10, height: 10, background: "black", transform: "rotate(45deg)" }} />} label="ปตร." />
              <LegendItem shape={<div style={{ width: 10, height: 10, background: "#dc2626", border: "1.5px solid #7f1d1d", transform: "rotate(45deg)" }} />} label="ชำรุด" />
              <LegendItem shape={<div style={{ width: 14, height: 5, background: "black" }} />} label="ฝาย" />
              <LegendItem shape={<div style={{ width: 10, height: 10, borderRadius: "50%", border: "2.5px solid black", background: "#fff" }} />} label="โทรมาตร" />
              <LegendItem shape={<div style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid black", background: "#fff", fontSize: 7, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>P</div>} label="ระบบสูบน้ำ" />
              <LegendItem shape={<span style={{ fontSize: 12 }}>☁</span>} label="รับน้ำจากฝนเท่านั้น" />
            </div>

            {selectedStructure && selectedStructure.kind === "infra" && (
              <div style={{ position: "absolute", top: 8, right: 8, maxWidth: 200, background: "#fff", borderRadius: 10, padding: "10px 12px", boxShadow: "0 2px 10px rgba(0,0,0,0.18)", border: `1.5px solid ${selectedStructure.status === "ชำรุด" ? "#dc2626" : "#cbd5e1"}`, fontFamily: FONT }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{selectedStructure.label}</div>
                  <button onClick={() => setSelectedStructure(null)} style={closeBtn(C)}>✕</button>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {{ gate: "ประตูระบายน้ำ (ปตร.)", weir: "ฝาย", pump: "ระบบสูบน้ำ" }[selectedStructure.type] || selectedStructure.type}
                </div>
                <div style={{ display: "inline-block", marginTop: 6, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: selectedStructure.status === "ชำรุด" ? "#fef2f2" : "#f0fdf4", color: selectedStructure.status === "ชำรุด" ? "#dc2626" : "#15803d", border: `1px solid ${selectedStructure.status === "ชำรุด" ? "#fecaca" : "#bbf7d0"}` }}>
                  {selectedStructure.status === "ชำรุด" ? "⚠️ ชำรุด" : "✅ ใช้งานได้"}
                </div>
              </div>
            )}

            {selectedStructure && selectedStructure.kind === "telemetry" && (() => {
              const t = selectedStructure.data;
              return (
                <div style={{ position: "absolute", top: 8, right: 8, maxWidth: 260, background: "#fff", borderRadius: 10, padding: "10px 14px 12px", boxShadow: "0 2px 10px rgba(0,0,0,0.18)", border: "1.5px solid #cbd5e1", fontFamily: FONT }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{t?.stationName || selectedStructure.label}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>สถานีโทรมาตร</div>
                    </div>
                    <button onClick={() => setSelectedStructure(null)} style={closeBtn(C)}>✕</button>
                  </div>
                  {!t ? (
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>⏳ ยังไม่มีข้อมูลระดับน้ำจากสถานีนี้</div>
                  ) : (
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>{JSON.stringify(t)}</div>
                  )}
                </div>
              );
            })()}

            {isFullscreen && selectedSource && !selectedStructure && (
              <div style={{ position: "absolute", top: 8, right: 8, maxWidth: 230, background: "#fff", borderRadius: 10, padding: "10px 14px 12px", boxShadow: "0 2px 10px rgba(0,0,0,0.18)", border: `1.5px solid ${STATUS_CONFIG[getStatus(selectedSource.pct)].border}`, fontFamily: FONT }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{selectedSource.name}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>หมู่ {selectedSource.moo ?? "—"}</div>
                  </div>
                  <button onClick={() => onSelect && onSelect(null)} style={closeBtn(C)}>✕</button>
                </div>
                {(() => {
                  const cfg = STATUS_CONFIG[getStatus(selectedSource.pct)];
                  return (
                    <div style={{ display: "inline-block", marginTop: 8, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                      {cfg.dot} {cfg.label}
                    </div>
                  );
                })()}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                  <div style={{ background: "#f8fafc", borderRadius: 6, padding: "6px 8px" }}>
                    <div style={{ fontSize: 9, color: C.muted }}>% กักเก็บ</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{selectedSource.pct != null ? `${Math.round(selectedSource.pct)}%` : "—"}</div>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: 6, padding: "6px 8px", gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: 9, color: C.muted }}>ปริมาตร</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{fmt(selectedSource.m3)} ลบ.ม.</div>
                  </div>
                  {selectedSource.dW != null && (
                    <div style={{ background: "#f8fafc", borderRadius: 6, padding: "6px 8px", gridColumn: "1 / -1" }}>
                      <div style={{ fontSize: 9, color: C.muted }}>แนวโน้ม/สัปดาห์</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: selectedSource.dW >= 0 ? "#16a34a" : "#dc2626" }}>
                        {selectedSource.dW >= 0 ? "▲" : "▼"} {Math.abs(selectedSource.dW)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: "5px 10px", fontSize: 10, fontFamily: FONT, boxShadow: "0 1px 6px rgba(0,0,0,0.15)", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 220 }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 14, height: 9, borderRadius: 2, background: cfg.badge, flexShrink: 0 }} />
                  <span style={{ color: cfg.text }}>{cfg.dot} {cfg.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {taggedNodeCount === 0 && showTaggedWarning && (
        <div style={{ marginTop: 8, background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "6px 10px", fontFamily: FONT, fontSize: 11, color: "#92400e", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div>⚠️ ยังไม่มีโหนดในผังนี้ผูกกับรหัสแหล่งน้ำ (source_ref) — คลิกจะไม่แสดงรายละเอียดจนกว่าจะกรอกรหัสผ่านเครื่องมือแก้ไขผังก่อน</div>
          <button onClick={() => setShowTaggedWarning(false)} title="ปิด" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#92400e", fontSize: 13, lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
      )}
    </>
  );
}

const btnSq = { width: 20, height: 20, border: "1px solid #cbd5e1", borderRadius: 4, background: "#fff", cursor: "pointer", fontSize: 12, lineHeight: 1 };
const btnWide = { border: "1px solid #cbd5e1", borderRadius: 4, padding: "2px 8px", background: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600 };
const sep = { width: 1, height: 16, background: "#e2e8f0", margin: "0 2px" };
const closeBtn = C => ({ border: "none", background: "none", cursor: "pointer", fontSize: 14, color: C.muted, lineHeight: 1, padding: 0 });

function LegendItem({ shape, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{shape}</div>
      <span style={{ color: "#334155" }}>{label}</span>
    </div>
  );
}

// ── Cytoscape stylesheet — คัดลอกตรงจากต้นแบบ (03_frontend/index.html เว็บเครื่องมือ
// แก้ไขผังชุมชน บรรทัด 687-717 ตามคอมเมนต์เดิม) เปลี่ยนแค่ font-family ให้ใช้ตัวแปร FONT
// ของระบบนี้แทนการ hardcode "Sarabun, Tahoma, sans-serif" ตรงๆ — ไม่ได้ปรับสี/ขนาดใดๆ เลย
function cytoscapeStyle(FONT) {
  return [
    { selector: "node", style: {
      "background-color": "#adb5bd", "width": 8, "height": 8,
      "label": "data(label)",
      "font-family": FONT, "font-size": "12px",
      "text-valign": "top", "text-margin-y": -5,
      "text-wrap": "wrap", "text-max-width": "150px",
      "text-rotation": ele => (ele.data("rotation") || 0) + "deg",
    } },
    { selector: 'node[type = "generic_node"]', style: { "background-color": "#6c757d", "width": 10, "height": 10 } },
    { selector: 'node[type = "text_box"]', style: {
      "shape": "rectangle", "background-opacity": 0, "width": 1, "height": 1,
      "color": "#d9534f", "font-size": "14px", "font-weight": "bold",
      "text-valign": "center", "text-halign": "center",
      "text-outline-width": 2, "text-outline-color": "#ffffff",
    } },
    { selector: "edge", style: {
      "width": 3, "line-color": "#4da6ff", "target-arrow-color": "#4da6ff",
      "target-arrow-shape": "triangle",
      "curve-style": "taxi", "taxi-direction": "downward",
      "label": "data(label)", "font-size": "12px", "text-rotation": "0deg",
      "text-margin-y": -10,
      "text-background-color": "#ffffff", "text-background-opacity": 0.7,
      "text-background-padding": "2px",
    } },
    { selector: 'edge[type = "main"]', style: { "width": 6, "line-color": "#0056b3", "target-arrow-color": "#0056b3" } },
    { selector: "edge[?engineStraight]", style: { "curve-style": "straight" } },
    { selector: "edge[?engineBend]", style: { "curve-style": "segments", "segment-distances": "data(segDist)", "segment-weights": "data(segWeight)" } },
    { selector: 'node[type = "gate"]', style: { "shape": "diamond", "background-color": "black", "width": 25, "height": 25, "text-margin-y": -15 } },
    { selector: 'node[type = "weir"]', style: { "shape": "rectangle", "background-color": "black", "width": 35, "height": 12, "text-margin-y": -10 } },
    { selector: 'node[type = "weir"][dir = "v"]', style: { "width": 12, "height": 35, "text-margin-y": -5, "text-margin-x": 0, "text-valign": "top", "text-halign": "center" } },
    { selector: 'node[type = "reservoir"]', style: { "shape": "triangle", "background-color": "black", "width": 30, "height": 30, "text-margin-y": -15 } },
    { selector: 'node[type = "gate_plan"]', style: { "shape": "diamond", "background-color": "white", "border-width": 2, "border-color": "black", "width": 25, "height": 25, "text-margin-y": -15 } },
    { selector: 'node[type = "weir_plan"]', style: { "shape": "rectangle", "background-color": "white", "border-width": 2, "border-color": "black", "width": 35, "height": 12, "text-margin-y": -10 } },
    { selector: 'node[type = "weir_plan"][dir = "v"]', style: { "width": 12, "height": 35, "text-margin-y": -5, "text-margin-x": 0, "text-valign": "top", "text-halign": "center" } },
    { selector: 'node[type = "telemetry"]', style: { "shape": "ellipse", "background-color": "white", "border-width": 4, "border-color": "black", "width": 20, "height": 20 } },
    { selector: 'node[type = "pump"]', style: {
      "shape": "ellipse", "background-color": "white", "border-width": 2, "border-color": "black", "width": 25, "height": 25,
      "label": "P", "text-valign": "center", "text-halign": "center", "font-weight": "bold", "color": "black", "font-size": "14px",
    } },
    { selector: 'node[type = "waterbody"]', style: {
      "shape": "round-rectangle", "background-color": "#99ccff", "border-width": 1, "border-color": "#0056b3",
      "width": 70, "height": 35, "text-valign": "center", "text-margin-y": 0, "color": "#003366", "font-weight": "bold",
    } },
    { selector: 'node[type = "waterbody"][dir = "v"]', style: { "width": 35, "height": 70 } },
    { selector: "node[?hasStatus]", style: { "background-color": "data(statusColor)", "border-color": "data(statusColor)" } },
    { selector: 'node[status = "ชำรุด"]', style: { "background-color": "#dc2626", "border-color": "#7f1d1d", "border-width": 2.5 } },
    { selector: ".flow-dot", style: {
      "shape": "ellipse", "width": 6, "height": 6, "background-color": "#7dd3fc", "background-opacity": 0.95,
      "border-width": 1, "border-color": "#0ea5e9", "border-opacity": 0.6, "events": "no", "z-compound-depth": "top",
    } },
    { selector: ".selected-source", style: { "border-width": 4, "border-color": "#9333ea", "border-opacity": 1 } },
  ];
}
