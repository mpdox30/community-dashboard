import { useState } from "react";
import { checkGatePassword, calcLevelPct, submitWaterLevelReading } from "../lib/dataHooks";

export default function TabEntry({ storageSources, tambonId, theme, onSubmitted }) {
  const { C, FONT, BRAND_GRAD } = theme;
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(false);

  const [sourceId, setSourceId] = useState(storageSources[0]?.id ?? "");
  const [levelValue, setLevelValue] = useState("");
  const [levelPct, setLevelPct] = useState(null);
  const [pctLoading, setPctLoading] = useState(false);
  const [recorder, setRecorder] = useState("");
  const [obsDate, setObsDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");

  const handleAuth = async () => {
    setChecking(true);
    try {
      const ok = await checkGatePassword(tambonId, "manager_tab", pwInput);
      if (ok) { setAuthorized(true); setPwError(false); }
      else { setPwError(true); setPwInput(""); }
    } catch { setPwError(true); }
    finally { setChecking(false); }
  };

  const handleLevelChange = async (val) => {
    setLevelValue(val);
    setLevelPct(null);
    const num = parseFloat(val);
    if (val === "" || isNaN(num)) return;
    setPctLoading(true);
    try {
      const pct = await calcLevelPct(sourceId, num);
      setLevelPct(pct);
    } catch { /* เงียบ — ไม่มี curve/calibration ก็ยังบันทึกระดับ (ม.) ได้ */ }
    finally { setPctLoading(false); }
  };

  const handleSubmit = async () => {
    if (!recorder.trim()) { alert("กรุณาระบุชื่อผู้บันทึก"); return; }
    if (!levelValue) { alert("กรุณากรอกระดับน้ำ"); return; }
    setStatus("loading"); setErrMsg("");
    try {
      const res = await submitWaterLevelReading({
        tambonId, sourceId, readingDate: obsDate,
        levelValue: parseFloat(levelValue), levelPct,
        enteredBy: recorder, password: pwInput,
      });
      if (res?.success) setStatus("success");
      else { setStatus("error"); setErrMsg(res?.error ?? "ไม่ทราบสาเหตุ"); }
    } catch (err) {
      setStatus("error"); setErrMsg(err.message ?? "เชื่อมต่อไม่ได้");
    }
  };

  if (!authorized) {
    return (
      <div style={{
        maxWidth: 320, margin: "48px auto", textAlign: "center", padding: "32px 28px",
        background: C.card, borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
        border: `1.5px solid ${pwError ? "#fca5a5" : C.border}`, fontFamily: FONT,
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 4 }}>กรอกรหัสผ่าน</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>เฉพาะผู้มีสิทธิ์กรอกข้อมูลเท่านั้น</div>
        <input type="password" value={pwInput} autoFocus
          onChange={e => { setPwInput(e.target.value); setPwError(false); }}
          onKeyDown={e => e.key === "Enter" && handleAuth()}
          style={{ width: "100%", padding: "10px 14px", fontSize: 16, border: `1.5px solid ${pwError ? "#ef4444" : "#cbd5e1"}`,
                   borderRadius: 8, boxSizing: "border-box", outline: "none", letterSpacing: 4, textAlign: "center" }} />
        {pwError && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 8 }}>รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่</div>}
        <button onClick={handleAuth} disabled={checking} style={{
          marginTop: 16, width: "100%", padding: "10px", background: BRAND_GRAD, color: "#fff",
          border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}>{checking ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ →"}</button>
      </div>
    );
  }

  if (status === "success") return (
    <div style={{ textAlign: "center", padding: "40px 20px", fontFamily: FONT }}>
      <div style={{ fontSize: 56 }}>✅</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#15803d", marginTop: 12 }}>บันทึกสำเร็จ!</div>
      <div style={{ color: C.muted, marginTop: 8, fontSize: 14 }}>ข้อมูลถูกบันทึกลงระบบแล้ว</div>
      <button onClick={() => { setStatus("idle"); setLevelValue(""); setLevelPct(null); setRecorder(""); onSubmitted?.(); }} style={{
        marginTop: 20, background: C.teal, color: "#fff", border: "none", borderRadius: 8,
        padding: "8px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer",
      }}>กรอกข้อมูลใหม่</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 480, fontFamily: FONT }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 16 }}>📝 บันทึกระดับน้ำ</div>

      {status === "error" && (
        <div style={{ background: "#fef2f2", border: "1.5px solid #ef4444", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#b91c1c" }}>
          ❌ ส่งข้อมูลไม่สำเร็จ: {errMsg}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>แหล่งน้ำ *</label>
        <select value={sourceId} onChange={e => { setSourceId(e.target.value); setLevelPct(null); }}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontFamily: FONT, fontSize: 14 }}>
          {storageSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>ชื่อผู้บันทึก *</label>
          <input value={recorder} onChange={e => setRecorder(e.target.value)} placeholder="ชื่อ-สกุล"
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontFamily: FONT, fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>วันที่วัดน้ำ *</label>
          <input type="date" value={obsDate} onChange={e => setObsDate(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontFamily: FONT, fontSize: 14, boxSizing: "border-box" }} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>ระดับน้ำ (เมตร) *</label>
        <input type="number" step="0.01" value={levelValue} onChange={e => handleLevelChange(e.target.value)}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontFamily: FONT, fontSize: 14, boxSizing: "border-box" }} />
        {pctLoading && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>กำลังคำนวณ %…</div>}
        {levelPct != null && !pctLoading && (
          <div style={{ fontSize: 12, color: C.navy, marginTop: 4 }}>≈ {Math.round(levelPct * 10) / 10}% ของความจุ</div>
        )}
      </div>

      <button onClick={handleSubmit} disabled={status === "loading"} style={{
        background: status === "loading" ? "#94a3b8" : BRAND_GRAD, color: "#fff", border: "none", borderRadius: 8,
        padding: "10px 32px", fontSize: 15, fontWeight: 700, cursor: status === "loading" ? "not-allowed" : "pointer",
      }}>{status === "loading" ? "⏳ กำลังส่ง…" : "✅ บันทึกข้อมูล"}</button>
    </div>
  );
}
