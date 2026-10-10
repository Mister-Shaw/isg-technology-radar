import {readMarket} from './market-fixture.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sourcePanel} from '../data/sources.js';
import {sourceCheckTime,newerCapture,latestSourceAudit,sourceAuditLabel} from '../lib/source-status.js';
import {newestAudit,normalizeSourceAudit,currentSourceAudit,buildSiteInformation,isSourceAuditFilename} from '../lib/source-information.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));

// Real generated outputs: resolve the current receipt from its manifest URL,
// never assume the most recently imported historical filename is current.
const latest=read('data/latest-update.json'),panel=readMarket(),study=read('data/research-2026.json'),audit=read('public'+latest.audit_url),monitor=read('data/weekly-monitor.json');
assert.deepEqual(latest,read('public/latest-update.json'));
assert.equal(latest.media_added,panel.latest_refresh.added_rows+(panel.latest_refresh.expanded_added_rows||0));
const studyBatch=[study.latest_refresh,study.source_audit_backfill].find(row=>(row?.audit_id||row?.batch_id||row?.id)===latest.id);
assert(studyBatch);assert.equal(latest.research_added,studyBatch.added_records);
assert.equal(latest.research_total,study.events.length+study.leads.length);
const mediaIds=panel.sources.find(s=>s.id==='media_all').document_source_ids,active=panel.documents.filter(r=>mediaIds.includes(r.source_id)&&!r.superseded);
assert.equal(latest.media_total,active.length);assert.equal(latest.latest_month_total,active.filter(r=>r.month===latest.latest_month).length);
assert.equal(audit.source_checks.length,sourcePanel.length);assert(audit.source_checks.every(r=>r.name&&r.url&&sourceCheckTime(r)>0));
assert.equal(monitor.latest_requested_cutoff,(latest.requested_window||latest.window).end);assert.equal(monitor.last_attempt_at,latest.checked_at);assert.equal(monitor.enabled,false);assert.equal(monitor.paused_by_user,true);assert.equal(monitor.last_completed_cutoff,'2026-09-20');
if(latest.schema_version>=2){
 assert.equal(latest.id,newestAudit(fs.readdirSync(new URL('../data/',import.meta.url)).filter(isSourceAuditFilename).map(name=>read('data/'+name))).id);
 assert.equal(latest.audit_checked_on,audit.checked_on);assert.equal(latest.source_checks.length,sourcePanel.length);
 assert.deepEqual(latest.window,panel.window);assert.equal(latest.research_window.end,study.period_end);
}

