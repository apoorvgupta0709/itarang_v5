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

export async function getIntellicarToken(): Promise<string> {
  const baseUrl = process.env.INTELLICAR_BASE_URL || "https://apiplatform.intellicar.in";
  const username = process.env.INTELLICAR_USERNAME;
  const password = process.env.INTELLICAR_PASSWORD;

  if (!username || !password) {
    throw new Error("Missing Intellicar credentials in environment variables.");
  }

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

  if (json?.status && json.status !== "SUCCESS") {
    throw new Error(`Intellicar token failed: ${json.msg || json.error}`);
  }

  const token =
    json?.token ||
    json?.access_token ||
    json?.data?.token ||
    json?.data?.access_token;

  if (!token) throw new Error(`Intellicar token missing in response: ${text}`);
  return token;
}

export async function intellicarPost(path: string, body: Record<string, any> = {}) {
  const baseUrl = process.env.INTELLICAR_BASE_URL || "https://apiplatform.intellicar.in";
  const token = await getIntellicarToken();

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

export async function listVehicleDeviceMapping(token: string): Promise<Array<{ vehicleno: string; deviceno: string }>> {
  const res = await intellicarPost("/api/standard/listvehicledevicemapping");
  if (res?.status === "SUCCESS") {
    return res.data || [];
  }
  throw new Error(`Failed to list vehicle device mapping: ${res?.msg || "Unknown error"}`);
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

export async function getGpsHistory(token: string, vehicleno: string, startMs: number, endMs: number) {
  return intellicarPost("/api/standard/getgpshistory", { vehicleno, starttime: startMs, endtime: endMs });
}

export async function getBatteryMetricsHistory(token: string, vehicleno: string, startMs: number, endMs: number) {
  return intellicarPost("/api/standard/getbatterymetricshistory", { vehicleno, starttime: startMs, endtime: endMs });
}

export async function getfuelhistory(token: string, vehicleno: string, inlitres: boolean, startMs: number, endMs: number) {
  return intellicarPost("/api/standard/getfuelhistory", { vehicleno, inlitres, starttime: startMs, endtime: endMs });
}

export async function getDistanceTravelled(token: string, vehicleno: string, startMs: number, endMs: number) {
  return intellicarPost("/api/standard/getdistancetravelled", { vehicleno, starttime: startMs, endtime: endMs });
}