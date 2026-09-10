import assert from 'node:assert/strict';
import handler from '../api/relationship-funnel-v2-dashboard.js';

const originalFetch=globalThis.fetch;
const originalUrl=process.env.RELATIONSHIP_ATTRIBUTION_BACKEND_URL;
const originalSecret=process.env.RELATIONSHIP_ATTRIBUTION_SECRET;
process.env.RELATIONSHIP_ATTRIBUTION_BACKEND_URL='https://example.test/v1/attribution';
process.env.RELATIONSHIP_ATTRIBUTION_SECRET='test-only';
const request={query:{data:'1',date_from:'2026-09-09',date_to:'2026-09-09',timezone:'Asia/Dubai'}};
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},send(v){this.body=v;},json(v){this.body=v;}};}
try {
  let calls=0;
  globalThis.fetch=async(url,options)=>{
    assert.equal(url.searchParams.get('timezone'),'Asia/Dubai');
    assert.equal(url.pathname,'/v1/funnel-stats-v2');
    assert.equal(options.method,undefined);
    calls++;
    if(calls===1) return {status:502,text:async()=>'',headers:new Headers()};
    return {status:200,text:async()=>'{"ok":true}',headers:new Headers({'content-type':'application/json'})};
  };
  let res=response(); await handler(request,res);
  assert.equal(calls,2); assert.equal(res.code,200);
  calls=0;
  globalThis.fetch=async()=>{calls++; throw new TypeError('network failure');};
  res=response(); await handler(request,res);
  assert.equal(calls,2); assert.equal(res.code,502);
  assert.match(res.body.error,/unavailable/);
  calls=0;res=response();
  await handler({query:{...request.query,timezone:'Invalid/Zone'}},res);
  assert.equal(res.code,400);assert.equal(calls,0);
  console.log('Relationship proxy: timezone forwarding, safe GET retry, bounded failure and validation passed.');
} finally {
  globalThis.fetch=originalFetch;
  if(originalUrl===undefined) delete process.env.RELATIONSHIP_ATTRIBUTION_BACKEND_URL;else process.env.RELATIONSHIP_ATTRIBUTION_BACKEND_URL=originalUrl;
  if(originalSecret===undefined) delete process.env.RELATIONSHIP_ATTRIBUTION_SECRET;else process.env.RELATIONSHIP_ATTRIBUTION_SECRET=originalSecret;
}
