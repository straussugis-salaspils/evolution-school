const ACTIONS = new Set(["visit", "start", "answer", "select", "view", "telegram"]);

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "private, no-store, max-age=0");
  response.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }
  const payload = request.body;
  if (!payload || !ACTIONS.has(payload.action) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(payload.session_key || "") ||
      JSON.stringify(payload).length > 4096) {
    return response.status(400).json({ error: "Invalid quiz request" });
  }
  const url = process.env.RELATIONSHIP_ATTRIBUTION_BACKEND_URL;
  const secret = process.env.RELATIONSHIP_ATTRIBUTION_SECRET;
  if (!url || !secret) return response.status(503).json({ error: "Quiz temporarily unavailable" });
  try {
    const target = new URL(url);
    target.pathname = target.pathname.replace(/\/v1\/attribution\/?$/, "/v1/web-quiz");
    const upstream = await fetch(target, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Attribution-Secret": secret },
      // No cookies, IP address, ad IDs, or browser-selected live/preview flag forwarded.
      body: JSON.stringify(Object.fromEntries(["action", "session_key", "answers", "profile", "screen"]
        .filter((field) => field in payload).map((field) => [field, payload[field]]))),
      signal: AbortSignal.timeout(12000)
    });
    if (!upstream.ok) return response.status(upstream.status).json({ error: "Quiz request failed" });
    return response.status(200).json(await upstream.json());
  } catch {
    return response.status(502).json({ error: "Quiz temporarily unavailable" });
  }
}
