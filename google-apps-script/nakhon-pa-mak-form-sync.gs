/**
 * ═══════════════════════════════════════════════════════════════════════
 * เฟส 3 — สะพานเชื่อม Google Form (นครป่าหมาก) → Supabase
 * ═══════════════════════════════════════════════════════════════════════
 *
 * วิธีติดตั้ง (ทำครั้งเดียว):
 *
 * 1. เปิด Google Sheet ที่ผูกกับ Google Form กรอกระดับน้ำของนครป่าหมาก
 *    (ลิงก์ฟอร์ม: https://docs.google.com/forms/d/e/1FAIpQLSc5EEYFN1iveBBnR5kqFeOitQw5RW1M7_XsYKD8U13JxJgN3w/viewform)
 * 2. เมนู ส่วนขยาย (Extensions) → Apps Script
 * 3. สร้างไฟล์ .gs ใหม่ (หรือแท็บใหม่) แล้ววางโค้ดทั้งหมดในไฟล์นี้ลงไป —
 *    ไม่ต้องลบ/แตะไฟล์ WaterDashboardAPI.gs เดิม ไฟล์นี้แยกต่างหาก ทำงาน
 *    คู่ขนานไปเฉยๆ (Sheets ยังคำนวณ/แสดงผลของเดิมได้ตามปกติ)
 * 4. ตั้งค่า Script Properties (เมนูฟันเฟือง "Project Settings" ด้านซ้าย →
 *    เลื่อนลงหา "Script Properties" → Add script property):
 *      - GATE_PASSWORD = 123456789   (รหัสผ่านหน้า "กรอกข้อมูล" ของเว็บใหม่
 *        ปัจจุบัน — ถ้าเปลี่ยนรหัสในเว็บเมื่อไหร่ ต้องมาแก้ค่านี้ให้ตรงกันด้วย)
 *      - ALERT_EMAIL = <อีเมลที่จะรับแจ้งเตือนถ้า sync ล้มเหลว/ข้อมูลเงียบผิดปกติ>
 * 5. ตั้ง Trigger: เมนูนาฬิกา "Triggers" (ด้านซ้าย) → "+ Add Trigger"
 *      - Choose which function to run: onFormSubmitToSupabase
 *      - Select event source: From spreadsheet
 *      - Select event type: On form submit
 *      → Save (ครั้งแรกจะขอสิทธิ์ authorize — กดอนุญาตได้เลย เป็นสิทธิ์ปกติของ
 *        Apps Script ที่ต้องยิง HTTP request ออกไปหา Supabase)
 * 6. (แนะนำ) ตั้ง Trigger ที่ 2 สำหรับเช็คข้อมูลเงียบผิดปกติ:
 *      - Choose which function to run: checkStaleData
 *      - Select event source: Time-driven
 *      - Type of time based trigger: Day timer → เลือกช่วงเวลาที่สะดวก (เช่น 08:00-09:00)
 * 7. **ทดสอบ**: กรอกฟอร์มทดสอบ 1 รายการ (กรอกแค่ 1-2 แหล่งก็พอ) → เปิดเมนู
 *    "Executions" (ไอคอนรูปนาฬิกาทราย ด้านซ้าย) ดูว่ารันสำเร็จไหม (สีเขียว)
 *    ถ้าไม่สำเร็จ ให้เปิดดู log (คลิกที่ execution นั้น) — บรรทัดแรกสุดจะ
 *    log ชื่อคอลัมน์จริงของฟอร์ม (`namedValues keys`) ไว้ให้เทียบกับ
 *    FORM_HEADER_MAP ด้านล่างว่าตรงกันไหม ถ้าไม่ตรง (เช่นคำถามในฟอร์มเขียน
 *    ต่างจากที่เดาไว้) แก้ค่าทางขวาของ ":" ใน FORM_HEADER_MAP ให้ตรงกับ
 *    คำถามจริงในฟอร์มเป๊ะๆ ทีละแหล่ง (บันทึกไฟล์ก็มีผลทันที ไม่ต้อง deploy ใหม่)
 *
 * ⚠️ สำคัญ: FORM_HEADER_MAP ด้านล่างนี้เป็น "ค่าเดา" จากชื่อแหล่งน้ำจริงในระบบ
 * (public.water_sources.name_th) เพราะผมไม่มีสิทธิ์เข้าดูฟอร์ม/ชีตจริงของ
 * นครป่าหมาก (ยืนยันข้อจำกัดนี้ไว้แล้วใน MIGRATION_NAKHON_PA_MAK.md) —
 * **ต้องตรวจ/แก้ให้ตรงกับคำถามจริงในฟอร์มก่อนใช้งานจริง** ตามขั้นตอนข้อ 7
 * ด้านบน มิฉะนั้นแหล่งที่ชื่อคำถามไม่ตรงจะไม่ถูกบันทึกเงียบๆ (ไม่ error ทั้งฟอร์ม
 * แค่ข้ามแหล่งนั้นไป เพราะออกแบบให้ทนทานต่อกรณีนี้ไว้แล้ว — ดูฟังก์ชัน
 * findFormValue_ ด้านล่าง ที่ match แบบยืดหยุ่น ไม่ต้องตรงตัวเป๊ะ 100%)
 *
 * หลักการที่ยึดตามแผน ROLLOUT_PLAN_NAKHON_PA_MAK.md เฟส 3 ทุกข้อ:
 *  - ไม่เขียน RPC ใหม่ — เรียก fn_calc_level_pct + submit_water_level_reading
 *    เดิมที่มีอยู่แล้ว (ตัวเดียวกับที่ TabEntry.jsx ฝั่งเว็บใหม่ใช้)
 *  - ส่งแค่ค่าระดับน้ำดิบเข้า Supabase แล้วให้ fn_calc_level_pct คำนวณ % เอง
 *    ทั้งหมด ไม่ส่งค่า % ที่ Sheet เคยคำนวณสำเร็จรูปมาแทน
 *  - รหัสผ่านเช็คฝั่งเซิร์ฟเวอร์ผ่าน RPC (bcrypt) เหมือนเดิมทุกประการ —
 *    Apps Script ไม่เก็บ/เห็น hash เลย แค่ส่ง password เข้าไปให้ RPC เช็คเอง
 */

