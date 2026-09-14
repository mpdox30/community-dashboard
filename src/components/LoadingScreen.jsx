/* ─────────────────────────────────────────────
   หน้าจอโหลดข้อมูลแบบเคลื่อนไหว (SVG รดน้ำต้นไม้)
   พอร์ตมาจากต้นแบบนครป่าหมาก (App.jsx บรรทัด ~4598-4797) ตรงๆ ทั้งอนิเมชัน —
   เป็นแค่ของตกแต่ง ไม่มี logic ทางธุรกิจ จึงคัดลอกไว้เหมือนต้นฉบับ ไม่ต้องปรับสีตามธีมตำบล
───────────────────────────────────────────── */
export default function LoadingScreen({ theme, subtitle = "ดึงข้อมูลล่าสุดจาก Supabase" }) {
  const { base, FONT } = theme;
  return (
    <div style={{ ...base, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{
        textAlign: "center", fontFamily: FONT,
        border: "0.5px solid #cbd5e1", borderRadius: 12,
        padding: "1.25rem 1rem", background: "#dcecf5",
      }}>
        <svg width="190" height="200" viewBox="0 0 190 200">
          <defs>
            <radialGradient id="loadGlow" cx="50%" cy="24%" r="75%">
              <stop offset="0%" stopColor="#fff3d6"/>
              <stop offset="55%" stopColor="#e5f2fa"/>
              <stop offset="100%" stopColor="#d3e8f2"/>
            </radialGradient>
            <linearGradient id="loadCanBody" x1="0.1" y1="0" x2="0.9" y2="1">
              <stop offset="0%" stopColor="#7dd3fc"/>
              <stop offset="35%" stopColor="#0ea5e9"/>
              <stop offset="70%" stopColor="#0369a1"/>
              <stop offset="100%" stopColor="#064e6b"/>
            </linearGradient>
            <linearGradient id="loadCanShine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0"/>
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.55"/>
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="loadSoilGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7a5030"/>
              <stop offset="45%" stopColor="#5c3a20"/>
              <stop offset="100%" stopColor="#3d2513"/>
            </linearGradient>
            <linearGradient id="loadPotGrad" x1="0.15" y1="0" x2="0.85" y2="1">
              <stop offset="0%" stopColor="#f0965f"/>
              <stop offset="40%" stopColor="#d9713f"/>
              <stop offset="75%" stopColor="#b3502a"/>
              <stop offset="100%" stopColor="#8f3c1f"/>
            </linearGradient>
            <radialGradient id="loadPotRim" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffb27a"/>
              <stop offset="100%" stopColor="#c9622f"/>
            </radialGradient>
            <linearGradient id="loadLeafGrad1" x1="0.1" y1="0" x2="0.9" y2="1">
              <stop offset="0%" stopColor="#86efac"/>
              <stop offset="45%" stopColor="#4ade80"/>
              <stop offset="100%" stopColor="#166534"/>
            </linearGradient>
            <linearGradient id="loadLeafGrad2" x1="0.9" y1="0" x2="0.1" y2="1">
              <stop offset="0%" stopColor="#bbf7d0"/>
              <stop offset="45%" stopColor="#4ade80"/>
              <stop offset="100%" stopColor="#14532d"/>
            </linearGradient>
            <radialGradient id="loadPetalGrad" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#fecdd3"/>
              <stop offset="100%" stopColor="#ec4899"/>
            </radialGradient>
          </defs>

          <rect width="190" height="200" fill="url(#loadGlow)"/>
          <g opacity="0.35">
            <path d="M95,0 L60,200 L75,200 Z" fill="#fff3c4"/>
            <path d="M95,0 L125,200 L110,200 Z" fill="#fff3c4"/>
          </g>
          <circle cx="148" cy="28" r="20" fill="#ffe9a8" opacity="0.75"/>
          <circle cx="30" cy="55" r="10" fill="#bae6fd" opacity="0.3"/>
          <circle cx="165" cy="90" r="7" fill="#bae6fd" opacity="0.25"/>

          <ellipse cx="60" cy="70" rx="30" ry="10" fill="#0c4a6e" opacity="0.12">
            <animateTransform attributeName="transform" type="translate"
              values="0,0;-3,1;0,0;0,0;-3,1;0,0;0,0;-3,1;0,0"
              keyTimes="0;0.05;0.1;0.33;0.38;0.43;0.66;0.71;0.76" dur="9s" repeatCount="indefinite"/>
          </ellipse>

          <g transform="translate(10,6) rotate(-16 55 55)">
            <animateTransform attributeName="transform" type="rotate"
              values="-28 55 55;-16 55 55;-28 55 55;-28 55 55;-16 55 55;-28 55 55;-28 55 55;-16 55 55;-28 55 55;-28 55 55"
              keyTimes="0;0.05;0.1;0.33;0.38;0.43;0.66;0.71;0.76;1" dur="9s" repeatCount="indefinite" additive="sum"/>
            <ellipse cx="56" cy="67" rx="27" ry="25" fill="#043549" opacity="0.25"/>
            <ellipse cx="55" cy="65" rx="26" ry="24" fill="url(#loadCanBody)"/>
            <path d="M78,50 L104,42 L108,49 L82,58 Z" fill="url(#loadCanBody)"/>
            <path d="M79,51 L103,43.5 L105,46.5 L81,54 Z" fill="#bae6fd" opacity="0.4"/>
            <ellipse cx="106" cy="45.5" rx="4.5" ry="3" fill="#043549"/>
            <path d="M35,42 Q30,25 45,22 Q58,20 60,32" fill="none" stroke="#075985" strokeWidth="4.5" strokeLinecap="round"/>
            <path d="M35,42 Q30,25 45,22 Q58,20 60,32" fill="none" stroke="#38bdf8" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/>
            <ellipse cx="42" cy="58" rx="7" ry="17" fill="url(#loadCanShine)"/>
            <ellipse cx="55" cy="46" rx="24" ry="7" fill="#082f3f"/>
            <ellipse cx="55" cy="45" rx="22" ry="5.5" fill="#0c4a6e"/>
          </g>

          <g>
            <g>
              <path d="M106,50 Q109.5,58 106,65 Q102.5,58 106,50 Z" fill="#38bdf8"/>
              <ellipse cx="104.7" cy="55" rx="1.1" ry="1.8" fill="#e0f2fe" opacity="0.85"/>
              <animateTransform attributeName="transform" type="translate" values="0,0;0,52" dur="0.55s" begin="0.35s;3.35s;6.35s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="1;1;0" dur="0.55s" begin="0.35s;3.35s;6.35s" repeatCount="indefinite"/>
            </g>
            <g>
              <path d="M112,50 Q115.5,58 112,65 Q108.5,58 112,50 Z" fill="#7dd3fc"/>
              <ellipse cx="110.7" cy="55" rx="1" ry="1.6" fill="#f0f9ff" opacity="0.85"/>
              <animateTransform attributeName="transform" type="translate" values="0,0;0,52" dur="0.55s" begin="0.75s;3.75s;6.75s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="1;1;0" dur="0.55s" begin="0.75s;3.75s;6.75s" repeatCount="indefinite"/>
            </g>
            <g>
              <path d="M100,50 Q102.7,56 100,61.5 Q97.3,56 100,50 Z" fill="#38bdf8"/>
              <ellipse cx="99" cy="54.5" rx="0.9" ry="1.4" fill="#e0f2fe" opacity="0.85"/>
              <animateTransform attributeName="transform" type="translate" values="0,0;0,52" dur="0.55s" begin="1.15s;4.15s;7.15s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="1;1;0" dur="0.55s" begin="1.15s;4.15s;7.15s" repeatCount="indefinite"/>
            </g>
            <g fill="none" stroke="#7dd3fc" strokeWidth="1">
              <ellipse cx="105" cy="146" rx="2" ry="1">
                <animate attributeName="rx" values="1;9" dur="0.5s" begin="0.75s;3.75s;6.75s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0" dur="0.5s" begin="0.75s;3.75s;6.75s" repeatCount="indefinite"/>
              </ellipse>
            </g>
          </g>

          <ellipse cx="95" cy="184" rx="62" ry="7" fill="#3f2a17" opacity="0.22"/>

          <path d="M55,158 Q95,150 135,158 L127,184 Q95,190 63,184 Z" fill="url(#loadPotGrad)"/>
          <path d="M58,163 Q95,157 132,163" fill="none" stroke="#8f3c1f" strokeWidth="1.3" opacity="0.55"/>
          <path d="M60,172 Q95,166 130,172" fill="none" stroke="#8f3c1f" strokeWidth="1.3" opacity="0.5"/>
          <path d="M63,180 Q95,176 127,180" fill="none" stroke="#8f3c1f" strokeWidth="1.2" opacity="0.4"/>
          <path d="M57,160 L60,158" stroke="#ffcfa3" strokeWidth="2" opacity="0.5" strokeLinecap="round"/>

          <ellipse cx="95" cy="158" rx="41" ry="8.5" fill="url(#loadPotRim)"/>
          <ellipse cx="95" cy="156" rx="35" ry="6.5" fill="url(#loadSoilGrad)"/>
          <g opacity="0.55" fill="#2b1a0d">
            <circle cx="80" cy="155" r="0.9"/><circle cx="88" cy="158" r="0.7"/>
            <circle cx="103" cy="154" r="0.8"/><circle cx="110" cy="157" r="0.7"/>
            <circle cx="72" cy="157" r="0.7"/><circle cx="118" cy="155" r="0.8"/>
          </g>

          <g transform="translate(95,156)">
            <path fill="none" stroke="#2f5d27" strokeWidth="1" opacity="0.5">
              <animate attributeName="d" dur="9s" repeatCount="indefinite"
                keyTimes="0;0.1;0.22;0.33;0.43;0.55;0.66;0.76;0.88;1"
                values="M-1,0 Q-1,-2 -1,-4;M-1,0 Q-1,-2 -1,-4;M-1,-1 Q-2,-9 -1,-16;M-1,-1 Q-2,-9 -1,-16;
                        M-1,-1 Q-3,-16 -1,-30;M-1,-1 Q-3,-16 -1,-30;M-1,-1 Q-4,-24 -1,-46;M-1,-1 Q-4,-24 -1,-46;
                        M-1,-1 Q-4,-24 -1,-46;M-1,0 Q-1,-2 -1,-4"/>
            </path>
            <path fill="none" stroke="#3f7d34" strokeWidth="3.4" strokeLinecap="round">
              <animate attributeName="d" dur="9s" repeatCount="indefinite"
                keyTimes="0;0.1;0.22;0.33;0.43;0.55;0.66;0.76;0.88;1"
                values="M0,0 Q0,-2 0,-4;
                        M0,0 Q0,-2 0,-4;
                        M0,-1 Q-1,-9 0,-16;
                        M0,-1 Q-1,-9 0,-16;
                        M0,-1 Q-2,-16 0,-30;
                        M0,-1 Q-2,-16 0,-30;
                        M0,-1 Q-3,-24 0,-46;
                        M0,-1 Q-3,-24 0,-46;
                        M0,-1 Q-3,-24 0,-46;
                        M0,0 Q0,-2 0,-4"/>
            </path>
            <path fill="none" stroke="#65a83d" strokeWidth="1" opacity="0.65">
              <animate attributeName="d" dur="9s" repeatCount="indefinite"
                keyTimes="0;0.1;0.22;0.33;0.43;0.55;0.66;0.76;0.88;1"
                values="M1,0 Q1,-2 1,-4;M1,0 Q1,-2 1,-4;M1,-1 Q0,-9 1,-16;M1,-1 Q0,-9 1,-16;
                        M1,-1 Q-1,-16 1,-30;M1,-1 Q-1,-16 1,-30;M1,-1 Q-2,-24 1,-46;M1,-1 Q-2,-24 1,-46;
                        M1,-1 Q-2,-24 1,-46;M1,0 Q1,-2 1,-4"/>
            </path>

            <g opacity="0">
              <animate attributeName="opacity" values="0;0;1;1;1;1;1;1;1;0" keyTimes="0;0.09;0.15;0.33;0.43;0.55;0.66;0.76;0.88;1" dur="9s" repeatCount="indefinite"/>
              <path fill="url(#loadLeafGrad1)" d="M0,-9 Q-8,-9 -13,-14.5 Q-17,-9 -15,-5 Q-9,-2 0,-9 Z"/>
              <path d="M0,-9 Q-8,-8 -14,-8" fill="none" stroke="#166534" strokeWidth="0.5" opacity="0.6"/>
              <path fill="url(#loadLeafGrad2)" d="M0,-7 Q7,-7 12,-12 Q16,-7 14,-3.5 Q8,-1 0,-7 Z"/>
              <path d="M0,-7 Q7,-6 13,-6" fill="none" stroke="#14532d" strokeWidth="0.5" opacity="0.6"/>
            </g>

            <g opacity="0">
              <animate attributeName="opacity" values="0;0;0;0;1;1;1;1;1;0" keyTimes="0;0.09;0.15;0.33;0.43;0.55;0.66;0.76;0.88;1" dur="9s" repeatCount="indefinite"/>
              <path fill="url(#loadLeafGrad1)" d="M0,-22 Q-10,-22 -17,-28.5 Q-22,-22 -20,-16 Q-12,-12 0,-22 Z"/>
              <path d="M0,-22 Q-10,-21 -18,-20" fill="none" stroke="#166534" strokeWidth="0.6" opacity="0.6"/>
              <path fill="url(#loadLeafGrad2)" d="M0,-19 Q9,-19 15,-25.5 Q20,-19 18,-14 Q11,-11 0,-19 Z"/>
              <path d="M0,-19 Q9,-18 17,-17" fill="none" stroke="#14532d" strokeWidth="0.6" opacity="0.6"/>
            </g>

            <g opacity="0">
              <animate attributeName="opacity" values="0;0;0;0;0;0;1;1;1;0" keyTimes="0;0.09;0.15;0.33;0.43;0.55;0.66;0.76;0.88;1" dur="9s" repeatCount="indefinite"/>
              <path fill="url(#loadLeafGrad1)" d="M0,-36 Q-11,-36 -18,-43 Q-24,-36 -21,-29 Q-13,-25 0,-36 Z"/>
              <path d="M0,-36 Q-11,-35 -19,-34" fill="none" stroke="#166534" strokeWidth="0.6" opacity="0.6"/>
              <path fill="url(#loadLeafGrad2)" d="M0,-33 Q10,-33 17,-40 Q23,-33 20,-27 Q12,-23 0,-33 Z"/>
              <path d="M0,-33 Q10,-32 18,-31" fill="none" stroke="#14532d" strokeWidth="0.6" opacity="0.6"/>
            </g>

            <g opacity="0">
              <animate attributeName="opacity" values="0;0;0;0;0;0;0;0;1;0" keyTimes="0;0.09;0.15;0.33;0.43;0.55;0.66;0.76;0.88;1" dur="9s" repeatCount="indefinite"/>
              <ellipse cx="0" cy="-46" rx="4" ry="3.6" fill="url(#loadPetalGrad)"/>
              <ellipse cx="-3.6" cy="-49.5" rx="4" ry="3.6" fill="url(#loadPetalGrad)" transform="rotate(-45 -3.6 -49.5)"/>
              <ellipse cx="3.6" cy="-49.5" rx="4" ry="3.6" fill="url(#loadPetalGrad)" transform="rotate(45 3.6 -49.5)"/>
              <ellipse cx="0" cy="-53" rx="4" ry="3.6" fill="url(#loadPetalGrad)" transform="rotate(90 0 -53)"/>
              <circle cx="0" cy="-49.5" r="2.6" fill="#facc15"/>
              <circle cx="0" cy="-49.5" r="2.6" fill="none" stroke="#eab308" strokeWidth="0.4"/>
            </g>
          </g>
        </svg>

        <div style={{ fontSize: 16, fontWeight: 700, color: "#0c4a6e", marginTop: 8 }}>กำลังโหลดข้อมูล…</div>
        {subtitle && <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{subtitle}</div>}
      </div>
    </div>
  );
}
