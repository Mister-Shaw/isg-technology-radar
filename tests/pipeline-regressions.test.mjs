import assert from 'node:assert/strict';
import {amountRows,reportedAmountRows,monthlyDisclosureRows,combinedAmountRows} from '../lib/monthly.js';
import {analyze} from '../scripts/weekly-monitor.mjs';

const award={id:'award',project_id:'p',published_date:'2026-01-01',event_date:null,title:'液冷服务器采购',url:'https://example.org/award',stage:'award',amount_cny:10000000,amount_kind:'award',amount_currency:'CNY',verified_fulltext:true,evidence_status:'primary',amount_eligible:true,categories:['liquid_cooling'],tags:[]};
const cancel={...award,id:'cancel',published_date:'2026-02-01',stage:'cancel',amount_cny:null,amount_kind:'none',amount_eligible:false};
const ids=rows=>rows.map(e=>e.id).sort();
for(const invalid of [cancel,{...cancel,stage:'failure'},{...cancel,stage:'award',status_conflict:true},{...cancel,stage:'award',evidence_status:'conflict'}]){
 for(const rows of [[award,invalid],[invalid,award]]){
  assert.deepEqual(amountRows(rows),[],'Later invalidation removes the earlier verified amount regardless of input order');
  assert.deepEqual(combinedAmountRows(rows),[]);
 }
 assert.deepEqual(reportedAmountRows([{...award,verified_fulltext:false,evidence_status:'lead'},invalid]),[],'Pending amounts also respect invalidation');
}
assert.deepEqual(amountRows([award,{...cancel,published_date:award.published_date}]),[],'Same-day invalidation wins');
assert.deepEqual(amountRows([cancel,{...award,published_date:cancel.published_date}]),[],'Same-day ordering is deterministic');
assert.deepEqual(ids(amountRows([cancel,{...award,id:'new-award',published_date:'2026-03-01'}])),['new-award'],'A later award can re-establish an effective amount');
assert.deepEqual(ids(amountRows([award,{...award,id:'budget',amount_kind:'budget'},cancel])),[],'Cancellation invalidates all earlier amount kinds');
assert.deepEqual(ids(amountRows([award,{...award,id:'other-project',project_id:'q'},{...award,id:'other-lot',lot:'2'},cancel])),['other-lot','other-project'],'Different projects and lots remain independent');
assert.deepEqual(ids(amountRows([{...award,amount_group:'old-alias'},{...cancel,amount_group:'new-alias'}])),[],'Known project/lot identity survives amount-group aliases');
assert.deepEqual(ids(amountRows([{...award,project_id:null,amount_group:'group'},{...cancel,project_id:null,amount_group:'group'}])),[],'An explicit amount group links rows without a project ID');
assert.deepEqual(ids(amountRows([{...award,project_id:null},{...cancel,project_id:null}])),['award'],'Unknown project identities are not guessed');
const amended={...award,id:'amended',published_date:'2026-01-10',amount_cny:9000000};
assert.deepEqual(ids(amountRows([amended,award])),['amended'],'Latest amendment still replaces same-kind amount');
const history=[award,{...cancel,published_date:'2026-01-15'}],before=JSON.stringify(history);
assert.deepEqual(ids(monthlyDisclosureRows(history,{start:'2026-01-01',end:'2026-02-28'})),['award'],'Historical disclosure survives even a same-month cancellation');
assert.deepEqual(amountRows(history),[]);
assert.equal(JSON.stringify(history),before,'Aggregation never mutates source evidence');
for(const amount_currency of ['USD','EUR'])assert.deepEqual(reportedAmountRows([{...award,verified_fulltext:false,evidence_status:'lead',amount_currency}]),[],'Foreign currency is never summed as CNY');
for(const amount_currency of ['CNY',undefined])assert.deepEqual(ids(reportedAmountRows([{...award,verified_fulltext:false,evidence_status:'lead',amount_currency}])),['award']);
assert.deepEqual(reportedAmountRows([award,{...award,id:'pending',verified_fulltext:false,evidence_status:'lead'}]),[],'Verified money keeps precedence over the matching pending disclosure');

