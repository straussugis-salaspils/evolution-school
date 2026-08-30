import { createHash, timingSafeEqual } from "node:crypto";

import { RELATIONSHIP_DASHBOARD_PAGE } from "./_relationship-dashboard-page.js";

const DEFAULT_DASHBOARD_USERNAME = "ugis";
const DEFAULT_DASHBOARD_PASSWORD_SHA256 =
  "e7a32e016a43ba2450f4527cc036c2dfe539e67178396582d1461c5fb45bf295";

function sameSecret(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function authenticated(request) {
  const header = String(request.headers.authorization || "");
  if (!header.startsWith("Basic ")) return false;
  let decoded;
  try {
    decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  } catch {
    return false;
  }
  const separator = decoded.indexOf(":");
  if (separator < 0) return false;
  const suppliedUsername = decoded.slice(0, separator);
  const suppliedPassword = decoded.slice(separator + 1);
  const configuredUsername =
    process.env.RELATIONSHIP_DASHBOARD_USERNAME || DEFAULT_DASHBOARD_USERNAME;
  const configuredPassword = process.env.RELATIONSHIP_DASHBOARD_PASSWORD;
  const passwordMatches = configuredPassword
    ? sameSecret(suppliedPassword, configuredPassword)
    : sameSecret(
        createHash("sha256").update(suppliedPassword).digest("hex"),
        DEFAULT_DASHBOARD_PASSWORD_SHA256
      );
  return (
    sameSecret(suppliedUsername, configuredUsername) && passwordMatches
  );
}

function statsBackendUrl() {
  const attributionUrl = process.env.RELATIONSHIP_ATTRIBUTION_BACKEND_URL;
  if (!attributionUrl) return null;
  const url = new URL(attributionUrl);
  url.pathname = url.pathname.replace(/\/v1\/attribution\/?$/, "/v1/funnel-stats");
  return url;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "private, no-store, max-age=0");
  response.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  if (!authenticated(request)) {
    response.setHeader("WWW-Authenticate", 'Basic realm="Evolution House analytics", charset="UTF-8"');
    return response.status(401).send("Authentication required.");
  }
  if (String(request.query.data || "") !== "1") {
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
    );
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    return response.status(200).send(RELATIONSHIP_DASHBOARD_PAGE);
  }
  const backendUrl = statsBackendUrl();
  const backendSecret = process.env.RELATIONSHIP_ATTRIBUTION_SECRET;
  if (!backendUrl || !backendSecret) {
    return response.status(503).json({ error: "Statistics backend is not configured" });
  }
  for (const key of ["date_from", "date_to"]) {
    const value = String(request.query[key] || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return response.status(400).json({ error: `Invalid ${key}` });
    }
    backendUrl.searchParams.set(key, value);
  }
  try {
    const upstream = await fetch(backendUrl, {
      headers: { "X-Attribution-Secret": backendSecret, Accept: "application/json" },
      signal: AbortSignal.timeout(12000)
    });
    const text = await upstream.text();
    response.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return response.status(upstream.status).send(text);
  } catch {
    return response.status(502).json({ error: "Statistics backend unavailable" });
  }
}
