import assert from 'node:assert/strict';
const base=new URL(process.argv[2]||'http://127.0.0.1:5173/');
const r=await fetch(base);assert.equal(r.status,200);const html=await r.text();
const nav=html.match(/<nav\b[^>]*aria-label="主导航"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
assert.ok(nav,'Main navigation is present');
assert.equal((nav.match(/<button\b/g)||[]).length,4);
for(const label of ['市场风向','月度研究','来源与采集','统计口径'])assert.ok(nav.includes(label));
assert.match(html,/ISG/);assert.match(html,/新增线索/);
assert.doesNotMatch(html,/登录个人工作台/);
const api=await fetch(new URL('/api/radar',base));assert.equal(api.status,200);const d=await api.json();
assert.ok(d.records.length>=167);assert.ok(d.research.events.length>=118);assert.ok(d.research.leads.length>=46);
assert.equal(d.sync.total,d.records.length);assert.equal(d.records.length,d.research.events.length+d.research.leads.length);
assert.equal(d.records.filter(e=>['pending','quarantine'].includes(e.review_status)).length,d.sync.pending+d.sync.quarantine);
for(const row of d.records){const counterpart=[...d.research.events,...d.research.leads].find(e=>e.id===row.id);assert.deepEqual(counterpart,row);}
assert.equal((await fetch(new URL('/api/radar?history=AD-AI-002',base))).status,200);
console.log('PASS: anonymous page, four sections, shared work records, full research data and history accessible without cookies.');