// In-memory next-refresh fixtures exercise zero additions, stale manifests,
// date precedence, limited receipts, retained history and no scheduler changes.
const registry=[{id:'x',name:'Example',url:'https://example.com/'},{id:'y',name:'Other',url:'https://example.org/'}];
const old={schema_version:1,id:'source-audit-20261009',checked_on:'2026-10-09',full_coverage:true,requested_window:{start:'2026-01-01',end:'2026-10-09'},summary:{sources_checked:2},source_checks:[{source_id:'x',checked_at:'2026-10-09T01:00:00Z',history_complete:true,status:'historical_directory_pages_verified',detail:'Old full archive',verified_window:{start:'2026-01-01',end:'2026-10-08'}},{source_id:'y',checked_on:'2026-10-09',history_complete:false,status:'license_not_enabled',detail:'License unavailable'}]};
const fresh={schema_version:1,id:'source-audit-20261010',checked_on:'2026-10-10',checked_at:'2026-10-10T05:00:00Z',requested_window:{start:'2026-01-01',end:'2026-10-10'},full_coverage:false,coverage_statement:'Targeted checks only',summary:{sources_checked:1},source_checks:[{source_id:'x',checked_at:'2026-10-10T04:00:00Z',history_complete:false,status:'entry_blocked_search_pdf_partial',detail:'Entry blocked; one public PDF read',verified_window_limits:'One PDF only; no full archive',verified_window:{start:'2026-09-01',end:'2026-09-30'}}]};
const fixture={
 panel:{window:{start:'2026-01-01',end:'2026-10-09'},sources:[{id:'media_all',document_source_ids:['m']}],documents:[{source_id:'m',month:'2026-10'},{source_id:'m',month:'2026-10',superseded:true},{source_id:'m',month:'2026-09'},{source_id:'other',month:'2026-10'}],latest_refresh:{batch_id:fresh.id,checked_at:'2026-10-10T05:01:00Z',added_rows:0},source_audit:{id:old.id,excluded_nonarticle:[{was_active:true}],date_corrections:[{}],title_corrections:[{}]}},
 research:{period_start:'2026-01-01',period_end:'2026-10-08',events:[{}],leads:[{}],latest_refresh:{batch_id:fresh.id,checked_at:'2026-10-10T05:02:00Z',added_records:0},source_audit_backfill:{id:old.id,checked_on:old.checked_on,added_records:34,restored_milestones:8}},
 audits:[fresh,old],registry,monitor:{enabled:false,paused_by_user:true,last_completed_cutoff:'2026-09-20',latest_window:{end:'2026-10-07'},latest_alerts:[{id:'historical-alert'}],previous_alerts:[{id:'older-alert'}]},
};
const before=structuredClone(fixture),built=buildSiteInformation(fixture);
assert.deepEqual(fixture,before,'Construction must not mutate historical inputs');
assert.equal(built.latest.id,fresh.id);assert.equal(built.latest.checked_at,'2026-10-10T05:02:00Z');
assert.equal(built.latest.audit_checked_on,'2026-10-10');assert.equal(built.latest.window.end,'2026-10-09');assert.equal(built.latest.research_window.end,'2026-10-08');assert.equal(built.latest.requested_window.end,'2026-10-10');
for(const field of ['media_added','research_added','restored_milestones','nonarticle_exclusions','date_corrections','title_corrections'])assert.equal(built.latest[field],0,`${field} must not borrow prior-batch counts`);
assert.equal(built.latest.media_total,2);assert.equal(built.latest.latest_month_total,1);assert.equal(built.latest.research_total,2);
assert.equal(built.latest.sources_checked,1);assert.equal(built.latest.registered_sources,2);assert.equal(built.latest.full_coverage,false);
assert.equal(built.latest.source_checks[0].history_complete,false);assert.equal(built.latest.source_checks[0].verified_window_limits,fresh.source_checks[0].verified_window_limits);
assert.equal(built.latest.source_checks[1].checked_at,'2026-10-09','Unrechecked source keeps its actual prior timestamp');
assert.deepEqual(built.latest.audit_history,[{id:old.id,checked_on:old.checked_on,audit_url:'/source-audit-20261009.json'}]);
for(const key of ['enabled','paused_by_user','last_completed_cutoff','latest_window','latest_alerts','previous_alerts'])assert.deepEqual(built.monitor[key],fixture.monitor[key]);
assert.equal(built.monitor.latest_requested_cutoff,'2026-10-10');assert.equal(built.monitor.latest_update_status,'partial');assert.match(built.monitor.latest_status,/10月10日/);assert(!built.monitor.latest_status.includes('34条'));
assert.equal(currentSourceAudit(built.latest,normalizeSourceAudit(old,registry)).id,fresh.id);
assert.equal(currentSourceAudit({source_checks:[],id:'older',checked_at:'2026-10-08'},normalizeSourceAudit(old,registry)).id,old.id);
assert.equal(newestAudit([old,fresh]).id,fresh.id);assert.equal(newestAudit([fresh,old]).id,fresh.id);
assert.equal(newestAudit([{...old,checked_at:'2026-10-11T05:00:00Z'},fresh]).id,old.id,'Receipt time beats filename date');
const missingMedia=structuredClone(fixture);missingMedia.panel.latest_refresh.batch_id=old.id;assert.throws(()=>buildSiteInformation(missingMedia),/Missing media refresh manifest/);
const missingStudy=structuredClone(fixture);delete missingStudy.research.latest_refresh;assert.throws(()=>buildSiteInformation(missingStudy),/Missing research refresh manifest/);
const explicitZeros=structuredClone(fixture);explicitZeros.panel.source_audit.id=fresh.id;Object.assign(explicitZeros.panel.latest_refresh,{nonarticle_exclusions:0,date_corrections:0,title_corrections:0});assert.equal(buildSiteInformation(explicitZeros).latest.nonarticle_exclusions,0);
const absentFullCoverage=structuredClone(fixture);delete absentFullCoverage.audits[0].full_coverage;assert.equal(buildSiteInformation(absentFullCoverage).latest.full_coverage,false);

