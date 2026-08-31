import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey);

// slug ของตำบลนี้ (multi-tenant: หน้าเว็บของแต่ละตำบลจะตั้งค่าตัวนี้ต่างกัน)
export const TAMBON_SLUG = import.meta.env.VITE_TAMBON_SLUG || "mae-na-ruea";
