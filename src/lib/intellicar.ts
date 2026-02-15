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
    // IMPORTANT: keep it server-side only
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Intellicar token failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as IntellicarTokenResponse;

  // Intellicar might return token under different keys
  const token =
    json.token ||
    json.access_token ||
    json?.data?.token ||
    json?.data?.access_token;

  if (!token) {
    throw new Error(`Intellicar token missing in response: ${JSON.stringify(json)}`);
  }

  return token;
}

/**
 * Example helper: call any Intellicar endpoint using token
 */
export async function intellicarFetch(path: string, body?: any) {
  const baseUrl = mustEnv("INTELLICAR_BASE_URL");
  const token = await intellicarGetToken();

  const res = await fetch(`${baseUrl}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      // adjust header name if Intellicar expects something else
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch {}

  if (!res.ok) {
    throw new Error(`Intellicar fetch failed: ${res.status} ${text}`);
  }

  return json ?? text;
}