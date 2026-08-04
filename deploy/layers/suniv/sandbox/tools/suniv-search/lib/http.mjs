const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export function contactEmail() {
  return process.env.SUNIV_CONTACT_EMAIL || "";
}

export function userAgent() {
  const mail = contactEmail();
  return mail ? `SUniv/1.0 (mailto:${mail})` : "SUniv/1.0";
}

export class SourceError extends Error {
  constructor(source, message) {
    super(message);
    this.source = source;
  }
}

async function once(url, { headers = {}, timeoutMs = 20000, accept = "application/json", method, body }) {
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: method || (body ? "POST" : "GET"),
      body,
      headers: { accept, "user-agent": userAgent(), ...headers },
      signal: control.signal,
      redirect: "follow",
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchText(source, url, options = {}) {
  const attempts = options.attempts ?? 3;
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 400 * 2 ** (attempt - 1)));
    let response;
    try {
      response = await once(url, options);
    } catch (err) {
      lastError = new SourceError(source, err.name === "AbortError" ? "timed out" : err.message);
      continue;
    }
    if (response.ok) return await response.text();
    if (!RETRYABLE.has(response.status)) {
      throw new SourceError(source, `HTTP ${response.status} ${response.statusText}`.trim());
    }
    lastError = new SourceError(source, `HTTP ${response.status} after ${attempt + 1} attempt(s)`);
  }
  throw lastError;
}

export async function fetchJson(source, url, options = {}) {
  const body = await fetchText(source, url, options);
  try {
    return JSON.parse(body);
  } catch {
    throw new SourceError(source, "response was not JSON");
  }
}
