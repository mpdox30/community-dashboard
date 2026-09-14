import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// service worker ขั้นต่ำสุด — จำเป็นสำหรับเกณฑ์ installability ของ PWA (ดู public/sw.js)
// ใช้ import.meta.env.BASE_URL แทนการ hardcode "/sw.js" เพราะเว็บ deploy อยู่ที่ path ย่อย
// (GitHub Pages project site "/community-dashboard/") ไม่ใช่ root โดเมน
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
