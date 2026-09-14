import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { STATUS_CONFIG, getStatus, fmt } from "../lib/status";

function makeIcon(cfg, pctText, big) {
  const size = big ? 40 : 32;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${cfg.badge};
                 border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);
                 display:flex;align-items:center;justify-content:center;
                 color:${cfg.badgeText};font-family:Sarabun,sans-serif;font-weight:700;
                 font-size:${big ? 11 : 9}px;line-height:1;">${pctText}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function makeWeirIcon(big) {
  const size = big ? 22 : 16;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:4px;background:#78716c;
                 border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);
                 display:flex;align-items:center;justify-content:center;font-size:${size - 6}px;">🚧</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function WaterMap({ sources, tambon, theme, selectedId, onSelect }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const [showWeirs, setShowWeirs] = useState(true);
  const { C, FONT } = theme;

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const center = [Number(tambon?.center_lat) || 19.0975, Number(tambon?.center_lon) || 99.8536];
    const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView(center, tambon?.default_zoom || 13);

    // ── ตัวเลือกแผนที่พื้นหลัง (basemap switcher) — ใช้ L.control.layers มาตรฐานของ Leaflet ──
    const baseLayers = {
      "🗺️ แผนที่ถนน": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors", maxZoom: 19,
      }),
      "🛰️ ภาพถ่ายดาวเทียม": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles &copy; Esri", maxZoom: 19 }
      ),
      "⛰️ ภูมิประเทศ": L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap (CC-BY-SA)", maxZoom: 17,
      }),
    };
    baseLayers["🗺️ แผนที่ถนน"].addTo(map);
    L.control.layers(baseLayers, null, { position: "topright", collapsed: true }).addTo(map);

    const legend = L.control({ position: "bottomright" });
    legend.onAdd = () => {
      const div = L.DomUtil.create("div");
      div.style.background = "rgba(255,255,255,0.92)";
      div.style.borderRadius = "8px";
      div.style.padding = "6px 10px";
      div.style.fontSize = "11px";
      div.style.fontFamily = "Sarabun, sans-serif";
      div.style.boxShadow = "0 1px 6px rgba(0,0,0,0.15)";
      div.innerHTML = Object.values(STATUS_CONFIG).filter(c => c.label !== "ไม่มีข้อมูล").map(c =>
        `<div style="display:flex;align-items:center;gap:5px;margin:2px 0;">
           <span style="width:11px;height:11px;border-radius:50%;background:${c.badge};display:inline-block;"></span>${c.dot} ${c.label}
         </div>`
      ).join("");
      return div;
    };
    legend.addTo(map);

    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, [tambon]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};

    sources.forEach(s => {
      if (s.lat == null || s.lon == null) return;
      if (s.role === "structure" && !showWeirs) return;
      const isSel = s.id === selectedId;

      let marker;
      if (s.role === "storage") {
        const cfg = STATUS_CONFIG[getStatus(s.pct)];
        const pctText = s.pct != null ? `${Math.round(s.pct)}%` : "—";
        marker = L.marker([s.lat, s.lon], { icon: makeIcon(cfg, pctText, isSel) });
      } else {
        marker = L.marker([s.lat, s.lon], { icon: makeWeirIcon(isSel) });
      }
      marker.addTo(map);

      const cfg = s.role === "storage" ? STATUS_CONFIG[getStatus(s.pct)] : null;
      const popupHtml = `
        <div style="font-family:Sarabun,sans-serif;min-width:160px;">
          <div style="font-weight:700;font-size:13px;">${s.name}</div>
          <div style="font-size:11px;color:#64748b;">หมู่ ${s.moo ?? "—"} ${s.village ?? ""}</div>
          ${s.role === "storage"
            ? `<div style="font-size:18px;font-weight:800;color:${cfg.text};margin-top:4px;">${s.pct != null ? s.pct + "%" : "—"}</div>
               <div style="font-size:11px;color:#64748b;">${s.m3 != null ? fmt(s.m3) + " / " + fmt(s.maxM3) + " ลบ.ม." : ""}</div>`
            : `<div style="font-size:11px;color:#78716c;margin-top:4px;">🚧 ${s.type === "weir" ? "ฝาย" : "โครงสร้าง"} — ไม่มีข้อมูล %</div>`}
        </div>`;
      marker.bindPopup(popupHtml);
      marker.on("click", () => onSelect && onSelect(s.id));
      markersRef.current[s.id] = marker;
    });
  }, [sources, selectedId, onSelect, showWeirs]);

  useEffect(() => {
    const map = mapInstance.current;
    const src = sources.find(s => s.id === selectedId);
    if (map && src && src.lat != null && src.lon != null) {
      map.panTo([src.lat, src.lon], { animate: true });
      markersRef.current[src.id]?.openPopup();
    }
  }, [selectedId]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.muted, fontFamily: FONT, cursor: "pointer" }}>
          <input type="checkbox" checked={showWeirs} onChange={e => setShowWeirs(e.target.checked)} />
          แสดงฝาย/เช็คดำบนแผนที่
        </label>
      </div>

      <div ref={mapRef} style={{
        width: "100%", height: 420, borderRadius: 12, overflow: "hidden",
        border: `1.5px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
      }} />
    </div>
  );
}
