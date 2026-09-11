import assert from "node:assert/strict";
import fs from "node:fs";
import handler from "../api/relationship-web-quiz.js";

const base = "relationship-test/relationship-challenges-online/";
const html = fs.readFileSync(base + "index.html", "utf8");
const client = fs.readFileSync(base + "quiz.js", "utf8");
assert.match(html, /noindex, nofollow, noarchive/);
assert.match(html, /ПРОЙТИ ТЕСТ ЗА 3 МИНУТЫ/);
assert.doesNotMatch(html + client, /fbq\(|gtag\(|connect\.facebook|googletagmanager|\/analytics\.js|bot_token|scores_snapshot/);
assert.doesNotMatch(client, /innerHTML/);
assert.match(client, /sessionStorage/);
const originalFetch = globalThis.fetch;
const originalUrl = process.env.RELATIONSHIP_ATTRIBUTION_BACKEND_URL;
const originalSecret = process.env.RELATIONSHIP_ATTRIBUTION_SECRET;
function response() {
  return { headers: {}, code: 0, body: null,
    setHeader(k,v) { this.headers[k]=v; },
    status(code) { this.code=code; return this; },
    json(body) { this.body=body; return this; } };
}
try {
  process.env.RELATIONSHIP_ATTRIBUTION_BACKEND_URL = "https://fixture.invalid/v1/attribution";
  process.env.RELATIONSHIP_ATTRIBUTION_SECRET = "fixture-not-real";
  const payload = {action:"visit",session_key:"9b2e204d-489a-40b0-9b38-c5474a45d2c5",is_preview:false,utm_source:"meta"};
  let calls=0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url.href,"https://fixture.invalid/v1/web-quiz");
    assert.equal(options.headers["X-Attribution-Secret"],"fixture-not-real");
    assert.deepEqual(JSON.parse(options.body), {action:payload.action,session_key:payload.session_key});
    return {ok:true,status:200,json:async()=>({preview:true})};
  };
  const ok=response(); await handler({method:"POST",body:payload},ok);
  assert.equal(ok.code,200); assert.equal(ok.body.preview,true);
  assert.match(ok.headers["Cache-Control"],/no-store/);
  const bad=response(); await handler({method:"POST",body:{...payload,action:"admin"}},bad);
  assert.equal(bad.code,400);
  const get=response(); await handler({method:"GET"},get); assert.equal(get.code,405);
  assert.equal(calls,1);
  globalThis.fetch=async()=>{throw new Error("fixture timeout");};
  const timeout=response(); await handler({method:"POST",body:payload},timeout);
  assert.equal(timeout.code,502);
} finally {
  globalThis.fetch=originalFetch;
  if (originalUrl === undefined) delete process.env.RELATIONSHIP_ATTRIBUTION_BACKEND_URL;
  else process.env.RELATIONSHIP_ATTRIBUTION_BACKEND_URL=originalUrl;
  if (originalSecret === undefined) delete process.env.RELATIONSHIP_ATTRIBUTION_SECRET;
  else process.env.RELATIONSHIP_ATTRIBUTION_SECRET=originalSecret;
}
console.log("Web quiz smoke: review isolation, safe rendering, API validation, proxy route, timeout: PASS");
