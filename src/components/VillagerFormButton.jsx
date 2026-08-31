import { useState } from "react";
import { checkGatePassword } from "../lib/dataHooks";

const FORM_URL = import.meta.env.VITE_VILLAGER_FORM_URL || "";

export default function VillagerFormButton({ tambonId, theme }) {
  const [show, setShow] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [checking, setChecking] = useState(false);
  const { C, FONT, BRAND_GRAD } = theme;

  const handleAuth = async () => {
    setChecking(true);
    try {
      const ok = await checkGatePassword(tambonId, "villager_form", pwInput);
      if (ok) {
        if (FORM_URL) window.open(FORM_URL, "_blank", "noopener,noreferrer");
        setShow(false); setPwInput(""); setPwError(false);
      } else {
        setPwError(true); setPwInput("");
      }
    } catch {
      setPwError(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <button onClick={() => setShow(true)} style={{
        background: BRAND_GRAD, color: "#fff", border: "none", borderRadius: 10,
        padding: "10px 20px", fontFamily: FONT, fontSize: 14, fontWeight: 700, cursor: "pointer",
      }}>📝 แจ้งข้อมูลระดับน้ำ</button>

      {show && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
        }} onClick={() => setShow(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 16, padding: "28px 24px", maxWidth: 300, width: "90%",
            textAlign: "center", fontFamily: FONT,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
            <div style={{ fontWeight: 700, color: C.navy, marginBottom: 12 }}>กรอกรหัสผ่าน</div>
            <input type="password" value={pwInput} autoFocus
              onChange={e => { setPwInput(e.target.value); setPwError(false); }}
              onKeyDown={e => e.key === "Enter" && handleAuth()}
              style={{ width: "100%", padding: "10px", fontSize: 16, textAlign: "center", letterSpacing: 4,
                       border: `1.5px solid ${pwError ? "#ef4444" : "#cbd5e1"}`, borderRadius: 8, boxSizing: "border-box" }} />
            {pwError && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 6 }}>รหัสผ่านไม่ถูกต้อง</div>}
            {!FORM_URL && <div style={{ color: "#92400e", fontSize: 11, marginTop: 10 }}>
              (ยังไม่ได้ตั้งค่าลิงก์แบบฟอร์มสำหรับตำบลนี้)
            </div>}
            <button onClick={handleAuth} disabled={checking} style={{
              marginTop: 14, width: "100%", padding: "10px", background: BRAND_GRAD, color: "#fff",
              border: "none", borderRadius: 8, fontFamily: FONT, fontWeight: 700, cursor: "pointer",
            }}>{checking ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ →"}</button>
          </div>
        </div>
      )}
    </>
  );
}