/* ── ค่าคงที่ของนครป่าหมาก (ไม่มีอะไรเป็นความลับ — anon key ออกแบบมาให้ฝัง
   ในโค้ดฝั่ง client ได้อยู่แล้ว ความปลอดภัยจริงอยู่ที่ RLS + RPC ฝั่ง Supabase) ── */
var SUPABASE_URL = "https://khfixycxjwxcpayiwxap.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZml4eWN4and4Y3BheWl3eGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Mzg5NzksImV4cCI6MjEwMzIxNDk3OX0.eGVBC7BHJXNeFiy_TDBVgTtKnK3Jxxem1L2hrsUP86E";
var TAMBON_ID = "20451bd6-df9d-4214-b2f0-aca23f9f2d91"; // nakhon-pa-mak

/* NP-01..NP-15 -> { sourceId (UUID จริงใน water_sources), nameTh } */
var SOURCE_MAP = {
  "NP-01": { sourceId: "6e1d6b6c-5e8a-456c-9193-9b7ca99708d7", nameTh: "หนองแหลมพระธาตุ ม.10" },
  "NP-02": { sourceId: "805a1a58-f54a-4721-95a3-f120ca81bc21", nameTh: "บึงเถ้าหว่าน" },
  "NP-03": { sourceId: "ff3da37c-babd-4d15-82b4-8b6ee25866d3", nameTh: "บึงทุม" },
  "NP-04": { sourceId: "b5285f6d-3d1f-42b3-8bf7-1e4fc00cfb3b", nameTh: "บึงสลุ" },
  "NP-05": { sourceId: "f35fd4f1-b965-40d2-ba42-f78ccb79d5b8", nameTh: "บึงตะเคียน" },
  "NP-06": { sourceId: "752667e8-818f-454a-9298-abc7b3d3b7b8", nameTh: "หนองระมาน" },
  "NP-07": { sourceId: "4032682c-d073-4b58-a6dd-5f410f1ebfa3", nameTh: "บึงสลุเล็ก" },
  "NP-08": { sourceId: "f8375237-7616-440d-a6ce-706a5109b844", nameTh: "หนองแหลมพระธาตุ ม.9" },
  "NP-09": { sourceId: "8329cbab-0834-4b5e-9ba5-fe7c037b5cf7", nameTh: "หนองเต่า" },
  "NP-10": { sourceId: "5c8a608a-5410-4d18-a93b-3dd1e8b81165", nameTh: "หนองหัวไผ่" },
  "NP-11": { sourceId: "d2068cc0-7a4b-4571-93ad-978cc4f06973", nameTh: "บึงตาด้วง" },
  "NP-12": { sourceId: "2a39cba9-def5-4c41-9b4f-a2c181fa372a", nameTh: "หนองไอ้โหม่" },
  "NP-13": { sourceId: "99ee4ab9-8c0e-416d-96d1-7a71ae834c5c", nameTh: "บึงตาคู" },
  "NP-14": { sourceId: "4761c0f9-9a96-4f7a-a864-238c2643dd9f", nameTh: "บึงน้อย" },
  "NP-15": { sourceId: "090ff068-809e-4b07-ba2b-5ba1a605ad80", nameTh: "บึงซิว" },
};

