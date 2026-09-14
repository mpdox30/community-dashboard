import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";

// PostgREST จำกัดจำนวนแถวต่อ request ไว้ที่ 1000 แถว (db.max_rows) โดย default
// ถ้า query ไหนมีโอกาสเกิน 1000 แถว (เช่นข้อมูลรายวันสะสมมาหลายปี) ต้อง page
// ด้วย .range() วนจนกว่าจะได้แถวน้อยกว่า pageSize ไม่งั้นข้อมูลช่วงท้าย (ล่าสุด)
// จะถูกตัดหายไปเงียบๆ โดยไม่มี error ใดๆ (สาเหตุของบั๊กข้อมูลฝนหายช่วงหลัง —
// ตรวจพบและแก้แล้วใน water-dashboard/App.jsx ของนครป่าหมาก ใช้ pattern เดียวกันที่นี่)
async function supabaseFetchAllPages(buildQuery, pageSize = 1000) {
  let allRows = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await buildQuery().range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return allRows;
}

/* ─────────────────────────────────────────────
   ตำบล (multi-tenant root)
───────────────────────────────────────────── */
export function useTambon(slug) {
  const [tambon, setTambon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    supabase
      .from("v_tambons_public")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setError(error.message);
        else setTambon(data);
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [slug]);

  return { tambon, loading, error };
}

