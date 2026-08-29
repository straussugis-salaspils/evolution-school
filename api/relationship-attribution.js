const ALLOWED_TESTS = new Set([
  "test_a_no_relationship",
  "test_b_relationship_challenges"
]);

function firstForwardedAddress(value) {
  return String(value || "").split(",", 1)[0].trim();
}

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
  if (!payload || typeof payload !== "object" || !ALLOWED_TESTS.has(payload.test_id)) {
    return response.status(400).json({ error: "Invalid attribution request" });
  }
  try {
    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Attribution-Secret": backendSecret,
        "X-Client-IP": firstForwardedAddress(
          request.headers["x-vercel-forwarded-for"] || request.headers["x-forwarded-for"]
        ),
        "X-Client-User-Agent": String(request.headers["user-agent"] || "").slice(0, 1024)
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000)
    });
    const text = await upstream.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = { error: "Invalid attribution backend response" };
    }
    return response.status(upstream.status).json(result);
  } catch {
    return response.status(502).json({ error: "Attribution backend unavailable" });
  }
}
