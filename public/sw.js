// Service worker แบบขั้นต่ำสุด — มีไว้เพื่อผ่านเกณฑ์ installability ของ PWA เท่านั้น
// (browser กำหนดว่าต้องมี service worker ที่ลงทะเบียนไว้ ถึงจะยิง beforeinstallprompt ได้)
// ไม่มี offline cache / ไม่ intercept request ใดๆ ทั้งสิ้น — ปล่อยผ่านไป network ตามปกติ
// เพื่อไม่ให้กระทบพฤติกรรมการดึงข้อมูลสดจาก Supabase ที่ต้องเป็นข้อมูลล่าสุดเสมอ
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {}); // no-op: ปล่อยให้ browser จัดการ request ตามปกติ
