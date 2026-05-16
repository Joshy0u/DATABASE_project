export function getApiBase(): string {
  // We remove the fallback entirely and return an empty string.
  // If Vite reads the env successfully, it uses it. If it fails, it returns "", making the path relative.
  return ((import.meta.env?.VITE_API_BASE as string | undefined)?.trim() || "");
}

export async function apiGet<T>(path: string): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  const res = await fetch(`${getApiBase()}${cleanPath}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${getApiBase()}${cleanPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  console.log("print to trigger change?")
  return res.json() as Promise<T>;
}
