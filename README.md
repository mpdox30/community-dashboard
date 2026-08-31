# ระบบติดตามสถานการณ์น้ำ — ตำบลแม่นาเรือ

เว็บแอปสำหรับติดตามสถานการณ์น้ำ (ระดับน้ำ/ปริมาณฝน/ความเสี่ยงขาดแคลนน้ำ) ของตำบลแม่นาเรือ
อำเภอเมือง จังหวัดพะเยา สำหรับผู้บริหารจัดการน้ำในตำบลและประชาชนทั่วไป

## เทคโนโลยีที่ใช้

- Frontend: React + Vite
- แผนที่: Leaflet
- กราฟ: Recharts
- Backend/Database: Supabase (Postgres)

## รัน dev

```bash
npm install
npm run dev
```

ต้องมีไฟล์ `.env` กำหนดค่า `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TAMBON_SLUG`
(ดูตัวอย่างใน `.env.example`)

## Build

```bash
npm run build
```

ได้ static site ในโฟลเดอร์ `dist/` — deploy อัตโนมัติขึ้น GitHub Pages ผ่าน GitHub Actions
เมื่อ push เข้า branch `main` (ดู `.github/workflows/deploy.yml`)

## โครงสร้างโค้ด

- `src/lib/` — Supabase client และ data fetching hooks
- `src/components/` — UI components ที่ใช้ร่วมกันหลายหน้า (Header, Map, SourceCard ฯลฯ)
- `src/tabs/` — แท็บต่างๆ ของหน้า Manager View (ภาพรวม/แนวโน้ม/ฝน/ความเสี่ยง/เกษตร/กรอกข้อมูล/สมดุลน้ำ)

## License

โครงการนี้จัดทำเพื่อประโยชน์สาธารณะของตำบลแม่นาเรือ
