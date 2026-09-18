import { fmtDate } from "../lib/status";
import { IconUser, IconTool } from "../lib/icons";

export default function Header({ tambon, theme, mode, setMode, snap }) {
  const { C, FONT, BRAND_GRAD } = theme;
  return (
    <div style={{ background: BRAND_GRAD, color: "#fff", padding: "14px 16px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {tambon?.logo_url && (
            <img src={tambon.logo_url} alt={tambon.name_th} style={{ height: 44, width: 44, borderRadius: "50%", objectFit: "cover", background: "#fff" }} />
          )}
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, fontFamily: FONT }}>
              ระบบติดตามสถานการณ์น้ำ
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, fontFamily: FONT }}>
              {tambon?.name_th ?? ""} {tambon?.amphoe_th ? `อ.${tambon.amphoe_th}` : ""} {tambon?.province_th ? `จ.${tambon.province_th}` : ""}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {[
            { id: "villager", label: "ประชาชน", Icon: IconUser },
            { id: "manager", label: "ผู้ดูแล", Icon: IconTool },
          ].map(m => {
            const active = mode === m.id;
            return (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                border: "1.5px solid rgba(255,255,255,0.5)",
                background: active ? "#fff" : "transparent",
                color: active ? C.navy : "#fff",
                borderRadius: 999, padding: "6px 16px", fontFamily: FONT,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <m.Icon size={15} color={active ? C.navy : "#fff"} />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
      {snap?.date && (
        <div style={{ maxWidth: 960, margin: "6px auto 0", fontSize: 11, opacity: 0.8, fontFamily: FONT }}>
          ข้อมูลล่าสุด ณ {fmtDate(snap.date)}
        </div>
      )}
    </div>
  );
}
