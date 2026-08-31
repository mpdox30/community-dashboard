export default function TabWaterBalance({ tambon, theme }) {
  const { C, FONT, BRAND_GRAD } = theme;
  const url = tambon?.external_water_balance_url;

  return (
    <div style={{ textAlign: "center", padding: "48px 20px", fontFamily: FONT }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⚖️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 6 }}>
        สมดุลน้ำ{tambon?.name_th}
      </div>
      {url ? (
        <>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
            ระบบวิเคราะห์สมดุลน้ำ (Water Balance) ของตำบล เปิดในหน้าต่างใหม่
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-block", background: BRAND_GRAD, color: "#fff", border: "none", borderRadius: 10,
            padding: "12px 28px", fontSize: 14, fontWeight: 700, textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>🔗 เปิดเว็บสมดุลน้ำ</a>
        </>
      ) : (
        <div style={{ fontSize: 13, color: "#92400e", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "14px 18px", maxWidth: 420, margin: "0 auto" }}>
          ยังไม่ได้ตั้งค่าลิงก์ระบบสมดุลน้ำสำหรับตำบลนี้ — เพิ่มได้ภายหลังผ่าน tambons.external_water_balance_url โดยไม่ต้องแก้โค้ด
        </div>
      )}
    </div>
  );
}
