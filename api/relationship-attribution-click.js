const ALLOWED_TESTS = new Set([
  "test_a_no_relationship",
  "test_b_relationship_challenges"
]);
const SAFE_TOKEN = /^[A-Za-z0-9_-]{12,24}$/;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }
  const backendUrl = process.env.RELATIONSHIP_ATTRIBUTION_BACKEND_URL;
  const backendSecret = process.env.RELATIONSHIP_ATTRIBUTION_SECRET;
  if (!backendUrl || !backendSecret) {
    return response.status(503).json({ error: "Attribution is not configured" });
  }
  const payload = request.body;
  if (
    !payload ||
    typeof payload !== "object" ||
    !ALLOWED_TESTS.has(payload.test_id) ||
    typeof payload.token !== "string" ||
    !SAFE_TOKEN.test(payload.token)
  ) {
    return response.status(400).json({ error: "Invalid attribution click" });
  }
  try {
    const upstream = await fetch(`${backendUrl}/click`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Attribution-Secret": backendSecret
      },
      body: JSON.stringify({ test_id: payload.test_id, token: payload.token }),
      signal: AbortSignal.timeout(5000)
    });
    const result = await upstream.json().catch(() => ({ error: "Invalid response" }));
    return response.status(upstream.status).json(result);
  } catch {
    return response.status(502).json({ error: "Attribution backend unavailable" });
  }
}