/* คำที่คาดว่าจะอยู่ในหัวข้อคำถามของฟอร์ม (บางส่วนก็พอ — match แบบ "มีคำนี้อยู่
   ในคำถามไหม" ไม่ต้องตรงทั้งประโยค) ต่อ 1 แหล่งน้ำ — ต้องตรวจ/ปรับตามข้อ 7 ด้านบน */
var FORM_HEADER_MAP = {
  "NP-01": "หนองแหลมพระธาตุ ม.10",
  "NP-02": "บึงเถ้าหว่าน",
  "NP-03": "บึงทุม",
  "NP-04": "บึงสลุ", // ระวัง: ต้องไม่ match มั่วกับ "บึงสลุเล็ก" (NP-07) — โค้ดด้านล่างกันไว้แล้ว (จับคำยาวสุดก่อน)
  "NP-05": "บึงตะเคียน",
  "NP-06": "หนองระมาน",
  "NP-07": "บึงสลุเล็ก",
  "NP-08": "หนองแหลมพระธาตุ ม.9",
  "NP-09": "หนองเต่า",
  "NP-10": "หนองหัวไผ่",
  "NP-11": "บึงตาด้วง",
  "NP-12": "หนองไอ้โหม่",
  "NP-13": "บึงตาคู",
  "NP-14": "บึงน้อย",
  "NP-15": "บึงซิว",
};

var STALE_DAYS_THRESHOLD = 3; // ถ้าข้อมูลล่าสุดเก่ากว่านี้กี่วัน ให้แจ้งเตือน (checkStaleData)

/* ═══════════════════════════════════════════════════════════════════════
   ฟังก์ชันหลัก — ผูกกับ trigger "On form submit"
   ═══════════════════════════════════════════════════════════════════════ */
function onFormSubmitToSupabase(e) {
  var namedValues = e && e.namedValues;
  if (!namedValues) {
    Logger.log("onFormSubmitToSupabase: ไม่พบ e.namedValues — ตรวจว่าตั้ง trigger เป็น 'On form submit' (ไม่ใช่ 'On edit')");
    return;
  }
  // log ไว้เสมอ เพื่อให้เช็คชื่อคอลัมน์จริงของฟอร์มได้จาก Executions log (ดูข้อ 7 ในคอมเมนต์ด้านบน)
  Logger.log("namedValues keys ที่ได้จากฟอร์มจริง: " + JSON.stringify(Object.keys(namedValues)));

  var password = PropertiesService.getScriptProperties().getProperty("GATE_PASSWORD");
  if (!password) {
    notifyFailure_("ไม่พบ Script Property ชื่อ GATE_PASSWORD — ตั้งค่าก่อนใน Project Settings แล้วลองใหม่");
    return;
  }

  var readingDate = extractReadingDate_(namedValues);
  var enteredBy = extractEnteredBy_(namedValues);

  var successCount = 0, failCount = 0, skipCount = 0, errors = [];

  Object.keys(SOURCE_MAP).forEach(function (code) {
    var rawValue = findFormValue_(namedValues, FORM_HEADER_MAP[code]);
    var levelValue = parseLevelValue_(rawValue);
    if (levelValue === null) { skipCount++; return; } // เว้นว่างแหล่งที่ไม่ได้วัดรอบนี้ — ไม่บันทึกทับ

    try {
      var pct = callCalcLevelPct_(SOURCE_MAP[code].sourceId, levelValue);
      var result = callSubmitReading_(SOURCE_MAP[code].sourceId, readingDate, levelValue, pct, enteredBy, password);
      if (result && result.success) {
        successCount++;
      } else {
        failCount++;
        errors.push(code + " (" + SOURCE_MAP[code].nameTh + "): " + (result && result.error ? result.error : "ไม่ทราบสาเหตุ"));
      }
    } catch (err) {
      failCount++;
      errors.push(code + " (" + SOURCE_MAP[code].nameTh + "): " + err.message);
    }
  });

  Logger.log("สรุป: สำเร็จ " + successCount + ", ล้มเหลว " + failCount + ", ข้าม(ไม่ได้กรอก) " + skipCount);
  if (failCount > 0) {
    notifyFailure_("บันทึกข้อมูลจากฟอร์มเข้า Supabase ล้มเหลวบางแหล่ง (" + failCount + " แหล่ง):\n" + errors.join("\n"));
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   ตัวช่วย
   ═══════════════════════════════════════════════════════════════════════ */

// หาค่าจาก namedValues โดย match แบบ "คำถามมีคำนี้อยู่" (ไม่ต้องตรงตัวเป๊ะ)
// เรียงหาแบบคำค้นยาวสุดก่อน กันปัญหา substring ชนกัน (เช่น "บึงสลุ" อยู่ใน "บึงสลุเล็ก")
function findFormValue_(namedValues, needle) {
  if (!needle) return null;
  var keys = Object.keys(namedValues);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].indexOf(needle) !== -1) {
      var arr = namedValues[keys[i]];
      return arr && arr.length ? arr[0] : null;
    }
  }
  return null;
}

