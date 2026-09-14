import { fmt } from "../lib/status";
import CropWaterPlanner from "./CropWaterPlanner";

/* ETc เต็มฤดู (100 วัน) ≈ 483 มม. → น้ำต่อไร่ = 483×1600/1000 ≈ 773 ลบ.ม./ไร่ (Kc ข้าว=1.05 ×
   ET0=4.6 มม./วัน, ไม่รวมฝน) — ค่านี้ขึ้นกับภูมิอากาศ/พันธุ์พืชเฉพาะพื้นที่ (RID เองก็คำนวณแยกตามพื้นที่
   ไม่มีค่าคงที่ระดับประเทศ) จึงย้ายมาเป็น config ต่อตำบล (tambons.etc_m3_per_rai_per_season) ค่า
   default 773 = สูตรเดิมจากต้นฉบับทุกประการ (ตำบลที่ยังไม่ตั้งค่าเอง = พฤติกรรมเดิมไม่เปลี่ยน) */
const ETc_FALLBACK = 773;

export default function TabCrop({ sources, snap, tambon, theme, rainMonthly }) {
  const { C, FONT } = theme;
  const ETc_FULL_M3_PER_RAI = tambon?.etc_m3_per_rai_per_season ?? ETc_FALLBACK;
  const storage = sources.filter(s => s.role === "storage");
  const withRai = storage.filter(s => s.beneficiaryRai);
  const withoutRai = storage.filter(s => !s.beneficiaryRai);

  const totalM3 = storage.reduce((s, x) => s + (x.m3 ?? 0), 0);
  const totalRaiSupport = Math.floor(totalM3 / ETc_FULL_M3_PER_RAI);

  const rows = withRai.map(s => {
    const m3PerRai = s.m3 != null ? s.m3 / s.beneficiaryRai : null;
    const raiSupport = s.m3 != null ? Math.floor(s.m3 / ETc_FULL_M3_PER_RAI) : null;
    const raiPct = raiSupport != null ? Math.min(100, (raiSupport / s.beneficiaryRai) * 100) : null;
    const isRisky = raiPct != null && raiPct < 100;
    return { ...s, m3PerRai, raiSupport, raiPct, isRisky };
  });

  // สรุปเชิงการวางแผน — เฉพาะแหล่งที่มีข้อมูลพื้นที่รับประโยชน์ (ตามต้นฉบับทุกประการ)
  const totalRai = rows.reduce((s, r) => s + r.beneficiaryRai, 0);
  const riskyCount = rows.filter(r => r.isRisky).length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10, marginBottom: 16 }}>
        <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 20 }}>💧</div>
          <div style={{ fontSize: 10, color: C.muted }}>น้ำต้นทุนรวมที่เหลือ</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.navy }}>{(totalM3 / 1000000).toFixed(2)} ล้าน ลบ.ม.</div>
          <div style={{ fontSize: 10, color: C.muted }}>ณ {snap?.date ?? "—"}</div>
        </div>
        <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 20 }}>📐</div>
          <div style={{ fontSize: 10, color: C.muted }}>รองรับนาได้สูงสุด (ทุกแหล่งรวม)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.navy }}>{totalRaiSupport.toLocaleString("th-TH")} ไร่</div>
          <div style={{ fontSize: 10, color: C.muted }}>≈ {ETc_FULL_M3_PER_RAI.toLocaleString("th-TH")} ลบ.ม./ไร่/ฤดู</div>
        </div>
        <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 20 }}>🌾</div>
          <div style={{ fontSize: 10, color: C.muted }}>แหล่งที่มีข้อมูลพื้นที่รับประโยชน์</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.navy }}>{withRai.length} / {storage.length} แห่ง</div>
        </div>
      </div>

      <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400e", marginBottom: 16, fontFamily: FONT }}>
        📐 <strong>วิธีคำนวณ:</strong> น้ำ 1 ไร่/ฤดู ≈ <strong>{ETc_FULL_M3_PER_RAI.toLocaleString("th-TH")} ลบ.ม./ไร่</strong> · ไม่รวมฝน ·{" "}
        {tambon?.etc_note_th
          ? tambon.etc_note_th
          : `ค่าเริ่มต้น ${ETc_FALLBACK} = ETc สะสม 100 วัน (483 มม.) × 1,600 ม²/ไร่ ÷ 1,000 ตามสูตรต้นฉบับ (ข้าวนาปรัง, Kc=1.05 × ET0=4.6 มม./วัน) — ปรับค่านี้ต่อตำบลได้ตามพืช/ภูมิอากาศท้องถิ่นจริง`}
      </div>

      {rows.length > 0 && (
        <>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 10, fontFamily: FONT }}>
            🌾 น้ำต้นทุนต่อพื้นที่เพาะปลูก รายแหล่งน้ำ (เฉพาะแหล่งที่มีข้อมูลพื้นที่รับประโยชน์)
          </div>
          {/* เรียงจากแหล่งที่มีน้ำต่อไร่น้อยที่สุดก่อน (เสี่ยงที่สุดขึ้นก่อน) — ตามต้นฉบับ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 10, marginBottom: 20 }}>
            {[...rows].sort((a, b) => a.m3PerRai - b.m3PerRai).map(r => (
              <div key={r.id} style={{
                background: r.isRisky ? "#fef2f2" : "#f0fdf4", border: `1.5px solid ${r.isRisky ? "#fca5a5" : "#86efac"}`,
                borderRadius: 12, padding: "12px 14px", fontFamily: FONT,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                      หมู่ {r.moo ?? "—"} · พื้นที่รับประโยชน์ {r.beneficiaryRai.toLocaleString("th-TH")} ไร่
                      {r.beneficiaryPopulation != null && ` · อุปโภคบริโภค ${r.beneficiaryPopulation.toLocaleString("th-TH")} คน`}
                    </div>
                  </div>
                  <span style={{
                    background: r.isRisky ? "#fecaca" : "#bbf7d0", color: r.isRisky ? "#b91c1c" : "#15803d",
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap",
                  }}>
                    {r.isRisky ? "⚠️ เสี่ยง" : "✅ พอเพียง"}
                  </span>
                </div>

                {/* ── สอง stat หลัก: (1) น้ำที่มีตอนนี้ต่อไร่ ถ้าใช้กับพื้นที่ทั้งหมด (2) พื้นที่ที่รองรับได้ถ้าใช้เต็มสูตร 773 ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "6px 10px" }}>
                    <div style={{ fontSize: 9, color: C.muted }}>น้ำต่อไร่ ณ ปัจจุบัน</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.navy }}>
                      {r.m3PerRai == null ? "—" : r.m3PerRai >= 1000
                        ? `${(r.m3PerRai / 1000).toFixed(1)}K`
                        : Math.round(r.m3PerRai).toLocaleString("th-TH")}
                    </div>
                    <div style={{ fontSize: 9, color: C.muted }}>ลบ.ม./ไร่ (ถ้าใช้กับพื้นที่ทั้งหมด)</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "6px 10px" }}>
                    <div style={{ fontSize: 9, color: C.muted }}>รองรับได้เต็มสูตร ({ETc_FULL_M3_PER_RAI} ลบ.ม./ไร่)</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: r.isRisky ? "#ef4444" : "#22c55e" }}>
                      {r.raiSupport?.toLocaleString("th-TH")}
                    </div>
                    <div style={{ fontSize: 9, color: C.muted }}>ไร่ จาก {r.beneficiaryRai.toLocaleString("th-TH")} ไร่</div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginBottom: 3 }}>
                    <span>รองรับได้</span>
                    <span style={{ fontWeight: 700, color: r.isRisky ? "#ef4444" : "#22c55e" }}>
                      {r.raiPct?.toFixed(0)}% ของพื้นที่รับประโยชน์
                    </span>
                  </div>
                  <div style={{ background: "#e2e8f0", borderRadius: 999, height: 8, overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(100, r.raiPct ?? 0)}%`, height: "100%",
                      background: r.raiPct >= 100 ? "#22c55e" : r.raiPct >= 50 ? "#eab308" : "#ef4444",
                      borderRadius: 999,
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── สรุปเชิงการวางแผน — ตามต้นฉบับทุกประการ ── */}
          <div style={{ marginBottom: 16, background: "#f0f9ff", border: "1.5px solid #bae6fd", borderRadius: 12, padding: "14px 16px", fontFamily: FONT }}>
            <div style={{ fontWeight: 700, color: C.navy, marginBottom: 8, fontSize: 13 }}>
              📋 สรุปเชิงการวางแผน
            </div>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.8 }}>
              • พื้นที่เพาะปลูก{withoutRai.length > 0 ? "ที่มีข้อมูล" : "ทั้งตำบล"} <strong>{totalRai.toLocaleString("th-TH")} ไร่</strong> ต้องการน้ำรวม{" "}
              <strong>{(totalRai * ETc_FULL_M3_PER_RAI / 1000000).toFixed(2)} ล้าน ลบ.ม.</strong>/ฤดู<br />
              • น้ำที่เหลือในปัจจุบัน (<strong>{(totalM3 / 1000000).toFixed(2)} ล้าน ลบ.ม.</strong>) รองรับนาได้{" "}
              <strong>{totalRaiSupport.toLocaleString("th-TH")} ไร่</strong>{" "}
              ({totalRai > 0 ? ((totalRaiSupport / totalRai) * 100).toFixed(0) : "—"}% ของพื้นที่{withoutRai.length > 0 ? "ที่มีข้อมูล" : "ทั้งหมด"})<br />
              • มี <strong style={{ color: "#b91c1c" }}>{riskyCount} แหล่ง</strong> ที่น้ำอาจไม่พอสำหรับฤดูกาลถัดไป
              ควรวางแผนการจัดสรรน้ำก่อนเปิดฤดูกาล
            </div>
          </div>

          <div style={{ marginBottom: 20, fontSize: 11, color: C.muted, fontFamily: FONT }}>
            ที่มา: {tambon?.etc_note_th ?? `Kc curve ข้าวจาก FAO-56 · ET₀ = 4.6 มม./วัน (ค่าเฉลี่ยพิษณุโลก, สูตรต้นฉบับ)`}
          </div>
        </>
      )}

      {withoutRai.length > 0 && (
        <div style={{ background: "#f8fafc", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 12, color: C.muted, fontFamily: FONT }}>
          ℹ️ ยังไม่มีข้อมูลพื้นที่เพาะปลูก (rai) ต่อแหล่งน้ำสำหรับอีก {withoutRai.length} แห่ง ({withoutRai.map(s => s.name).join(", ")})
          — ต้องสำรวจภาคสนามหรือรับข้อมูลจาก อบต. เพิ่มเติมก่อนจะคำนวณความเสี่ยงต่อพื้นที่ได้ครบทุกแหล่ง
        </div>
      )}

      {/* ── CropWaterPlanner (เฟส 2, GAP_ANALYSIS §3.2) — เพิ่มต่อท้าย ไม่กระทบส่วนสรุปด้านบนเลย ── */}
      {storage.length > 0 && <CropWaterPlanner sources={storage} rainMonthly={rainMonthly} theme={theme} />}
    </div>
  );
}
