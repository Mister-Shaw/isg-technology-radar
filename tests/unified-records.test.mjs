import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {unifyRecords,LEGACY_ALIASES} from '../lib/unified-records.js';
import {summary,researchReview,exportCsv} from '../lib/model.js';
import {inObservationPeriod,inResearchPeriod,amountRows,reportedAmountRows,monthlySeries,categoryMonthRows,monthOf} from '../lib/monthly.js';
import {researchWithEdits} from '../lib/research-editing.js';
const read=name=>JSON.parse(readFileSync(new URL('../data/'+name,import.meta.url)));
const full=read('research-2026.json'),added=new Set([...(full.expansion?.record_ids||[]),...(full.source_remediation?.record_ids||[]),...(full.rolling_update?.record_ids||[])]);
// Keep the original migration regression stable as research batches grow.
const research={...full,events:full.events.filter(e=>!added.has(e.id)),leads:full.leads.filter(e=>!added.has(e.id))},legacy=read('seed.json').map(e=>({...e,revision:1}));
const expanded=unifyRecords(full,legacy);for(const id of added)assert.equal(expanded.records.filter(e=>e.id===id).length,1,'New research survives the shared-workspace projection');
const unified=unifyRecords(research,legacy),s=summary(unified.records);
assert.deepEqual(unified.sync,{total:167,included:166,included_events:152,included_projects:63,verified:127,events:113,pending:37,quarantine:2,history:1,projects:53,merged:18,supplemental:3,as_of:'2026-09-20'});
assert.equal(new Set(unified.records.map(e=>e.id)).size,167);
assert.deepEqual([...unified.research.events,...unified.research.leads].filter(inResearchPeriod).map(e=>e.id),s.rows.map(e=>e.id));
assert.equal(unified.records.filter(e=>researchReview(e)!=='accepted').length,39);
assert.equal(categoryMonthRows(s.rows,unified.research.leads).length,117);
assert.equal(s.techs.find(t=>t.id==='focus').docs,19);
assert.deepEqual(monthlySeries(s.rows).map(e=>e.events),[7,2,11,9,11,19,21,19,14]);
assert.deepEqual(monthlySeries(s.rows).map(e=>e.projects),[1,1,7,6,5,11,9,10,6]);
const included=summary(unified.records,'2026-01-01','2026-09-20',true),period=unified.records.filter(inObservationPeriod),reported=reportedAmountRows(period);
assert.deepEqual([included.docs,included.events,included.demand],[166,152,63]);
assert.deepEqual(monthlySeries(period).map(e=>e.events),[8,8,14,16,13,25,25,27,16]);
assert.deepEqual(monthlySeries(period).map(m=>period.filter(e=>monthOf(e)===m.month).length),[11,8,15,18,16,26,27,28,17]);
assert(period.some(e=>e.id==='QA-001'),'Conflicting records are included with their status retained');
assert(!reported.some(e=>researchReview(e)!=='pending'||e.status_conflict||['bid','estimate','none'].includes(e.amount_kind)));
assert.deepEqual(['budget','award','contract','investment'].map(k=>Math.round(reported.filter(e=>e.amount_kind===k).reduce((n,e)=>n+e.amount_cny,0)*100)),[73940328200,278751831219,0,1497500000000]);
const reportedExample=reported.find(e=>e.amount_kind==='award'),knownExample={...reportedExample,id:'known-example',verified_fulltext:true,evidence_status:'primary',amount_eligible:true};
assert.equal(reportedAmountRows([reportedExample,{...reportedExample,id:'repeat'}]).length,1,'Deduplicate unverified reports');
assert.equal(reportedAmountRows([reportedExample,knownExample]).length,0,'An already verified amount is not counted again as reported');
assert.equal(reportedExample.amount_eligible,false,'Calculation must not promote source evidence');
assert.equal(inObservationPeriod({...reportedExample,event_date:'2026-09-30'}),false);
assert.equal(inObservationPeriod({...reportedExample,published_date:'2026-02-30'}),false);
const matrix=categoryMonthRows(period,period.filter(e=>researchReview(e)!=='accepted'));
assert.equal(matrix.filter(e=>e.category==='focus').reduce((n,e)=>n+e.records,0),33);
assert.equal(matrix.filter(e=>e.category==='ai_storage').reduce((n,e)=>n+e.records,0),7);
assert.equal(unified.records.find(e=>e.id==='ARCH-SN-05').project_id,unified.records.find(e=>e.id==='compute-001').project_id);
assert.equal(unified.records.find(e=>e.id==='QA-001').review_status,'quarantine');
assert.ok(!s.rows.some(e=>e.id==='AD-AI-003'));
// URL sharing must retain distinct CPU/accelerator events and multi-lot amounts.
assert.equal(unified.records.find(e=>e.id==='compute-007').legacy_record_id,'ARCH-SN-01');
assert.equal(unified.records.find(e=>e.id==='compute-008').legacy_record_id,undefined);
const totals=rows=>Object.fromEntries(['budget','award','contract','investment'].map(kind=>[kind,amountRows(rows).filter(e=>e.amount_kind===kind).reduce((n,e)=>n+e.amount_cny,0)]));
assert.deepEqual(totals(s.rows),totals([...research.events,...research.leads]));
assert.deepEqual(research.recheck.summary.amount_delta_cny,{budget:4500000,award:3649662,contract:0,investment:0});
assert.equal(research.recheck.entries.length,48);
for(const r of research.recheck.entries){const e=unified.records.find(e=>e.id===r.id);assert.equal(researchReview(e)==='accepted',r.decision==='promote',r.id);assert(r.reason&&r.next_action&&r.sources.length);}
// Monthly values take precedence, while legacy annotations survive and remain clearable.
const old=legacy.find(e=>e.id==='AD-LC-001');old.note='Existing note';old.followup_on='2026-10-01';
const initial=unifyRecords(research,legacy).records.find(e=>e.id===LEGACY_ALIASES[old.id]);
assert.equal(initial.note,old.note);assert.equal(initial.followup_on,old.followup_on);assert.equal(initial.amount_cny,980000000);
const edit={...research.events.find(e=>e.id===initial.id),note:'',followup_on:null,categories:[],evidence_status:'lead'};
const changed=unifyRecords(researchWithEdits(research,[{section:'events',key:initial.id,revision:1,value:edit}]),legacy);
const both=[changed.records.find(e=>e.id===initial.id),changed.research.events.find(e=>e.id===initial.id)];
for(const e of both){assert.equal(e.note,'');assert.equal(e.followup_on,null);assert.equal(e.review_status,'pending');assert.deepEqual(e.techs,[]);}
assert.equal(changed.sync.verified,126);assert.equal(changed.sync.pending,38);
assert.ok(exportCsv([initial]).includes('amount_kind'));
assert.ok(exportCsv([{...initial,amount_range_cny:{min:1,max:2}}]).includes('""min"":1'));
console.log('PASS: shared 167 rows, reviewed all 48 leads, 127 verified / 113 events; aliases, history, notes, classification, separate amounts and status changes.');
