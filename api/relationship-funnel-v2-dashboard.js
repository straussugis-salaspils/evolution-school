import { createHash, timingSafeEqual } from "node:crypto";

import { RELATIONSHIP_FUNNEL_V2_PAGE } from "./_relationship-funnel-v2-page.js";

const DEFAULT_USERNAME = "ugis";
const DEFAULT_PASSWORD_SHA256 = "e7a32e016a43ba2450f4527cc036c2dfe539e67178396582d1461c5fb45bf295";

function sameSecret(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

function authenticated(request) {
  const header = String(request.headers.authorization || "");
  if (!header.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const separator = decoded.indexOf(":");
  if (separator < 0) return false;
  const username = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);
  const configuredUsername = process.env.RELATIONSHIP_DASHBOARD_USERNAME || DEFAULT_USERNAME;
  const configuredPassword = process.env.RELATIONSHIP_DASHBOARD_PASSWORD;
  const passwordMatches = configuredPassword
    ? sameSecret(password, configuredPassword)
    : sameSecret(createHash("sha256").update(password).digest("hex"), DEFAULT_PASSWORD_SHA256);
  return sameSecret(username, configuredUsername) && passwordMatches;
}

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
  if (!authenticated(request)) {
    response.setHeader("WWW-Authenticate", 'Basic realm="Evolution House analytics", charset="UTF-8"');
    return response.status(401).send("Authentication required.");
  }
  if (String(request.query.data || "") !== "1") {
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
