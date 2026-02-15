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
  try { json = JSON.parse(text); } catch {}

  const token =
    json?.token ||
    json?.access_token ||
    json?.data?.token ||
    json?.data?.access_token;

  if (!token) throw new Error(`Intellicar token missing in response: ${text}`);
  return token;
}

/**
 * Intellicar Standard API pattern (as per your examples):
 * POST endpoint with JSON body containing token + other params.
 */
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
  try { json = JSON.parse(text); } catch {}

  if (!res.ok) throw new Error(`Intellicar call failed: ${res.status} ${text}`);
  return json ?? text;
}

export function toNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function toDecStr(v: any): string | null {
  if (v === null || v === undefined || v === "") return null;
  return String(v);
}