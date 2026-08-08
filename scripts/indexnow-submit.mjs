import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://evolution.yourbalancerestored.com";
const host = new URL(origin).hostname;
const key = "461ad9efbb3d475437cc1bba9b0ac0d47f3374a408514a77";
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

if (!urlList.length) throw new Error("The sitemap contains no URLs.");
if (urlList.some((url) => new URL(url).hostname !== host)) throw new Error("The sitemap contains a foreign host.");

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host,
    key,
    keyLocation: `${origin}/${key}.txt`,
    urlList,
  }),
});

console.log(`IndexNow: ${response.status} ${response.statusText}; ${urlList.length} URL(s).`);
if (![200, 202].includes(response.status)) {
  console.error(await response.text());
  process.exitCode = 1;
}