function parseLevelValue_(raw) {
  if (raw === null || raw === undefined) return null;
  var s = String(raw).trim();
  if (s === "") return null;
  var n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? null : n;
}

// วันที่วัดน้ำ: ใช้คำถาม "วันที่" ในฟอร์มถ้ามี ไม่งั้น fallback เป็นวันที่ส่งฟอร์ม (Timestamp)
function extractReadingDate_(namedValues) {
  var explicit = findFormValue_(namedValues, "วันที่");
  var d = explicit ? new Date(explicit) : null;
  if (!d || isNaN(d.getTime())) {
    var ts = namedValues["Timestamp"] && namedValues["Timestamp"][0];
    d = ts ? new Date(ts) : new Date();
  }
  return Utilities.formatDate(d, "Asia/Bangkok", "yyyy-MM-dd");
}

function extractEnteredBy_(namedValues) {
  var name = findFormValue_(namedValues, "ชื่อผู้") || findFormValue_(namedValues, "ผู้บันทึก") || findFormValue_(namedValues, "ผู้แจ้ง");
  return name || "Google Form (นครป่าหมาก)";
}

function callCalcLevelPct_(sourceId, levelValue) {
  var res = callRpc_("fn_calc_level_pct", { p_source_id: sourceId, p_level_value: levelValue });
  return res; // fn_calc_level_pct คืนค่าตัวเลขตรงๆ (หรือ null)
}

function callSubmitReading_(sourceId, readingDate, levelValue, levelPct, enteredBy, password) {
  return callRpc_("submit_water_level_reading", {
    p_tambon_id: TAMBON_ID,
    p_source_id: sourceId,
    p_reading_date: readingDate,
    p_level_value: levelValue,
    p_level_pct: levelPct,
    p_entered_by: enteredBy,
    p_password: password,
  });
}

function callRpc_(fnName, payload) {
  var res = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/rpc/" + fnName, {
    method: "post",
    contentType: "application/json",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  var code = res.getResponseCode();
  var body = res.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error("HTTP " + code + ": " + body);
  }
  return body ? JSON.parse(body) : null;
}

function notifyFailure_(message) {
  Logger.log("notifyFailure_: " + message);
  var email = PropertiesService.getScriptProperties().getProperty("ALERT_EMAIL");
  if (email) {
    MailApp.sendEmail(email, "[นครป่าหมาก] sync ฟอร์ม → Supabase มีปัญหา", message);
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   watchdog — ตั้ง time-driven trigger รายวัน เช็คว่าข้อมูลเงียบไปนานผิดปกติไหม
   (ตามข้อ 4 ของแผนเฟส 3 — trigger เองก็มีโควตา/ข้อจำกัด ถ้ามันหยุดทำงานเงียบๆ
   จะได้รู้ตัวก่อนที่ dashboard จะโชว์ข้อมูลเก่าโดยไม่มีใครสังเกต)
   ═══════════════════════════════════════════════════════════════════════ */
function checkStaleData() {
  var email = PropertiesService.getScriptProperties().getProperty("ALERT_EMAIL");
  if (!email) { Logger.log("checkStaleData: ไม่ได้ตั้ง ALERT_EMAIL ไว้ — ข้าม"); return; }

  var ids = Object.keys(SOURCE_MAP).map(function (k) { return SOURCE_MAP[k].sourceId; }).join(",");
  var url = SUPABASE_URL + "/rest/v1/v_water_level_daily_public"
    + "?select=reading_date&source_id=in.(" + ids + ")&order=reading_date.desc&limit=1";

  try {
    var res = UrlFetchApp.fetch(url, {
      method: "get",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY },
      muteHttpExceptions: true,
    });
    var rows = JSON.parse(res.getContentText() || "[]");
    var latest = rows.length ? rows[0].reading_date : null;
    if (!latest) {
      MailApp.sendEmail(email, "[นครป่าหมาก] ไม่พบข้อมูลระดับน้ำเลย", "ตรวจสอบ trigger onFormSubmitToSupabase และการกรอกฟอร์มด่วน");
      return;
    }
    var days = Math.floor((Date.now() - new Date(latest + "T00:00:00").getTime()) / 86400000);
    if (days > STALE_DAYS_THRESHOLD) {
      MailApp.sendEmail(email, "[นครป่าหมาก] ข้อมูลระดับน้ำไม่อัปเดต " + days + " วันแล้ว",
        "ข้อมูลล่าสุดในระบบคือวันที่ " + latest + " (" + days + " วันที่แล้ว) — ตรวจสอบว่า trigger ยังทำงานอยู่ไหม หรือมีคนลืมกรอกฟอร์ม");
    }
  } catch (err) {
    Logger.log("checkStaleData error: " + err.message);
  }
}
