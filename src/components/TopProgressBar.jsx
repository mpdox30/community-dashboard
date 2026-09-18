/* ─────────────────────────────────────────────
   แถบโหลดบางๆ ด้านบนหน้าจอ — แสดงเฉพาะตอน "โหลดข้อมูลใหม่ซ้ำ" (background refresh เช่น
   หลังบันทึกข้อมูลระดับน้ำจากแท็บกรอกข้อมูล) ไม่ใช่ตอนเปิดแอปครั้งแรก (ตอนนั้นใช้
   LoadingScreen เดิมที่มีอนิเมชันรดน้ำต้นไม้อยู่แล้ว ไม่แตะ) ให้ความรู้สึก responsive
   แทนที่จะกระพริบทั้งหน้าจอทุกครั้งที่ข้อมูลอัปเดต
───────────────────────────────────────────── */
export default function TopProgressBar({ active, theme }) {
  const { C } = theme;
  if (!active) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 999, background: "rgba(255,255,255,0.35)", overflow: "hidden" }}>
      <div style={{
        position: "absolute", top: 0, bottom: 0, width: "40%",
        background: `linear-gradient(90deg, transparent, ${C.teal}, ${C.navy}, transparent)`,
        animation: "mnr-topbar-sweep 1.1s ease-in-out infinite",
      }} />
      <style>{`
        @keyframes mnr-topbar-sweep {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
