import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TECHS,STAGES,SOURCES,safeUrl,validDate,validateRecord,researchReview} from '../lib/model.js';
import {MONTHS,inResearchPeriod,amountRows,combinedAmountRows,monthlyDisclosureRows,monthlySeries,eventKey,ledgerCsv,categoryMonthRows,categoryMonthlyCsv} from '../lib/monthly.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/research-2026.json',import.meta.url))),all=[...data.events,...data.leads],rows=all.filter(inResearchPeriod),pending=all.filter(e=>researchReview(e)!=='accepted');
assert.equal(new Set(rows.map(e=>e.id)).size,rows.length);
assert(rows.every(inResearchPeriod));
assert(!inResearchPeriod({...rows[0],published_date:'2026-09-19',event_date:'2026-09-30'}));
assert(!inResearchPeriod({...rows[0],published_date:'2026-02-30',event_date:null}));
assert.equal(Object.keys(TECHS).length,12);assert(!TECHS.heterogeneous&&!TECHS.ai_appliance);
for(const c of Object.keys(TECHS).filter(c=>c!=='xpu'))for(const m of MONTHS)assert(data.queries.some(q=>q.category===c&&q.month===m),`${c} ${m} missing query`);
for(const e of rows){assert(e.categories.every(c=>TECHS[c]),e.id);assert(/^https:\/\//.test(e.url));assert(e.amount_cny==null||Number.isFinite(e.amount_cny));if(e.stage==='candidate')assert(!['award','contract'].includes(e.amount_kind),e.id);}
const token=rows.filter(e=>e.url.includes('1225402548.PDF'));assert.equal(token.length,1);assert(token[0].categories.includes('token_factory')&&token[0].categories.includes('supernode'));
const eligible=amountRows(rows);assert(!eligible.some(e=>e.amount_kind==='bid'||e.amount_kind==='ceiling'||e.id==='focus-cdb-hygon'||e.id==='focus-cdb-kunpeng'));
const suzhou=rows.filter(e=>e.id.includes('suzhou'));assert.equal(new Set(suzhou.map(e=>e.project_id)).size,1);assert.equal(amountRows(suzhou).filter(e=>e.amount_kind==='budget').length,1);
const historical=monthlySeries(rows,'budget',monthlyDisclosureRows(rows));assert(historical[0].amount>=44.18);assert.equal(monthlySeries(suzhou,'budget')[0].amount,null);
assert(!eligible.some(e=>e.id==='svc-20260514-eitech-gpu'));assert(historical[4].amount>=150);
const example={...rows.find(e=>e.amount_kind==='award'),amount_group:'selfcheck'};assert.equal(amountRows([example,{...example,id:'amendment',published_date:'2026-09-20',amount_cny:123}]).at(0).amount_cny,123);
const missing={...example,amount_cny:null};assert.equal(monthlySeries([missing],'award').find(m=>m.month===missing.published_date.slice(0,7)).amount,null);
assert(ledgerCsv([{...example,title:'=unsafe()'}]).includes("'=unsafe()"));
const seed=JSON.parse(fs.readFileSync(new URL('../data/seed.json',import.meta.url)));for(const r of seed)validateRecord({...r,revision:1});
for(const i of data.insights)for(const id of i.ids)assert(rows.some(e=>e.id===id));
if(data.leads){
 assert.equal(new Set(all.map(e=>e.id)).size,all.length);
 assert(pending.every(e=>e.amount_eligible===false));assert(!amountRows(all).some(e=>pending.some(l=>l.id===e.id)));
 assert(!amountRows([{...example,evidence_status:'reported',amount_eligible:true}]).length,'A readable report is not a verified amount');
 assert.equal(new Set(rows.filter(e=>/^recon-compute-00[1-3]$/.test(e.id)).map(eventKey)).size,1,'Three lots are one disclosure');
 assert.equal(new Set(rows.filter(e=>/^recon-compute-00[1-3]$/.test(e.id)).map(e=>e.project_id)).size,1);
 assert.equal(rows.filter(e=>/^recon-compute-00[1-3]$/.test(e.id)).reduce((s,e)=>s+e.amount_cny,0),168393468);
 assert.equal(rows.find(e=>e.id==='rec-svc-20260702-xingyun-vc').amount_cny,550848*10000);
 assert(!eligible.some(e=>e.id==='recon-infra-002'||e.amount_range_cny||e.amount_kind==='estimate'));
 assert(!rows.find(e=>e.id==='recon-compute-019').tags.includes('hyg_dcu'));
 assert.equal(rows.find(e=>e.id==='svc-20260825-iss-token-contract').stage,'research');
 for(const c of data.crosschecks){assert(c.title&&c.detail);for(const id of c.record_ids||[])assert(all.some(e=>e.id===id));}
 for(const b of data.benchmarks){assert(b.title&&b.summary&&b.limitation);assert(b.rows.every(r=>r.title&&r.reason&&r.status&&r.url));}
 assert.equal(data.benchmarks.find(b=>b.id==='qianlima-guangdong-storage-visible-page').rows.length,30);
 assert(ledgerCsv(data.leads).includes('corroborating_sources'));assert(ledgerCsv(rows).includes('service_duration_months'));
}
const matrix=categoryMonthRows(rows,pending,eligible);
const baselineRows=rows.filter(e=>!(data.rolling_update?.record_ids||[]).includes(e.id));
assert.equal(matrix.length,117,'Twelve topics plus CPU supplement, nine months');
assert.equal(matrix.find(r=>r.category==='compute_rental'&&r.month==='2026-07').contract,550848);
assert.equal(categoryMonthRows(baselineRows).find(r=>r.category==='focus'&&r.month==='2026-04').award,16839.3468);
assert.equal(matrix.find(r=>r.category==='optical_switch'&&r.month==='2026-01').award,null);
const filtered=categoryMonthRows(baselineRows.filter(e=>e.tags.includes('hyg_cpu')),pending,amountRows(baselineRows));
assert.equal(filtered.find(r=>r.category==='focus'&&r.month==='2026-04').award,2945.2,'Chip subset must not acquire other lots');
assert.equal(categoryMonthlyCsv(matrix).split('\r\n').length,118);
for(const c of Object.keys(TECHS).filter(c=>c!=='xpu'))for(const m of MONTHS){const r=matrix.find(x=>x.category===c&&x.month===m);assert.equal(r.events,new Set(rows.filter(e=>e.categories.includes(c)&&((e.event_date||e.published_date).slice(0,7)===m)).map(eventKey)).size);}
if(data.category_notes){assert.equal(data.category_notes.length,11);for(const n of data.category_notes){assert(TECHS[n.category]);for(const id of n.record_ids)assert([...rows,...data.leads].some(e=>e.id===id));}}
if(data.expansion){
 const batch=all.filter(e=>data.expansion.record_ids.includes(e.id));
 assert.equal(batch.length,data.expansion.added_records);
 assert.equal(data.expansion.sources.reduce((n,s)=>n+s.records,0),batch.length);
 assert(batch.every(e=>e.published_date<=data.period_end&&e.categories.length>0));
 assert(batch.filter(e=>e.evidence_status==='reported'||e.evidence_status==='lead').every(e=>!e.amount_eligible&&researchReview(e)==='pending'));
 assert(!amountRows(batch).some(e=>e.cross_period_exclusion),'Superseded rental budgets stay out of current amounts');
 assert.equal(batch.filter(e=>e.url.includes('1312782.html')).length,1,'One Lenovo launch must not be multiplied across categories');
 for(const e of batch){assert(safeUrl(e.url),e.id);assert(Object.hasOwn(STAGES,e.stage),e.id);assert(Object.hasOwn(SOURCES,e.source_type),e.id);}
}
if(data.source_remediation){
 const audit=JSON.parse(fs.readFileSync(new URL('../data/source-remediation.json',import.meta.url))),batch=all.filter(e=>audit.record_ids.includes(e.id));
 assert.deepEqual(audit,JSON.parse(fs.readFileSync(new URL('../public/source-remediation.json',import.meta.url))));
 assert.equal(batch.length,data.source_remediation.added_records);assert.equal(audit.sources.length,new Set(audit.sources.map(s=>s.source_id)).size);
 assert.deepEqual(new Set(audit.sources.flatMap(s=>s.record_ids)),new Set(batch.map(e=>e.id)));
 for(const e of batch){assert(safeUrl(e.url)&&validDate(e.published_date)&&e.published_date<=data.period_end,e.id);assert(!e.event_date||validDate(e.event_date));assert(e.categories.every(c=>TECHS[c]));assert(STAGES[e.stage]&&SOURCES[e.source_type]);}
 assert(!audit.references.some(r=>all.some(e=>e.id===r.id)),'Industry references are not CPU supplement events');
 assert.equal(batch.find(e=>e.id==='supp-proc-f8aa6a137ea4').amount_cny,null,'Unresolved amount unit remains null');
 assert(!batch.find(e=>e.id==='supp-proc-136cf38e457f').categories.includes('domestic_gpu'),'Ascend NPU is not domestic GPU');
 const project=batch.filter(e=>e.project_id==='豫财招标采购-2025-1278');assert.equal(project.length,2);assert.equal(combinedAmountRows(project).length,1);assert.equal(combinedAmountRows(project)[0]._amount_min,3753288);
}
console.log(JSON.stringify({result:'pass',records:rows.length,events:new Set(rows.map(eventKey)).size,coverage:99,checks:['date cutoff','retired categories rejected','amount-stage separation','project/lot dedup','historical disclosure','overlap exclusion','CSV safety','source URLs','insight references','expansion provenance and amount isolation','source-remediation coverage, classification and amount boundaries']}));
