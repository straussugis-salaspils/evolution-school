import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gtmId = (process.env.EVOLUTION_HOUSE_GTM_ID || "").trim();
const gaMeasurementId = (process.env.EVOLUTION_HOUSE_GA_MEASUREMENT_ID || "").trim();

if (gtmId && !/^GTM-[A-Z0-9]+$/.test(gtmId)) {
  throw new Error("EVOLUTION_HOUSE_GTM_ID must be empty or a valid GTM container ID.");
}
if (gaMeasurementId && !/^G-[A-Z0-9]+$/.test(gaMeasurementId)) {
  throw new Error("EVOLUTION_HOUSE_GA_MEASUREMENT_ID must be empty or a valid GA4 Measurement ID.");
}

const content = `(function () {\n  "use strict";\n\n  window.EH_ANALYTICS_CONFIG = Object.freeze({\n    gtmId: ${JSON.stringify(gtmId)},\n  });\n})();\n`;
fs.writeFileSync(path.join(root, "analytics-config.js"), content, "utf8");
console.log(`Analytics config written: GTM ${gtmId ? "configured" : "disabled"}; GA4 ${gaMeasurementId ? "documented for GTM setup" : "not provided"}.`);
