import assert from 'node:assert/strict';
const base='http://127.0.0.1:5173';
const call=async(body,extra={})=>{const r=await fetch(base+'/api/radar',{headers:{...(body?{'Content-Type':'application/json'}:{}),...extra},...(body?{method:'POST',body:JSON.stringify(body)}:{})});return{status:r.status,data:r.headers.get("content-type")?.includes("application/json")?await r.json():{error:await r.text()}};};
const initial=await call();assert.equal(initial.status,200);assert.ok(initial.data.records.length>=21);
const e=initial.data.records.find(r=>r.id==='AD-AI-003');
let saved;
try{
 saved=await call({op:'save_workspace_research',key:e.id,revision:e._revision,value:{...e,note:'本地验证：匿名共享持久化'}});assert.equal(saved.status,200);
 assert.equal((await call(undefined,{'oai-authenticated-user-id':'another-visitor'})).data.records.find(r=>r.id===e.id).note,'本地验证：匿名共享持久化');
 assert.equal((await call({op:'save_workspace_research',key:e.id,revision:e._revision,value:e})).status,409);
 assert.equal((await call({op:'save_workspace_research',key:e.id,revision:saved.data.record._revision,value:{...e,published_date:'2026-02-30'}})).status,400);
 assert.equal((await call({op:'save',record:saved.data.record},{Origin:'https://example.net'})).status,403);
}finally{if(saved?.status===200)assert.equal((await call({op:'save_workspace_research',key:e.id,revision:saved.data.record._revision,value:e})).status,200);}
for(const section of ['events','leads','monthly_notes','insights','category_notes']){
 const current=(await call()).data.research[section][0];
 const key=section==='monthly_notes'?current.month:section==='category_notes'?current.category:section==='insights'?'0':current.id;
 const field=section==='monthly_notes'?'text':section==='insights'?'inference':section==='category_notes'?'interpretation':'note';
 const payload={op:'save_research',section,key,revision:current._revision||0,value:{...current,[field]:'本地匿名共享验证'}};
 const saved=await call(payload);assert.equal(saved.status,200,JSON.stringify(saved.data));
 try{
  const read=(await call()).data.research[section].find((r,i)=>(section==='monthly_notes'?r.month:section==='category_notes'?r.category:section==='insights'?String(i):r.id)===key);
  assert.equal(read[field],'本地匿名共享验证');
  if(['events','leads'].includes(section))assert.equal((await call()).data.records.find(e=>e.id===key)[field],'本地匿名共享验证');
  assert.equal((await call(payload)).status,409);
  const history=await fetch(base+`/api/radar?research_history=${encodeURIComponent(key)}&section=${section}`).then(r=>r.json());assert.equal(history.history[0].data.value[field],'本地匿名共享验证');
 }finally{assert.equal((await call({...payload,revision:saved.data.record._revision,value:{...current,[field]:current[field]||''}})).status,200);}
}
assert.equal((await call({op:'save_research',section:'events',key:'bad',revision:0,value:{title:'bad',url:'javascript:alert(1)'}})).status,400);
const capture=await call({op:'collect',url:'https://example.net/research',tech:'supernode'});assert.equal(capture.status,200);assert.equal(capture.data.capture.status,'failed');
console.log('PASS: anonymous shared workspace and all five research sections persist across visitors; conflicts, history, input validation and cross-origin rejection.');
