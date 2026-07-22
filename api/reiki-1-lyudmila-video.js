const SOURCE_PAGE = "https://smarttraining.getcourse.ru/reiki1st";
const VIDEO_HASH = "9f424a25c07b8566b50fe3cdbe3bad23";

function decodeHtml(value) {
  return value.replace(/&amp;/g, "&");
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const upstream = await fetch(SOURCE_PAGE, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Evolution-House-video-loader/1.0",
      },
    });
    if (!upstream.ok) throw new Error(`GetCourse returned ${upstream.status}`);

    const source = await upstream.text();
    const frame = new RegExp(
      `data-video-hash=["']${VIDEO_HASH}["'][\\s\\S]*?data-iframe-src=["']([^"']+)["']`,
      "i",
    ).exec(source);
    const iframeSrc = frame?.[1] ? decodeHtml(frame[1]) : "";
    if (!iframeSrc.startsWith("https://vh-api-1-de.gceuproxy.com/sign-player/")) {
      throw new Error("Current GetCourse player link was not found");
    }

    response.setHeader("Cache-Control", "no-store, max-age=0");
    response.status(200).json({ iframeSrc });
  } catch (error) {
    response.setHeader("Cache-Control", "no-store, max-age=0");
    response.status(502).json({ error: "Unable to refresh the video player" });
  }
}
