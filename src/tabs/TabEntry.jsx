import { useState } from "react";
import { checkGatePassword, calcLevelPct, submitWaterLevelReading } from "../lib/dataHooks";

/* ─────────────────────────────────────────────
   กรอกข้อมูลระดับน้ำ — ทุกแหล่งพร้อมกันในหน้าเดียว (ตามต้นแบบ)
   ต่างจากต้นแบบตรงที่ยังคงเช็ครหัสผ่านฝั่งเซิร์ฟเวอร์ผ่าน RPC (bcrypt)
   เหมือนเดิมทุกประการ — ไม่ลดระดับความปลอดภัยกลับไปเป็น plaintext ฝั่ง client
   ส่งข้อมูลโดยวนเรียก RPC submit_water_level_reading เดิมทีละแหล่งที่กรอกไว้
   (ไม่ต้องเขียน RPC ใหม่ — ตาราง water_level_daily upsert ปลอดภัยอยู่แล้วต่อ (source_id, reading_date))
───────────────────────────────────────────── */
export default function TabEntry({ storageSources, tambonId, theme, onSubmitted }) {
  const { C, FONT, BRAND_GRAD } = theme;
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(false);

  const [recorder, setRecorder] = useState("");
  const [obsDate, setObsDate] = useState(new Date().toISOString().slice(0, 10));
  // rows: { [sourceId]: { value: string, pct: number|null, pctLoading: bool, status: 'idle'|'saving'|'success'|'error', errMsg } }
  const [rows, setRows] = useState({});
  const [phase, setPhase] = useState("form"); // form | submitting | done

  const handleAuth = async () => {
    setChecking(true);
    try {
      const ok = await checkGatePassword(tambonId, "manager_tab", pwInput);
      if (ok) { setAuthorized(true); setPwError(false); }
      else { setPwError(true); setPwInput(""); }
    } catch { setPwError(true); }
    finally { setChecking(false); }
  };

  const getRow = (id) => rows[id] ?? { value: "", pct: null, pctLoading: false, status: "idle", errMsg: "" };

  const handleValueChange = async (sourceId, val) => {
    setRows(r => ({ ...r, [sourceId]: { ...getRow(sourceId), value: val, pct: null, status: "idle" } }));
    const num = parseFloat(val);
    if (val === "" || isNaN(num)) return;
    setRows(r => ({ ...r, [sourceId]: { ...getRow(sourceId), value: val, pctLoading: true } }));
    try {
      const pct = await calcLevelPct(sourceId, num);
      setRows(r => ({ ...r, [sourceId]: { ...getRow(sourceId), value: val, pct, pctLoading: false } }));
    } catch {
      setRows(r => ({ ...r, [sourceId]: { ...getRow(sourceId), value: val, pctLoading: false } }));
    }
  };

  const filledSourceIds = storageSources.map(s => s.id).filter(id => getRow(id).value !== "");

  const handleSubmitAll = async () => {
    if (!recorder.trim()) { alert("กรุณาระบุชื่อผู้บันทึก"); return; }
    if (filledSourceIds.length === 0) { alert("กรุณากรอกระดับน้ำอย่างน้อย 1 แหล่ง"); return; }

    setPhase("submitting");
    for (const sourceId of filledSourceIds) {
      setRows(r => ({ ...r, [sourceId]: { ...getRow(sourceId), status: "saving" } }));
      try {
        const row = getRow(sourceId);
        const res = await submitWaterLevelReading({
          tambonId, sourceId, readingDate: obsDate,
          levelValue: parseFloat(row.value), levelPct: row.pct,
          enteredBy: recorder, password: pwInput,
        });
        if (res?.success) {
          setRows(r => ({ ...r, [sourceId]: { ...getRow(sourceId), status: "success" } }));
        } else {
          setRows(r => ({ ...r, [sourceId]: { ...getRow(sourceId), status: "error", errMsg: res?.error ?? "ไม่ทราบสาเหตุ" } }));
        }
      } catch (err) {
        setRows(r => ({ ...r, [sourceId]: { ...getRow(sourceId), status: "error", errMsg: err.message ?? "เชื่อมต่อไม่ได้" } }));
      }
    }
    setPhase("done");
  };

  const resetForm = () => {
    setRows({});
    setPhase("form");
    onSubmitted?.();
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

  if (phase === "done") {
    const successCount = filledSourceIds.filter(id => getRow(id).status === "success").length;
    const errorIds = filledSourceIds.filter(id => getRow(id).status === "error");
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", fontFamily: FONT, maxWidth: 480 }}>
        <div style={{ fontSize: 56 }}>{errorIds.length === 0 ? "✅" : "⚠️"}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: errorIds.length === 0 ? "#15803d" : "#c2410c", marginTop: 12 }}>
          บันทึกสำเร็จ {successCount} / {filledSourceIds.length} แหล่ง
        </div>
        {errorIds.length > 0 && (
          <div style={{ marginTop: 14, textAlign: "left", background: "#fef2f2", border: "1.5px solid #ef4444", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#b91c1c" }}>
            {errorIds.map(id => {
              const s = storageSources.find(x => x.id === id);
              return <div key={id}>❌ {s?.name}: {getRow(id).errMsg}</div>;
            })}
          </div>
        )}
        <button onClick={resetForm} style={{
          marginTop: 20, background: C.teal, color: "#fff", border: "none", borderRadius: 8,
          padding: "8px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>กรอกข้อมูลใหม่</button>
      </div>
    );
  }

  const submitting = phase === "submitting";

  return (
    <div style={{ maxWidth: 640, fontFamily: FONT }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 16 }}>📝 บันทึกระดับน้ำ — กรอกได้ทุกแหล่งในหน้าเดียว</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>ชื่อผู้บันทึก *</label>
          <input value={recorder} onChange={e => setRecorder(e.target.value)} placeholder="ชื่อ-สกุล" disabled={submitting}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontFamily: FONT, fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>วันที่วัดน้ำ *</label>
          <input type="date" value={obsDate} onChange={e => setObsDate(e.target.value)} disabled={submitting}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontFamily: FONT, fontSize: 14, boxSizing: "border-box" }} />
        </div>
      </div>

      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
        กรอกเฉพาะแหล่งที่วัดได้จริง — เว้นว่างแหล่งที่ยังไม่ได้วัดในรอบนี้ไว้ได้ (จะไม่ถูกบันทึกทับข้อมูลเดิม)
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {storageSources.map(s => {
          const row = getRow(s.id);
          const statusIcon = { idle: null, saving: "⏳", success: "✅", error: "❌" }[row.status];
          return (
            <div key={s.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
              background: row.status === "error" ? "#fef2f2" : row.status === "success" ? "#f0fdf4" : C.card,
              border: `1.5px solid ${row.status === "error" ? "#fca5a5" : C.border}`, borderRadius: 8,
            }}>
              <div style={{ flex: "1 1 140px", fontSize: 13, fontWeight: 600 }}>{s.name}</div>
              <input type="number" step="0.01" value={row.value} disabled={submitting}
                onChange={e => handleValueChange(s.id, e.target.value)}
                placeholder="ระดับ (ม.)"
                style={{ width: 110, padding: "6px 8px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontFamily: FONT, fontSize: 13, boxSizing: "border-box" }} />
              <div style={{ width: 90, fontSize: 11, color: C.muted, textAlign: "right" }}>
                {row.pctLoading ? "กำลังคำนวณ…" : row.pct != null ? `≈ ${Math.round(row.pct * 10) / 10}%` : ""}
              </div>
              {statusIcon && <div style={{ fontSize: 14 }}>{statusIcon}</div>}
            </div>
          );
        })}
      </div>

      <button onClick={handleSubmitAll} disabled={submitting} style={{
        background: submitting ? "#94a3b8" : BRAND_GRAD, color: "#fff", border: "none", borderRadius: 8,
        padding: "10px 32px", fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
      }}>{submitting ? "⏳ กำลังบันทึก…" : `✅ บันทึกข้อมูล (${filledSourceIds.length} แหล่ง)`}</button>
    </div>
  );
}
