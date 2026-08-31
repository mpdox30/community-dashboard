import { useState, useMemo } from "react";
import { TAMBON_SLUG } from "./lib/supabase";
import { useTambon, useSources, useLevelTimeSeries, useRainfall, useRainForecast } from "./lib/dataHooks";
import { buildTheme } from "./lib/theme";
import Header from "./components/Header";
import VillagerView from "./components/VillagerView";
import ManagerView from "./components/ManagerView";

export default function App() {
  const [mode, setMode] = useState("villager");

  const { tambon, loading: tambonLoading, error: tambonError } = useTambon(TAMBON_SLUG);
  const { sources, snap, loading: sourcesLoading, error: sourcesError, reload: reloadSources } = useSources(tambon?.tambon_id);

  const storageIds = useMemo(() => (sources ?? []).filter(s => s.role === "storage").map(s => s.id), [sources]);
  const { ts } = useLevelTimeSeries(storageIds);
  const { rainDaily, rainMonthly, rainYearly } = useRainfall(tambon?.tambon_id);
  const { rainForecast, rainLoading, rainError } = useRainForecast(tambon?.rain_forecast_lat, tambon?.rain_forecast_lon);

  const theme = buildTheme(tambon);

  if (tambonLoading || sourcesLoading || !sources) {
    return (
      <div style={{ ...theme.base, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", color: theme.C.navy, fontFamily: theme.FONT }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💧</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>กำลังโหลดข้อมูล…</div>
          <div style={{ fontSize: 12, color: theme.C.muted, marginTop: 6 }}>ดึงข้อมูลล่าสุดจาก Supabase</div>
        </div>
      </div>
    );
  }

  if (tambonError || sourcesError || !tambon) {
    return (
      <div style={{ ...theme.base, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", color: "#b91c1c", fontFamily: theme.FONT, padding: 20 }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ fontWeight: 700, marginTop: 8 }}>ไม่สามารถโหลดข้อมูลตำบลได้</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>{tambonError || sourcesError || "ไม่พบตำบลนี้ในระบบ"}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={theme.base}>
      <Header tambon={tambon} theme={theme} mode={mode} setMode={setMode} snap={snap} />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px 40px" }}>
        {mode === "villager"
          ? <VillagerView sources={sources} snap={snap} tambon={tambon} theme={theme} />
          : <ManagerView
              sources={sources} snap={snap} tambon={tambon} ts={ts}
              rainDaily={rainDaily} rainMonthly={rainMonthly} rainYearly={rainYearly}
              rainForecast={rainForecast} rainLoading={rainLoading} rainError={rainError}
              theme={theme} reloadSources={reloadSources}
            />}
      </div>

      <div style={{ background: theme.C.navy, fontFamily: theme.FONT, textAlign: "center", padding: "14px 20px", color: "rgba(255,255,255,0.75)", fontSize: 11 }}>
        องค์การบริหารส่วนตำบล{tambon.name_th?.replace("ตำบล", "")} อ.{tambon.amphoe_th} จ.{tambon.province_th}
        <div style={{ marginTop: 4, opacity: 0.7 }}>
          {snap?.date ? `ข้อมูลล่าสุด ${snap.date}` : "ยังไม่มีข้อมูล"} · ระบบติดตามสถานการณ์น้ำ
        </div>
      </div>
    </div>
  );
}
