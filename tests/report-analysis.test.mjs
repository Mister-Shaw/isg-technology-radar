import assert from 'node:assert/strict';import fs from 'node:fs';
import {reportInsightRows,reportAnalysisSnapshot} from '../lib/report-analysis.js';
import {researchWithEdits,validateResearchEdit} from '../lib/research-editing.js';
import {combinedAmountRows} from '../lib/monthly.js';
import {panelCell} from '../lib/panel.js';
const read=f=>JSON.parse(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'));
const report=read('data/report-analysis.json'),study=read('data/research-2026.json'),panel=read('public/market-panel.json'),monitor=read('data/weekly-monitor.json'),run=read('public/manual-refresh-20261007.json');
assert.equal(report.title,'研报分析');assert.equal(report.default_view,'charts');
for(const g of report.metric_groups){assert(g.rows.length>0);assert.equal(new Set(g.rows.map(r=>r.unit)).size,1);for(const r of g.rows){assert(Number.isFinite(r.value));assert(r.period&&r.value_type&&r.source_refs.length);}}
assert.equal(report.insights.length,8);assert.equal(report.as_of,'2026-10-07');
const sourceIds=new Set(report.sources.map(s=>s.id));for(const i of report.insights){assert(i.inference&&i.business_implication&&i.facts.length);for(const f of i.facts)for(const s of f.source_refs){assert(sourceIds.has(s.source_id));assert(s.url.startsWith('https://'));}}
assert(!JSON.stringify(report).includes('/workspace/'));assert(!JSON.stringify(report).includes('libfile_'));
const rows=reportInsightRows(report),snapshot=reportAnalysisSnapshot(study,report),base=rows[0];
const changed=validateResearchEdit('report_insights',base.id,{...base,note:'保留人工笔记',inference:'新的共享判断',followup_on:'2026-10-14'},base);
const merged=researchWithEdits(snapshot,[{section:'report_insights',key:base.id,revision:1,value:changed}]);assert.equal(merged.report_insights[0].note,'保留人工笔记');assert.equal(merged.report_insights[0].inference,'新的共享判断');assert.equal(merged.events.length,study.events.length);assert.deepEqual(merged.report_insights[0].source_ids,base.source_ids);
assert.throws(()=>validateResearchEdit('report_insights',base.id,{...base,followup_on:'not-date'},base));
assert.equal(monitor.enabled,false);assert.equal(monitor.last_completed_cutoff,'2026-09-20');assert.equal(monitor.latest_update_status,'partial');assert.equal(panel.window.end,monitor.latest_requested_cutoff);assert.equal(study.period_end,monitor.latest_requested_cutoff);
assert.equal(run.media.rows_added,1406);assert.equal(run.added_records,17);assert.equal(run.promoted_ids.length,1);
assert.equal(new Set(panel.documents.map(d=>d.id)).size,panel.documents.length);assert(!panel.documents.some(d=>d.date==='2026-10-00'));
const z=panel.sources.find(s=>s.id==='zhiding_latest');assert.equal(z.coverage.find(c=>c.month==='2026-10').status,'incomplete');
assert.equal(panelCell(panel,z,'aidc','attention',{id:'2026-10',months:['2026-10']}).value,null);
for(const sid of monitor.rules.media_ids)for(const cv of panel.sources.find(s=>s.id===sid).coverage.filter(c=>['2026-09','2026-10'].includes(c.month))){const all=panel.documents.filter(r=>r.source_id===sid&&r.month===cv.month&&!r.superseded);assert.equal(cv.eligible,all.length);}
const amounts=combinedAmountRows([...study.events,...study.leads]);assert(!amounts.some(r=>r.id.includes('xingyun-ve-contract')||r.id.includes('xingyun-sa-43-contract')));assert(amounts.some(r=>r.id==='roll-chip-szse-general-award-1-20260924'));assert(!amounts.some(r=>r.id==='roll-chip-szse-general-candidate-1-20260921'));
console.log('PASS: report analysis citations, editable judgments/history overlay, dates, paused schedule, partial coverage, all-news denominators and project exclusions');
