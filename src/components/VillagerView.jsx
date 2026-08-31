import { useState } from "react";
import StatusSummary from "./StatusSummary";
import TotalBar from "./TotalBar";
import AlertBanner from "./AlertBanner";
import WaterMap from "./WaterMap";
import WaterNetworkPanel from "./WaterNetworkPanel";
import VillagerFormButton from "./VillagerFormButton";
import PrintReport from "./PrintReport";

export default function VillagerView({ sources, snap, tambon, theme }) {
  const [tab, setTab] = useState("map");
  const [selectedId, setSelectedId] = useState(null);
  const { C, FONT } = theme;

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
        : <WaterNetworkPanel sources={sources} theme={theme} selectedId={selectedId} onSelect={setSelectedId} />}

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
