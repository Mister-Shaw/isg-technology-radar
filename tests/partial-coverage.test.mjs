import assert from 'node:assert/strict';
import {panelCell} from '../lib/panel.js';
import {analyze} from '../scripts/weekly-monitor.mjs';

const ids=['doit_all','c114_roll_all','zhiding_latest','cbinews_all_news'];
const coverage=()=>[{month:'2026-08',status:'complete',covered_through:'2026-08-31'},{month:'2026-09',status:'complete',covered_through:'2026-09-20'}];
const sources=ids.map(id=>({id,coverage:coverage()})),aggregate={id:'all',document_source_ids:ids,coverage:coverage()};
const documents=[];
for(let week=0;week<5;week++)for(const source_id of ids)for(let i=0;i<20;i++){
 const date=new Date(Date.parse('2026-09-20T00:00:00Z')-week*7*86400000).toISOString().slice(0,10);
 documents.push({id:`${week}-${source_id}-${i}`,source_id,date,month:date.slice(0,7),categories:i<(week===0?4:1)?['liquid_cooling']:[],tags:[],url:'https://example.org/news'});
}
const panel={window:{start:'2026-08-01',end:'2026-09-20'},sources:[aggregate,...sources],documents};
const september={id:'2026-09',months:['2026-09']},august={id:'2026-08',months:['2026-08']};
const complete=panelCell(panel,aggregate,'liquid_cooling','attention',september);
assert.equal(complete.N,240,'Fixed four-source denominator includes non-technology news');
sources[1].coverage[1]={month:'2026-09',status:'stale',covered_through:'2026-09-13'};
const partial=panelCell(panel,aggregate,'liquid_cooling','attention',september);
assert.equal(partial.N,complete.N,'A failed source is retained, not removed from the denominator');
assert.equal(partial.value,null,'Reject incomplete aggregate even when its summary mistakenly says complete');
assert.match(partial.status,/旧数据/);
assert.notEqual(panelCell(panel,aggregate,'liquid_cooling','attention',august).value,null,'Unaffected months remain comparable');
assert.notEqual(panelCell(panel,sources[0],'liquid_cooling','attention',september).value,null,'Successful individual sources remain visible');
sources[1].coverage[1].status='complete';
assert.equal(panelCell(panel,aggregate,'liquid_cooling','attention',september).value,null,'A successful but shorter cutoff cannot cover the requested period');

const rules={media_ids:ids,attention_absolute_per_mille:5,attention_relative_change:.5,minimum_weekly_hits:5,minimum_weekly_news:1,minimum_confirming_sources:2};
const research={period_start:panel.window.start,events:[],leads:[]};
const result=analyze(panel,research,{}, {rules},panel.window.end);
assert.equal(result.complete,false);assert(result.alerts.some(a=>a.type==='quality'));assert(!result.alerts.some(a=>a.type==='attention'));
for(const metric of result.metrics){assert.equal(metric.value,null);assert.equal(metric.baseline,null);assert.equal(metric.delta,null);assert.equal(metric.N,80);assert.equal(metric.baseline_N,320);}
sources[1].coverage[1].covered_through=panel.window.end;
const recovered=analyze(panel,research,{}, {rules},panel.window.end);
assert(recovered.complete);assert(recovered.alerts.some(a=>a.type==='attention'),'Complete coverage restores comparison and attention alerts');
console.log('PASS: partial source-month updates retain fixed denominators, suppress affected ratios and recover independently');
