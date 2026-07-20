import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE_URL = "https://evolution.yourbalancerestored.com";
const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const publicUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const hiddenRoutes = [
  "/18-18-18/",
  "/472861-ostrova-vezeniya/",
  "/568241-reiki-1/",
  "/604918-vkus-legkosti/",
  "/684291-off-switch-training/",
  "/731956-reiki-2/",
  "/759214-vkus-sily/",
  "/836472-vysokaya-glubina/",
  "/915804-kvantovaya-aktivaciya/",
  "/individualnyj-retrit/",
];
const urls = [...new Set([
  ...publicUrls,
  ...hiddenRoutes.map((route) => `${BASE_URL}${route}`),
  `${BASE_URL}/robots.txt`,
  `${BASE_URL}/sitemap.xml`,
])];

const results = [];
let cursor = 0;
const worker = async () => {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    try {
      const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
      const contentType = response.headers.get("content-type") || "";
      await response.body?.cancel();
      results.push({ url, status: response.status, finalUrl: response.url, contentType });
    } catch (error) {
      results.push({ url, status: 0, finalUrl: "", contentType: "", error: error.message });
    }
  }
};
await Promise.all(Array.from({ length: 6 }, worker));

results.sort((a, b) => a.url.localeCompare(b.url));
let failures = 0;
for (const result of results) {
  const ok = result.status === 200;
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${result.status || "ERR"} ${result.url}${result.finalUrl && result.finalUrl !== result.url ? ` -> ${result.finalUrl}` : ""}${result.error ? `: ${result.error}` : ""}`);
}
console.log(`Production smoke: ${results.length} URLs, ${failures} failures.`);
process.exitCode = failures ? 1 : 0;