/* ─────────────────────────────────────────────
   แหล่งน้ำ + ระดับล่าสุด + forecast (รวมเป็นก้อนเดียว
   ให้หน้าตาเหมือนโครงสร้าง `sources` ของต้นฉบับ)

   source_role="storage"  -> มี % / KPI / OLS forecast (ตาม §5.1)
   source_role="structure"-> ฝาย/เช็คดำ ไอคอนอย่างเดียว ไม่มี %
───────────────────────────────────────────── */
export function useSources(tambonId) {
  const [sources, setSources] = useState(null);
  const [snap, setSnap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(() => {
    if (!tambonId) return;
    setLoading(true);
    Promise.all([
      supabase.from("v_water_sources_public").select("*").eq("tambon_id", tambonId).order("display_order", { ascending: true, nullsFirst: false }),
      supabase.from("v_source_risk_forecast").select("*").eq("tambon_id", tambonId),
    ])
      .then(([srcRes, riskRes]) => {
        if (srcRes.error) throw srcRes.error;
        if (riskRes.error) throw riskRes.error;

        const riskMap = Object.fromEntries((riskRes.data ?? []).map(r => [r.source_id, r]));

        const merged = (srcRes.data ?? []).map(s => {
          const risk = riskMap[s.source_id];
          const cap = s.stored_capacity_m3 ? Number(s.stored_capacity_m3) : null;
          const pct = risk?.current_pct != null ? Number(risk.current_pct) : null;
          const m3 = pct != null && cap != null ? Math.round((pct / 100) * cap) : null;

          let forecast = null;
          if (risk?.forecast_status === "forecastable") {
            forecast = {
              central: risk.days_central != null ? Math.round(risk.days_central) : null,
              opt: risk.days_optimistic != null ? Math.round(risk.days_optimistic) : null,
              pess: risk.days_pessimistic != null ? Math.round(risk.days_pessimistic) : null,
              dateCentral: risk.date_central,
              dateOptimistic: risk.date_optimistic,
              datePessimistic: risk.date_pessimistic,
              r2: risk.r2 != null ? Math.round(risk.r2 * 1000) / 1000 : null,
              n: risk.post_peak_n,
              rel: risk.r2 >= 0.9 ? "สูง" : risk.r2 >= 0.75 ? "ปานกลาง" : "ต่ำ",
            };
          }

          return {
            id: s.source_id,
            name: s.name_th,
            nameEn: s.name_en,
            role: s.source_role,          // "storage" | "structure"
            type: s.source_type,
            moo: s.moo,
            village: s.village_name_th,
            lat: s.lat != null ? Number(s.lat) : null,
            lon: s.lon != null ? Number(s.lon) : null,
            maxM3: cap,
            pct: pct != null ? Math.round(pct * 10) / 10 : null,
            m3,
            isolated: s.is_isolated,
            curveNodeKey: s.curve_node_key ?? null, // ใช้จับคู่กับ source_ref บนผังน้ำ (nw_diagram_current_nodes)
            catchmentKm2: s.catchment_area_km2 != null ? Number(s.catchment_area_km2) : null,
            beneficiaryRai: s.beneficiary_agri_rai != null ? Number(s.beneficiary_agri_rai) : null,
            beneficiaryPopulation: s.beneficiary_population != null ? Number(s.beneficiary_population) : null,
            builtBy: s.built_by,
            capacityNote: s.capacity_source_note,
            currentDate: risk?.current_date ?? null,
            dW: risk?.dw_value != null ? Math.round(risk.dw_value * 100) / 100 : null,
            forecastStatus: risk?.forecast_status ?? (s.source_role === "storage" ? "no_data" : null),
            forecast,
          };
        });

        setSources(merged);

        // snapshot: วันที่ล่าสุดที่ "มีข้อมูลจริง" (ห้ามใช้ new Date())
        const storageWithData = merged.filter(s => s.role === "storage" && s.currentDate);
        const latestDate = storageWithData.reduce((max, s) => (!max || s.currentDate > max ? s.currentDate : max), null);
        const totalM3 = storageWithData.reduce((sum, s) => sum + (s.m3 ?? 0), 0);
        const maxM3 = merged.filter(s => s.role === "storage").reduce((sum, s) => sum + (s.maxM3 ?? 0), 0);
        setSnap({
          date: latestDate,
          totalM3,
          maxM3,
          totalPct: maxM3 > 0 ? Math.round((totalM3 / maxM3) * 1000) / 10 : null,
          storageCount: merged.filter(s => s.role === "storage").length,
          structureCount: merged.filter(s => s.role === "structure").length,
        });
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [tambonId]);

  useEffect(() => { reload(); }, [reload]);

  return { sources, snap, loading, error, reload };
}

/* ─────────────────────────────────────────────
   ts รายวัน (wide, key = source_id) สำหรับกราฟแนวโน้ม
   — เฉพาะแหล่ง storage ที่มี id อยู่ใน sourceIds
───────────────────────────────────────────── */
export function useLevelTimeSeries(sourceIds) {
  const [ts, setTs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sourceIds || sourceIds.length === 0) { setTs([]); setLoading(false); return; }
    let alive = true;
    setLoading(true);
    supabase
      .from("v_water_level_daily_public")
      .select("source_id, reading_date, level_pct")
      .in("source_id", sourceIds)
      .order("reading_date", { ascending: true })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) { setTs([]); return; }
        const byDate = {};
        for (const row of data ?? []) {
          if (row.level_pct === null) continue;
          if (!byDate[row.reading_date]) byDate[row.reading_date] = { iso: row.reading_date };
          byDate[row.reading_date][row.source_id] = Number(row.level_pct);
        }
        setTs(Object.values(byDate).sort((a, b) => a.iso.localeCompare(b.iso)));
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [JSON.stringify(sourceIds)]);

  return { ts, loading };
}

/* ─────────────────────────────────────────────
   ฝนรายวันระดับตำบล (v_rainfall_daily_tambon — merge rule §5.5)
───────────────────────────────────────────── */
const TH_MON_R = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export function useRainfall(tambonId) {
  const [rainDaily, setRainDaily] = useState([]);
  const [rainMonthly, setRainMonthly] = useState({});
  const [rainYearly, setRainYearly] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tambonId) return;
    let alive = true;
    setLoading(true);
    // ข้อมูลฝนรายวันสะสมนานขึ้นเรื่อยๆ ต้อง page กันเกิน 1000 แถว (db.max_rows) —
    // เดิม query นี้ไม่มี .range()/.limit() จึงถูก PostgREST ตัดเหลือ 1000 แถวแรกสุด
    // (เก่าสุด) เท่านั้น ทำให้ข้อมูลฝนช่วงหลังหายไปทั้งหมด (ฝนสะสม 7 วัน / กราฟแนวโน้ม
    // เดือนท้ายๆ หาย)
    supabaseFetchAllPages(() =>
      supabase
        .from("v_rainfall_daily_tambon")
        .select("reading_date, rainfall_mm")
        .eq("tambon_id", tambonId)
        .order("reading_date", { ascending: true })
    )
      .then(rows => {
        if (!alive) return;
        const daily = rows.map(r => {
          const d = new Date(r.reading_date + "T00:00:00");
          return { d: `${d.getDate()} ${TH_MON_R[d.getMonth() + 1]}`, iso: r.reading_date, rain: r.rainfall_mm != null ? Number(r.rainfall_mm) : 0 };
        });
        setRainDaily(daily);

        const monthMap = {};
        rows.forEach(r => {
          const ym = r.reading_date.slice(0, 7);
          monthMap[ym] = Math.round(((monthMap[ym] ?? 0) + Number(r.rainfall_mm ?? 0)) * 10) / 10;
        });
        setRainMonthly(monthMap);

        const yearMap = {};
        rows.forEach(r => {
          const y = r.reading_date.slice(0, 4);
          yearMap[y] = Math.round(((yearMap[y] ?? 0) + Number(r.rainfall_mm ?? 0)) * 10) / 10;
        });
        setRainYearly(yearMap);
        setError(null);
      })
      .catch(err => { if (alive) setError(err.message); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [tambonId]);

  return { rainDaily, rainMonthly, rainYearly, loading, error };
}

/* ─────────────────────────────────────────────
   พยากรณ์ฝน 16 วัน — Open-Meteo (public API, ไม่ต้องใช้ key)
   ตำแหน่งมาจาก tambons.rain_forecast_lat/lon (ต่อตำบล)
───────────────────────────────────────────── */
export function useRainForecast(lat, lon) {
  const [rainForecast, setRainForecast] = useState([]);
  const [rainLoading, setRainLoading] = useState(true);
  const [rainError, setRainError] = useState(null);

  useEffect(() => {
    if (lat == null || lon == null) { setRainLoading(false); return; }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=precipitation_sum,precipitation_probability_max&forecast_days=16&timezone=Asia%2FBangkok`,
      { signal: ctrl.signal }
    )
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => {
        setRainForecast(data.daily.time.map((d, i) => {
          const dt = new Date(d);
          return {
            date: d,
            label: `${dt.getDate()} ${TH_MON_R[dt.getMonth() + 1]}`,
            rain: data.daily.precipitation_sum[i] ?? 0,
            prob: data.daily.precipitation_probability_max[i] ?? 0,
          };
        }));
        setRainError(null);
      })
      .catch(err => setRainError(err.name === "AbortError" ? "timeout" : err.message))
      .finally(() => { clearTimeout(timer); setRainLoading(false); });

    return () => { ctrl.abort(); clearTimeout(timer); };
  }, [lat, lon]);

  return { rainForecast, rainLoading, rainError };
}

/* ─────────────────────────────────────────────
   ผังน้ำจากระบบ `nw` (Cytoscape) — อ่านผ่าน view สาธารณะที่ "มีอยู่แล้ว" คือ
   nw_diagram_current_nodes / nw_diagram_current_edges (เวอร์ชัน is_current=true
   เท่านั้น) — นี่คือ view ตัวเดียวกับที่เว็บต้นแบบ (fluffy-monstera-2dd0a8.netlify.app)
   ใช้งานจริงอยู่แล้วตอนนี้ ไม่ได้สร้าง view ใหม่ซ้ำซ้อน — อ่านอย่างเดียว ไม่เขียน/
   แก้ไขอะไรกลับเข้า schema nw ทั้งสิ้น (เป็นของทีมอื่น)
   ตำบลที่ยังไม่มีผังแบบนี้ (เช่นแม่นาเรือตอนนี้) จะได้ nodes=[] กลับมา
   แล้วฝั่ง UI (WaterFlowDiagramAuto) จะ fallback ไปใช้ผัง SVG เดิมเอง
───────────────────────────────────────────── */
export function useWaterNetworkDiagram(tambonId) {
  const [nodes, setNodes] = useState(null);
  const [edges, setEdges] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tambonId) { setNodes([]); setEdges([]); setLoading(false); return; }
    let alive = true;
    setLoading(true);
    Promise.all([
      supabase.from("nw_diagram_current_nodes").select("*").eq("tambon_id", tambonId),
      supabase.from("nw_diagram_current_edges").select("*").eq("tambon_id", tambonId),
    ])
      .then(([nodeRes, edgeRes]) => {
        if (!alive) return;
        setNodes(nodeRes.error ? [] : (nodeRes.data ?? []));
        setEdges(edgeRes.error ? [] : (edgeRes.data ?? []));
      })
      .catch(() => { if (alive) { setNodes([]); setEdges([]); } })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [tambonId]);

  return { nodes, edges, loading };
}

/* ─────────────────────────────────────────────
   สถานีโทรมาตร (HII) — อ่านผ่าน v_hii_feed_stations_public / v_water_level_raw_public
   (public view ตัวเดียวกับที่เว็บต้นแบบนครป่าหมากใช้จริงอยู่แล้วสำหรับสถานี VLGE12 —
   ดู resolveVlge12SourceId()/loadVlge12TelemetryFromSupabase() ใน App.jsx ต้นแบบ
   ไม่ได้สร้าง query ใหม่ที่ไม่เคยผ่านการ debug — พอร์ต logic เดิมมาตรงๆ)

   ต่างจากต้นฉบับ 1 จุด: ต้นแบบมีสถานีโทรมาตรเดียว (VLGE12) ฝัง station code
   ไว้ตรงๆ ในโค้ด ส่วนระบบนี้เป็น multi-tenant และแม่นาเรือมีหลายสถานีพร้อมกัน
   (RES002/RES004/RES005/RES006 ผูกกับ data_feeds ของแต่ละแหล่งน้ำอยู่แล้ว) —
   จึงดึงทุกสถานีที่ active ของตำบลนั้นพร้อมกัน คืนเป็น map keyed ด้วย
   external_station_code (รหัสสถานี) แทนที่จะ resolve ทีละสถานี
───────────────────────────────────────────── */
export function useTelemetry(sourceIds) {
  const [telemetryByCode, setTelemetryByCode] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sourceIds || sourceIds.length === 0) { setTelemetryByCode({}); setLoading(false); return; }
    let alive = true;
    setLoading(true);

    const round2 = v => (v != null ? Math.round(Number(v) * 100) / 100 : null);

    supabase
      .from("v_hii_feed_stations_public")
      .select("source_id, external_station_code")
      .eq("feed_type", "telemetry_hii")
      .eq("is_active", true)
      .in("source_id", sourceIds)
      .then(async ({ data: feeds, error }) => {
        if (!alive) return;
        if (error || !feeds || feeds.length === 0) { setTelemetryByCode({}); return; }

        const sinceIso = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
        const entries = await Promise.all(feeds.filter(f => f.external_station_code).map(async feed => {
          const { data: rows } = await supabase
            .from("v_water_level_raw_public")
            .select("measured_at, level_raw, left_bank_msl, right_bank_msl, ground_level_msl")
            .eq("source_id", feed.source_id)
            .gte("measured_at", sinceIso)
            .order("measured_at");
          if (!rows || rows.length === 0) return [feed.external_station_code, null];

          const last = rows[rows.length - 1];
          const prev = rows.length >= 2 ? rows[rows.length - 2] : null;
          const currentLevel = round2(last.level_raw);
          const prevLevel = round2(prev?.level_raw);
          const leftBank = round2(last.left_bank_msl);
          const rightBank = round2(last.right_bank_msl);
          const groundLevel = round2(last.ground_level_msl);

          return [feed.external_station_code, {
            stationCode: feed.external_station_code,
            currentLevel, leftBank, rightBank, groundLevel,
            measureDatetime: last.measured_at,
            prevDiff: (currentLevel != null && prevLevel != null) ? round2(currentLevel - prevLevel) : null,
            distLeftBank: (leftBank != null && currentLevel != null) ? round2(leftBank - currentLevel) : null,
            distRightBank: (rightBank != null && currentLevel != null) ? round2(rightBank - currentLevel) : null,
            depthFromGround: (currentLevel != null && groundLevel != null) ? round2(currentLevel - groundLevel) : null,
            series: rows.map(r => ({ t: r.measured_at, level: round2(r.level_raw) })),
          }];
        }));

        if (!alive) return;
        setTelemetryByCode(Object.fromEntries(entries.filter(([, v]) => v)));
      })
      .catch(() => { if (alive) setTelemetryByCode({}); })
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [JSON.stringify(sourceIds)]);

  return { telemetryByCode, loading };
}

/* ─────────────────────────────────────────────
   password gate + บันทึกระดับน้ำ — ผ่าน RPC ที่มี SECURITY DEFINER
   (server ตรวจรหัสผ่านเอง client ไม่เคยเห็น hash)
───────────────────────────────────────────── */
export async function checkGatePassword(tambonId, gate, password) {
  const { data, error } = await supabase.rpc("check_gate_password", {
    p_tambon_id: tambonId, p_gate: gate, p_password: password,
  });
  if (error) throw error;
  return !!data;
}

export async function calcLevelPct(sourceId, levelValue) {
  const { data, error } = await supabase.rpc("fn_calc_level_pct", {
    p_source_id: sourceId, p_level_value: levelValue,
  });
  if (error) throw error;
  return data;
}

export async function submitWaterLevelReading({ tambonId, sourceId, readingDate, levelValue, levelPct, enteredBy, password }) {
  const { data, error } = await supabase.rpc("submit_water_level_reading", {
    p_tambon_id: tambonId,
    p_source_id: sourceId,
    p_reading_date: readingDate,
    p_level_value: levelValue,
    p_level_pct: levelPct,
    p_entered_by: enteredBy,
    p_password: password,
  });
  if (error) throw error;
  return data; // { success, error? }
}
