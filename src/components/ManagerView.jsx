import { useState } from "react";
import TabOverview from "../tabs/TabOverview";
import TabTrend from "../tabs/TabTrend";
import TabRainfall from "../tabs/TabRainfall";
import TabRisk from "../tabs/TabRisk";
import TabCrop from "../tabs/TabCrop";
import TabEntry from "../tabs/TabEntry";
import TabWaterBalance from "../tabs/TabWaterBalance";
import { IconOverview, IconTrend, IconRain, IconAlertTriangle, IconCrop, IconClipboardCheck, IconScale } from "../lib/icons";

const MGR_TABS = [
  { id: "overview", label: "ภาพรวม", Icon: IconOverview },
  { id: "trend",    label: "แนวโน้ม", Icon: IconTrend },
  { id: "rain",     label: "ข้อมูลฝน", Icon: IconRain },
  { id: "risk",     label: "ความเสี่ยง", Icon: IconAlertTriangle },
  { id: "crop",     label: "การเกษตร", Icon: IconCrop },
  { id: "entry",    label: "กรอกข้อมูล", Icon: IconClipboardCheck },
  { id: "balance",  label: "สมดุลน้ำตำบล", Icon: IconScale },
];

export default function ManagerView({ sources, snap, tambon, ts, rainDaily, rainMonthly, rainYearly, rainForecast, rainLoading, rainError, theme, reloadSources }) {
  const [tab, setTab] = useState("overview");
  const { C, FONT } = theme;
  const storageSources = sources.filter(s => s.role === "storage");

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginTop: 16, marginBottom: 20, overflowX: "auto", paddingBottom: 2 }}>
        {MGR_TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              border: `1.5px solid ${active ? C.sky : "#cbd5e1"}`,
              background: active ? "#e0f2fe" : "#fff",
              borderRadius: "8px 8px 0 0", padding: "8px 16px", cursor: "pointer",
              fontFamily: FONT, fontSize: 13, fontWeight: active ? 700 : 400,
              color: active ? C.navy : C.muted, whiteSpace: "nowrap",
              borderBottom: active ? "2px solid #0ea5e9" : "1.5px solid #cbd5e1",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <t.Icon size={16} color={active ? C.navy : C.muted} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <TabOverview sources={sources} theme={theme} />}
      {tab === "trend"    && <TabTrend storageSources={storageSources} ts={ts} rainDaily={rainDaily} rainMonthly={rainMonthly} theme={theme} />}
      {tab === "rain"     && <TabRainfall rainDaily={rainDaily} rainMonthly={rainMonthly} rainYearly={rainYearly}
                                           rainForecast={rainForecast} rainLoading={rainLoading} rainError={rainError} theme={theme} />}
      {tab === "risk"     && <TabRisk storageSources={storageSources} theme={theme} />}
      {tab === "crop"     && <TabCrop sources={sources} snap={snap} tambon={tambon} theme={theme} rainMonthly={rainMonthly} />}
      {tab === "entry"    && <TabEntry storageSources={storageSources} tambonId={tambon?.tambon_id} theme={theme} onSubmitted={reloadSources} />}
      {tab === "balance"  && <TabWaterBalance tambon={tambon} theme={theme} />}
    </div>
  );
}
