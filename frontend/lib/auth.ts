// lib/auth.ts
interface DecodedToken {
  exp?: number;
  sub?: string;
  [k: string]: any;
}

const TOKEN_KEY = "token";

function base64UrlToBase64(input: string) {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) base64 += "=".repeat(4 - pad);
  return base64;
}

function safeAtob(base64: string) {
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    return window.atob(base64);
  }
  // Node fallback
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const BufferClass = (globalThis as any).Buffer ?? require("buffer").Buffer;
  return BufferClass.from(base64, "base64").toString("utf8");
}

function decodeJwtPayload(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadB64Url = parts[1];
    const payloadB64 = base64UrlToBase64(payloadB64Url);
    const jsonString = safeAtob(payloadB64);
    try {
      return JSON.parse(jsonString);
    } catch {
      const percentDecoded = jsonString
        .split("")
        .map((c:any) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("");
      return JSON.parse(decodeURIComponent(percentDecoded));
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to decode JWT payload:", e);
    return null;
  }
}

export function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to save token:", e);
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to read token:", e);
    return null;
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    try {
      sessionStorage.removeItem("tf_last_action");
    } catch {}
    if (typeof window !== "undefined") {
      (window as any).__tf_logged_out = Date.now();
      window.dispatchEvent(new Event("tf-logout"));
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to clear token:", e);
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const token = getToken();
  if (!token) return false;
  const decoded = decodeJwtPayload(token);
  if (!decoded) {
    clearToken();
    return false;
  }
  const now = Date.now() / 1000;
  if (!decoded.exp || typeof decoded.exp !== "number" || decoded.exp < now) {
    clearToken();
    return false;
  }
  return true;
}
