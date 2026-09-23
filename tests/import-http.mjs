import assert from 'node:assert/strict';

const base=process.env.RADAR_BASE_URL||'http://localhost:5173';
const target=new URL(base);
assert.ok(target.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(target.hostname)&&!target.username&&!target.password,'Write tests require a local HTTP server');
async function call(body){const r=await fetch(base+'/api/radar',{headers:{'content-type':'application/json'},...(body?{method:'POST',body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};}
const initial=await call();const accepted=initial.data.records.filter(r=>r.review_status==='accepted').length;
const row={title:'本地功能验证：数据导入',url:'https://www.h3c.com/cn/local-import-check',published_date:'2026-09-20',excerpt:'仅用于本地验证，不发布为研究证据。'};
const imported=await call({op:'import',rows:[row,row],tech:'liquid_cooling',source_id:'h3c'});assert.equal(imported.status,200);assert.ok(imported.data.added<=1);assert.equal(imported.data.added+imported.data.skipped,2);
const duplicate=await call({op:'import',rows:[row],tech:'liquid_cooling',source_id:'h3c'});assert.equal(duplicate.data.added,0);
const after=await call();assert.equal(after.data.records.filter(r=>r.review_status==='accepted').length,accepted);assert.ok(after.data.records.some(r=>r.url===row.url&&r.source_excerpt===row.excerpt&&r.review_status==='pending'));
const invalid=await call({op:'import',rows:[{...row,url:'https://www.h3c.com/cn/new-local-import'}, {...row,url:'javascript:alert(1)'}],tech:'liquid_cooling'});assert.equal(invalid.status,400);assert.equal((await call()).data.records.length,after.data.records.length);
assert.equal((await call({op:'discover',source_id:'newrank',keyword:'液冷',tech:'liquid_cooling'})).status,400);
const prefix=crypto.randomUUID(),projectRows=['P1','P2'].map(project_id=>({...row,url:`https://www.h3c.com/cn/local-project-check-${prefix}`,project_id,categories:[],tags:['hyg_cpu'],amount_cny:35,amount_unit:'万元',amount_kind:'budget',stage:'tender'}));
const projects=await call({op:'import',rows:projectRows,tech:'liquid_cooling',source_id:'h3c'});assert.equal(projects.status,200);assert.equal(projects.data.added,2);
assert.equal((await call({op:'import',rows:projectRows,tech:'liquid_cooling',source_id:'h3c'})).data.added,0);
const projectSnapshot=await call(),saved=projectSnapshot.data.records.filter(r=>r.url===projectRows[0].url);
assert.equal(saved.length,2);assert(saved.every(r=>r.techs.length===0&&r.categories.length===0&&r.value_cny===350000&&r.amount_cny===350000));
const unknown={...row,url:`https://www.h3c.com/cn/local-unknown-check-${prefix}`};
assert.equal((await call({op:'import',rows:[unknown],tech:'liquid_cooling'})).data.added,1);
const beforeConflict=(await call()).data.records.length;
const conflict=await call({op:'import',rows:[{...row,url:`https://www.h3c.com/cn/local-atomic-check-${prefix}`},{...unknown,project_id:'KNOWN-PROJECT'}],tech:'liquid_cooling'});
assert.equal(conflict.status,409);assert.match(conflict.data.error,/项目编号.*歧义/);assert.equal((await call()).data.records.length,beforeConflict);
const reverse=await call({op:'import',rows:[{...projectRows[0],project_id:''}],tech:'liquid_cooling'});assert.equal(reverse.status,409);assert.equal((await call()).data.records.length,beforeConflict);
console.log('PASS: persistent pending-only import, URL deduplication, invalid batch atomic rejection, no paid API, accepted records preserved');
console.log('PASS: independent projects per article, legacy unknown-project deduplication, atomic ambiguity rejection, CPU focus and yuan amount projection');
