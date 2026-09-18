import { useState, useMemo, useEffect } from "react";
import { TAMBON_SLUG } from "./lib/supabase";
import { useTambon, useSources, useLevelTimeSeries, useRainfall, useRainForecast } from "./lib/dataHooks";
import { buildTheme } from "./lib/theme";
import Header from "./components/Header";
import VillagerView from "./components/VillagerView";
import ManagerView from "./components/ManagerView";
import LoadingScreen from "./components/LoadingScreen";
import { IconSmartphone, IconAlertTriangle } from "./lib/icons";

export default function App() {
  const [mode, setMode] = useState("villager");

  // ── PWA install prompt (พอร์ตจากต้นแบบนครป่าหมาก App.jsx บรรทัด ~4311-4335) ──
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // รับ event จาก browser เมื่อ app พร้อม install (ต้องมี manifest.json + service worker — ดู public/)
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      // แสดง banner หลัง 3 วินาที (ไม่ขึ้นทันทีรบกวนผู้ใช้)
      setTimeout(() => setShowInstallBanner(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const { tambon, loading: tambonLoading, error: tambonError } = useTambon(TAMBON_SLUG);
  const { sources, snap, loading: sourcesLoading, error: sourcesError, reload: reloadSources } = useSources(tambon?.tambon_id);

  const storageIds = useMemo(() => (sources ?? []).filter(s => s.role === "storage").map(s => s.id), [sources]);
  const { ts } = useLevelTimeSeries(storageIds);
  const { rainDaily, rainMonthly, rainYearly } = useRainfall(tambon?.tambon_id);
  const { rainForecast, rainLoading, rainError } = useRainForecast(tambon?.rain_forecast_lat, tambon?.rain_forecast_lon);

  const theme = buildTheme(tambon);

  if (tambonLoading || sourcesLoading || !sources) {
    return <LoadingScreen theme={theme} />;
  }

  if (tambonError || sourcesError || !tambon) {
    return (
      <div style={{ ...theme.base, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", color: "#b91c1c", fontFamily: theme.FONT, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "center" }}><IconAlertTriangle size={40} color="#b91c1c" /></div>
          <div style={{ fontWeight: 700, marginTop: 8 }}>ไม่สามารถโหลดข้อมูลตำบลได้</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>{tambonError || sourcesError || "ไม่พบตำบลนี้ในระบบ"}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={theme.base}>
      {/* ── PWA Install Banner (พอร์ตจากต้นแบบนครป่าหมาก) ── */}
      {showInstallBanner && installPrompt && (
        <div style={{
          background: theme.BRAND_GRAD,
          padding: "10px 16px", display: "flex", alignItems: "center",
          gap: 10, flexWrap: "wrap", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IconSmartphone size={24} color="#fff" />
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: theme.FONT }}>
                เพิ่ม App ลงหน้าจอมือถือ
              </div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: theme.FONT }}>
                เปิดได้ทันทีโดยไม่ต้องพิมพ์ URL
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleInstall} style={{
              background: "#fff", color: theme.C.navy, border: "none", borderRadius: 8,
              padding: "6px 16px", fontFamily: theme.FONT, fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>ติดตั้ง</button>
            <button onClick={() => setShowInstallBanner(false)} style={{
              background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: 8,
              padding: "6px 12px", fontFamily: theme.FONT, fontSize: 13, cursor: "pointer",
            }}>✕</button>
          </div>
        </div>
      )}

      <Header tambon={tambon} theme={theme} mode={mode} setMode={setMode} snap={snap} />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px 40px" }}>
        {mode === "villager"
          ? <VillagerView sources={sources} snap={snap} tambon={tambon} theme={theme} ts={ts} />
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
