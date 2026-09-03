import { RELATIONSHIP_FUNNEL_V2_PAGE } from "./_relationship-funnel-v2-page.js";

function backendUrl() {
  const attributionUrl = process.env.RELATIONSHIP_ATTRIBUTION_BACKEND_URL;
  if (!attributionUrl) return null;
  const url = new URL(attributionUrl);
  url.pathname = url.pathname.replace(/\/v1\/attribution\/?$/, "/v1/funnel-stats-v2");
  return url;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "private, no-store, max-age=0");
  response.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  if (String(request.query.data || "") !== "1") {
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
    );
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    return response.status(200).send(RELATIONSHIP_FUNNEL_V2_PAGE);
  }
  const url = backendUrl();
  const secret = process.env.RELATIONSHIP_ATTRIBUTION_SECRET;
  if (!url || !secret) return response.status(503).json({ error: "Statistics backend is not configured" });
  for (const key of ["date_from", "date_to"]) {
    const value = String(request.query[key] || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return response.status(400).json({ error: `Invalid ${key}` });
    url.searchParams.set(key, value);
  }
  try {
    const upstream = await fetch(url, { headers: { "X-Attribution-Secret": secret }, signal: AbortSignal.timeout(12000) });
    const text = await upstream.text();
    response.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return response.status(upstream.status).send(text);
  } catch {
    return response.status(502).json({ error: "Statistics backend unavailable" });
  }
}
