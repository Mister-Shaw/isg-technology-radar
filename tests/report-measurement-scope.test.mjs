import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p)),report=read('data/report-monitor.json'),before=read('tests/fixtures/report-measurement-v93-baseline.json');
assert.equal(before.baseline_site_commit,'af997aaac17f3d91a20d036ecca699cc991c5ada');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const hash=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
test('measurement clarification preserves all report observations and existing provenance',()=>{
 for(const [k,sha256] of Object.entries(before.preserved_fields))assert.equal(hash(report[k]),sha256,k);
 assert.deepEqual(report,read('public/report-monitor.json'));
 for(const [id,sha256] of Object.entries(before.preserved_conflicts)){const prior=report.source_conflicts.find(x=>x.id===id);assert(prior,id);assert.equal(hash(prior),sha256,id);}
});
test('vendor revenue and Value retain their original labels without a same-metric conflict claim',()=>{
 assert(!report.source_conflicts.some(x=>x.id==='CONFLICT_IDC_GLOBAL_SERVER_20261009'));
 const n=report.source_measurement_notes.find(x=>x.id==='MEASUREMENT_IDC_GLOBAL_SERVER_20261009');
 assert.equal(n.body_measurement,'vendor revenue');assert.equal(n.body_value,685.1);assert.equal(n.table_measurement,'Value (US$M)');assert.equal(n.table_value,701592);assert.equal(n.status,'distinct_source_fields');assert.equal(n.definition_source_page,2);assert(n.definition_limit);
 assert.equal(report.latest_refresh.source_checks.find(x=>x.source_id==='IDC_SERVER_INSIGHTS_20261009').status,'distinct_measurement_fields');
});
test('ESS chart Value and prose spending are recorded without asserting equivalent definitions',()=>{
 assert(!report.source_conflicts.some(x=>x.id==='CONFLICT_IDC_GLOBAL_ESS_2025_YOY_20261009'));
 const n=report.source_measurement_notes.find(x=>x.id==='MEASUREMENT_IDC_GLOBAL_ESS_2025_20261009');
 assert.equal(n.body_value,3.9);assert.equal(n.table_value,4.3);assert.equal(n.table_amount,35313);assert.equal(n.status,'comparison_basis_unverified');assert.match(n.table_measurement,/Value \(US\$M\)/);assert(n.chart_url&&n.definition_limit);
 assert.equal(report.latest_refresh.source_checks.find(x=>x.source_id==='IDC_ESS_INSIGHTS_20261009').status,'measurement_comparability_unverified');
});
