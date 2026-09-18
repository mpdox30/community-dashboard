/* ─────────────────────────────────────────────
   ชุดไอคอน Duotone ใช้ร่วมกันทั้งเว็บแม่นาเรือ — เส้น (stroke) เต็มสี +
   พื้นเติม (fill) จางๆ สีเดียวกัน เพื่อให้ recolor ตาม theme.C ของแต่ละ
   ตำบลได้ทันทีโดยไม่ต้องทำไอคอนแยกไฟล์ต่อตำบล (ส่งพารามิเตอร์ color เข้ามา)
   ทุกไอคอน viewBox 24x24 มาตรฐานเดียวกัน
───────────────────────────────────────────── */
const base = { fill: "none", xmlns: "http://www.w3.org/2000/svg" };
const bodyProps = (color) => ({ fill: color, fillOpacity: 0.18, stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" });
const lineProps = (color) => ({ stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" });

export function IconOverview({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3" y="3" width="7" height="7" rx="1.6" {...bodyProps(color)} />
      <rect x="14" y="3" width="7" height="7" rx="1.6" {...bodyProps(color)} />
      <rect x="14" y="14" width="7" height="7" rx="1.6" {...bodyProps(color)} />
      <rect x="3" y="14" width="7" height="7" rx="1.6" {...bodyProps(color)} />
    </svg>
  );
}

export function IconMap({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <polygon points="1 6 1 21 8 18 16 21 23 18 23 3 16 6 8 3 1 6" {...bodyProps(color)} />
      <line x1="8" y1="3" x2="8" y2="18" {...lineProps(color)} />
      <line x1="16" y1="6" x2="16" y2="21" {...lineProps(color)} />
    </svg>
  );
}

export function IconNetwork({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <line x1="8.4" y1="13.4" x2="15.4" y2="17.4" {...lineProps(color)} />
      <line x1="15.4" y1="6.6" x2="8.4" y2="10.6" {...lineProps(color)} />
      <circle cx="18" cy="5" r="2.8" {...bodyProps(color)} />
      <circle cx="6" cy="12" r="2.8" {...bodyProps(color)} />
      <circle cx="18" cy="19" r="2.8" {...bodyProps(color)} />
    </svg>
  );
}

export function IconTrend({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <polyline points="22 6 13.5 15.5 8.5 10.5 2 17" {...lineProps(color)} />
      <polyline points="16 6 22 6 22 12" {...bodyProps(color)} />
    </svg>
  );
}

export function IconRain({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M19.5 16.9A5 5 0 0 0 18 7h-1.3A8 8 0 1 0 4 15.6" {...bodyProps(color)} />
      <line x1="8" y1="15" x2="8" y2="21" {...lineProps(color)} />
      <line x1="12.5" y1="17" x2="12.5" y2="23" {...lineProps(color)} />
      <line x1="16" y1="15" x2="16" y2="21" {...lineProps(color)} />
    </svg>
  );
}

export function IconAlertTriangle({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" {...bodyProps(color)} />
      <line x1="12" y1="9.5" x2="12" y2="13.5" {...lineProps(color)} />
      <circle cx="12" cy="16.8" r="1" fill={color} stroke="none" />
    </svg>
  );
}

export function IconAlertOctagon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <polygon points="7.9 2 16.1 2 22 7.9 22 16.1 16.1 22 7.9 22 2 16.1 2 7.9 7.9 2" {...bodyProps(color)} />
      <line x1="12" y1="8" x2="12" y2="12.5" {...lineProps(color)} />
      <circle cx="12" cy="15.8" r="1" fill={color} stroke="none" />
    </svg>
  );
}

export function IconAlertCircle({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="9.5" {...bodyProps(color)} />
      <line x1="12" y1="7.5" x2="12" y2="12.5" {...lineProps(color)} />
      <circle cx="12" cy="16" r="1" fill={color} stroke="none" />
    </svg>
  );
}

export function IconCheckCircle({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="9.5" {...bodyProps(color)} />
      <polyline points="7.5 12.5 10.5 15.5 16.5 9" {...lineProps(color)} />
    </svg>
  );
}

export function IconHelpCircle({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="9.5" {...bodyProps(color)} />
      <path d="M9.1 9.5a3 3 0 0 1 5.8 1c0 2-3 2.8-3 4.3" {...lineProps(color)} />
      <circle cx="12" cy="17.5" r="1" fill={color} stroke="none" />
    </svg>
  );
}

export function IconCrop({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M13.5 12c0-3.5-3.3-4.6-6.8-3.4 0 4.4 3.3 5.7 6.8 3.4z" {...bodyProps(color)} />
      <path d="M13.5 12c0-4.4 3.3-6.6 7.7-5.4 0 4.4-3.3 6.6-7.7 5.4z" {...bodyProps(color)} />
      <line x1="7" y1="21" x2="17" y2="21" {...lineProps(color)} />
      <path d="M12 21c0-7 1.5-9 1.5-9" {...lineProps(color)} />
    </svg>
  );
}

export function IconClipboardCheck({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" {...bodyProps(color)} />
      <rect x="8" y="2" width="8" height="4" rx="1" {...bodyProps(color)} />
      <polyline points="9 14.5 11 16.5 15.5 11.5" {...lineProps(color)} />
    </svg>
  );
}

export function IconScale({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="4" y="14" width="4" height="6" rx="1" {...bodyProps(color)} />
      <rect x="10" y="8" width="4" height="12" rx="1" {...bodyProps(color)} />
      <rect x="16" y="11" width="4" height="9" rx="1" {...bodyProps(color)} />
      <line x1="3" y1="21" x2="21" y2="21" {...lineProps(color)} />
    </svg>
  );
}

export function IconDroplet({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0z" {...bodyProps(color)} />
    </svg>
  );
}

export function IconPrinter({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <polyline points="6 9 6 2 18 2 18 9" {...lineProps(color)} />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" {...bodyProps(color)} />
      <rect x="6" y="14" width="12" height="8" {...bodyProps(color)} />
    </svg>
  );
}

export function IconMessagePlus({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...bodyProps(color)} />
      <line x1="12" y1="7.5" x2="12" y2="13" {...lineProps(color)} />
      <line x1="9.2" y1="10.25" x2="14.8" y2="10.25" {...lineProps(color)} />
    </svg>
  );
}

export function IconLock({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="4" y="11" width="16" height="9" rx="2" {...bodyProps(color)} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" {...lineProps(color)} />
    </svg>
  );
}

export function IconSmartphone({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="6" y="2" width="12" height="20" rx="2.4" {...bodyProps(color)} />
      <line x1="11" y1="18" x2="13" y2="18" {...lineProps(color)} />
    </svg>
  );
}

export function IconUser({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="8" r="4" {...bodyProps(color)} />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" {...bodyProps(color)} />
    </svg>
  );
}

export function IconTool({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3.8 17.2a1.7 1.7 0 0 0 2.4 2.4l5.7-5.7a4 4 0 0 0 5.2-5.2l-2.6 2.6-2.4-2.4z" {...bodyProps(color)} />
    </svg>
  );
}
