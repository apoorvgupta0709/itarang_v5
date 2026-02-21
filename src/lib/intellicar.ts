type IntellicarTokenResponse = {
  token?: string;
  access_token?: string;
  data?: any;
};

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export async function intellicarGetToken(): Promise<string> {
  const baseUrl = mustEnv("INTELLICAR_BASE_URL");
  const username = mustEnv("INTELLICAR_USERNAME");
  const password = mustEnv("INTELLICAR_PASSWORD");

  const res = await fetch(`${baseUrl}/api/standard/gettoken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`Intellicar token failed: ${res.status} ${text}`);

  let json: IntellicarTokenResponse | any = {};
  try { json = JSON.parse(text); } catch { }

  const token =
    json?.token ||
    json?.access_token ||
    json?.data?.token ||
    json?.data?.access_token;

  if (!token) throw new Error(`Intellicar token missing in response: ${text}`);
  return token;
}

export async function intellicarPost(path: string, body: Record<string, any> = {}) {
  const baseUrl = mustEnv("INTELLICAR_BASE_URL");
  const token = await intellicarGetToken();

  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, ...body }),
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  let json: any = null;
  try { json = JSON.parse(text); } catch { }

  if (!res.ok) throw new Error(`Intellicar call failed: ${res.status} ${text}`);
  return json ?? text;
}

/** Returns number or null (treats "NA", "", null as null) */
export function toNum(v: any): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || s.toUpperCase() === "NA" || s.toLowerCase() === "null") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * For Drizzle decimal columns: return a numeric STRING or null.
 * This prevents inserting "NA" into numeric columns.
 */
export function toDecStr(v: any): string | null {
  const n = toNum(v);
  if (n === null) return null;
  // keep as string for drizzle decimal
  return String(n);
}

// ==== HISTORICAL ENDPOINTS ====

export async function getgpshistory(token: string, vehicleno: string, startMs: number, endMs: number) {
  return intellicarPost("/api/standard/getgpshistory", { vehicleno, starttime: startMs, endtime: endMs });
}

export async function getbatterymetricshistory(token: string, vehicleno: string, startMs: number, endMs: number) {
  return intellicarPost("/api/standard/getbatterymetricshistory", { vehicleno, starttime: startMs, endtime: endMs });
}

export async function getfuelhistory(token: string, vehicleno: string, inlitres: boolean, startMs: number, endMs: number) {
  return intellicarPost("/api/standard/getfuelhistory", { vehicleno, inlitres, starttime: startMs, endtime: endMs });
}

export async function getdistancetravelled(token: string, vehicleno: string, startMs: number, endMs: number) {
  return intellicarPost("/api/standard/getdistancetravelled", { vehicleno, starttime: startMs, endtime: endMs });
}