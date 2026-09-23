import assert from 'node:assert/strict';
const url='http://127.0.0.1:5173/api/radar';
async function call(body,suffix=''){const r=await fetch(url+suffix,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);return {status:r.status,data:await r.json()};}
const initial=(await call()).data;
assert.deepEqual([initial.sync.verified,initial.sync.events,initial.sync.projects],[118,104,50]);
const e=initial.records.find(e=>e.id==='carry-AD-AI-002');
assert.equal(e._ref.source,'research');
assert.equal((await call({op:'save',record:{...e,id:'AD-AI-002'}})).status,409);
assert.equal((await call({op:'save_research',section:'leads',key:e.id,revision:0,value:e})).status,409);
assert.equal((await call({op:'save_research',section:'events',key:'QA-001',revision:0,value:e})).status,409);
const payload={op:'save_research',section:e._ref.section,key:e.id,revision:e._revision,value:{...e,note:'仅本地：跨栏目状态验证',evidence_status:'lead'}};
const saved=await call(payload);assert.equal(saved.status,200,JSON.stringify(saved.data));
try{
 const d=(await call()).data,r=d.records.find(r=>r.id===e.id);
 assert.equal(r.review_status,'pending');assert.equal(d.sync.verified,117);assert.equal(d.sync.pending,initial.sync.pending+1);
 assert.equal(d.research.events.find(r=>r.id===e.id).note,r.note);
 const a=(await call(null,`?history=AD-AI-002`)).data.history,b=(await call(null,`?research_history=${e.id}&section=events`)).data.history;
 assert.deepEqual(a,b);assert.equal(a[0].data.value.note,payload.value.note);
 assert.equal((await call(payload)).status,409);
}finally{assert.equal((await call({...payload,revision:saved.data.record._revision,value:{...e,note:e.note||''}})).status,200);}
// Importing any existing monthly original URL must not create a duplicate work row.
const importResult=await call({op:'import',tech:'supernode',rows:[{title:e.title,url:e.url,excerpt:e.fact_summary}]});
assert.equal(importResult.status,200);assert.equal(importResult.data.added,0);
const after=(await call()).data;assert.equal(after.records.length,initial.records.length);
assert.equal(after.sync.verified,118);
console.log('PASS: cross-column saves and status changes, shared history through legacy aliases, conflict protection, canonical imports deduplicate without losing multi-lot rows.');