// A second manual run on the same calendar day is a distinct audit receipt.
for(const name of ['source-audit-20261010.json','source-audit-20261010-1600.json','source-audit-20261010-160012.json'])assert(isSourceAuditFilename(name));
for(const name of ['source-audit-20261010-.json','source-audit-20261010-afternoon.json','source-audit-20261010-1600.json.bak','../source-audit-20261010-1600.json'])assert(!isSourceAuditFilename(name));
const afternoon={...structuredClone(fresh),id:'source-audit-20261010-1600',checked_at:'2026-10-10T08:00:00Z'};
afternoon.source_checks[0].checked_at='2026-10-10T07:59:00Z';
const repeat=structuredClone(fixture);
repeat.audits=[old,afternoon,fresh];
Object.assign(repeat.panel.latest_refresh,{batch_id:afternoon.id,checked_at:afternoon.checked_at});
Object.assign(repeat.research.latest_refresh,{batch_id:afternoon.id,checked_at:afternoon.checked_at});
const repeatBefore=structuredClone(repeat),repeatBuilt=buildSiteInformation(repeat);
assert.deepEqual(repeat,repeatBefore,'Repeat construction preserves morning audit and all inputs');
assert.equal(repeatBuilt.latest.id,afternoon.id);assert.equal(repeatBuilt.latest.audit_url,'/source-audit-20261010-1600.json');
assert.equal(repeatBuilt.publicAudit.id,afternoon.id);
assert.equal(repeatBuilt.latest.audit_history[0].id,fresh.id);
assert.equal(repeatBuilt.latest.audit_history[0].checked_at,fresh.checked_at,'Same-day history retains its actual receipt time');
assert.equal(repeatBuilt.latest.audit_history[0].audit_url,'/source-audit-20261010.json');
assert.equal(repeatBuilt.latest.source_checks[0].checked_at,afternoon.source_checks[0].checked_at);
assert.equal(repeatBuilt.latest.source_checks[1].checked_at,'2026-10-09','Unrechecked source keeps older provenance');
for(const key of Object.keys(repeat.monitor))assert.deepEqual(repeatBuilt.monitor[key],repeat.monitor[key],'Original schedule/history field remains unchanged: '+key);
assert.equal(currentSourceAudit(repeatBuilt.latest,normalizeSourceAudit(fresh,registry)).id,afternoon.id);
assert.equal(newestAudit([afternoon,fresh]).id,afternoon.id);assert.equal(newestAudit([fresh,afternoon]).id,afternoon.id);
assert.equal(newestAudit([afternoon,{...fresh,checked_at:'2026-10-10T09:00:00Z'}]).id,fresh.id,'Actual receipt time beats suffix/order');
const wrongMorning=structuredClone(repeat);wrongMorning.panel.latest_refresh.batch_id=fresh.id;
assert.throws(()=>buildSiteInformation(wrongMorning),/Missing media refresh manifest/);
const untaggedMorning=structuredClone(repeat);delete untaggedMorning.panel.latest_refresh.batch_id;
assert.throws(()=>buildSiteInformation(untaggedMorning),/Missing media refresh manifest/);
const untaggedStudy=structuredClone(repeat);delete untaggedStudy.research.latest_refresh.batch_id;
assert.throws(()=>buildSiteInformation(untaggedStudy),/Missing research refresh manifest/);

assert(newerCapture({captured_at:'2026-10-10T01:00:00Z'},{checked_on:'2026-10-09'}));assert(!newerCapture({captured_at:'2026-10-09T01:00:00Z'},{checked_on:'2026-10-10'}));
assert(!newerCapture({captured_at:'2026-10-10T01:00:00Z'},{checked_on:'2026-10-10'}));
assert.equal(latestSourceAudit('x',old.source_checks,fresh.source_checks).checked_at,'2026-10-10T04:00:00Z');
for(const status of ['blocked_access','fetch_failed_502','directory_timeout','dynamic_empty'])assert.equal(sourceAuditLabel({status}),'读取受限');
assert.equal(sourceAuditLabel({status:'license_not_connected_marketing_readable'}),'授权未接通');
assert.equal(sourceAuditLabel({status:'manual_article_link_required'}),'需手动资料');
assert.equal(sourceAuditLabel({checked:false,status:'not_checked'}),'本次未核查');
assert.equal(sourceAuditLabel({status:'entry_blocked_search_pdf_partial'}),'部分资料可读');
assert.equal(sourceAuditLabel({status:'readable_entry',history_complete:false}),'公开资料已核查');
assert.equal(sourceAuditLabel({status:'historical_directory_pages_verified',history_complete:true}),'归档已复核');

const log=fs.readFileSync(new URL('../app/research-log.jsx',import.meta.url),'utf8'),sources=fs.readFileSync(new URL('../app/source-center.jsx',import.meta.url),'utf8');
assert(log.includes('关键词重扫归档 · 2026-10-08'));assert(!log.includes('三个关键词看板 · 最新重扫'));assert(log.includes('历史异动记录'));assert(!log.includes('<Link url={latestUpdate.audit_url}>'));
assert(sources.includes('newerCapture(logged,audit)'));assert(log.includes('手动栏目检查'));
for(const text of [log,sources]){assert(text.includes('historicalSourceAudit'));assert(text.includes('currentSourceAudit(latestUpdate,historicalSourceAudit)'));}
assert(log.includes('来源核查日期不改变原始资料的统计时期'));assert(!log.includes('十月 {latestUpdate.latest_month_total}'));
assert(!JSON.stringify(audit).includes('/workspace/'));assert(!JSON.stringify(audit).includes('execution approval'));
console.log('PASS: dynamic audit/manifest selection, zero additions, actual receipt limits, separate freshness/statistics, historical data and paused scheduler');