const rules={media_ids:[],attention_absolute_per_mille:5,attention_relative_change:.5,minimum_weekly_hits:5,minimum_weekly_news:200,minimum_confirming_sources:2,award_contract_cny:10000000,budget_cny:50000000,investment_cny:1000000000};
const panel={window:{start:'2026-01-01',end:'2026-10-11'},documents:[],sources:[]};
const old={...award,published_date:'2026-10-01',event_date:'2026-09-29'};
const research=events=>({period_start:'2026-01-01',events,leads:[]});
const run=(events,previous=null)=>analyze(panel,research(events),previous,{rules},'2026-10-11');
const events=result=>result.alerts.filter(a=>a.type==='event');
const previous={cutoff:'2026-10-04',records:{},notified_ids:[]};
const result=run([old],previous);
assert.equal(result.historical_backfill,1);
assert.equal(result.new_or_changed_records,1);
assert.equal(events(result).length,1);
assert(events(result)[0].historical_revision);
assert(events(result)[0].amount_verified);
assert.equal(events(run([old])).length,0,'Initial baseline does not alert on old imports');
assert.equal(events(run([old],{records:{},notified_ids:[]})).length,0,'A successful cutoff is required for old imports');
assert.equal(events(run([old],result.next_state)).length,0,'An unchanged historical record is not repeatedly alerted');
assert.equal(events(run([old],{...previous,notified_ids:[events(result)[0].id]})).length,0,'Previously sent alert IDs still suppress duplicate notifications');
assert.equal(events(run([{...old,amount_cny:1}],previous)).length,0,'Low-value historical records must still pass importance rules');
assert.equal(events(run([{...old,amount_cny:1,tags:['kunpeng']}],previous)).length,1,'Important historical routes are surfaced');
assert.equal(events(run([{...old,stage:'cancel',amount_cny:null}],previous)).length,1,'Historical negative evidence is surfaced');
assert.equal(events(run([{...old,event_date:'2025-12-31'}],previous)).length,0,'Outside-window evidence stays excluded');
assert.equal(events(run([{...old,published_date:'2026-10-12'}],previous)).length,0,'Future publication stays excluded');
assert.equal(events(run([{...old,published_date:'2026-10-08',event_date:null}])).length,1,'Initial current-week events retain normal behavior');
assert(events(run([{...old,amount_cny:11000000}],result.next_state))[0].historical_revision,'Changed historical evidence keeps its revision label');
console.log('PASS: current amount invalidation, historical disclosure preservation, pending CNY guard, and initialized historical-backfill alerts');

// Amendment notices remain evidence, without adding demand or repeated money.
const {STAGES,demandRecord,validateRecord}=await import('../lib/model.js');
const {validateResearchEdit}=await import('../lib/research-editing.js');
const {unifyRecords}=await import('../lib/unified-records.js');
const amendment={...award,id:'amendment',stage:'amendment',source_stage:'延期及招标文件更正',published_date:'2026-02-01',source_type:'gov',publisher:'测试采购机构',customer:'测试买方',fact_summary:'原公告采购预算保持不变，仅更正投标截止日期。'};
assert.equal(STAGES.amendment,'更正');
assert.equal(demandRecord(amendment),false,'Amendment alone is not a new procurement/demand project');
assert.equal(validateResearchEdit('events',amendment.id,amendment,amendment).source_stage,amendment.source_stage,'Shared edits preserve original source stage detail');
assert.equal(validateRecord(unifyRecords({events:[{...amendment,event_key:'amendment',geography:'中国大陆',amount_scope:'unknown',implication:'',limitations:''}],leads:[]},[]).records[0]).stage,'amendment','Unified record validation accepts the amendment stage');
for(const select of [amountRows,reportedAmountRows,combinedAmountRows]){
 assert.deepEqual(select([amendment]),[],'An amendment alone does not add procurement value');
 assert.deepEqual(ids(select([award,amendment])),select===reportedAmountRows?[]:['award'],'A repeated amendment amount cannot supersede the original procurement amount');
}
assert.deepEqual(reportedAmountRows([{...amendment,verified_fulltext:false,evidence_status:'lead'}]),[]);
assert.deepEqual(monthlyDisclosureRows([amendment],{start:'2026-01-01',end:'2026-02-28'}),[],'Historical amount series does not re-count amendment disclosures');
assert.equal(events(run([{...amendment,published_date:'2026-10-08'}])).length,0,'A repeated amendment amount is not a new large procurement alert');
assert.equal(events(run([{...amendment,published_date:'2026-10-08',status_conflict:true}])).length,1,'A conflict found in an amendment still alerts');
console.log('PASS: amendment label, preserved source stage, record validation, demand exclusion, money exclusion and alert semantics');
