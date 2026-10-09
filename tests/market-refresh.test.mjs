import assert from 'node:assert/strict';
import fs from 'node:fs';
import {panelMatrix} from '../lib/panel.js';
import {CHILDREN} from '../lib/hierarchy.js';
import {validDate} from '../lib/model.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const p=read('public/market-panel.json'),s=read('public/sample-sources.json');
assert.equal(new Set(p.documents.map(r=>r.id)).size,p.documents.length);
assert(p.documents.every(r=>validDate(r.date)&&r.month===r.date.slice(0,7)&&r.date<=p.window.end));
assert.deepEqual(s.sources,p.sources.filter(s=>['media','official'].includes(s.group)&&!s.document_source_id));
assert.deepEqual(s.window,p.window);assert.equal(s.collected_at,p.collected_at);
const aggregate=p.sources.find(s=>s.id==='media_all'),ids=aggregate.document_source_ids;
for(const source of p.sources.filter(s=>s.kind==='news')){
 for(const c of source.coverage){
  if(!c.month.startsWith('2026-10'))continue;
  const docs=p.documents.filter(r=>(source.document_source_ids||[source.document_source_id||source.id]).includes(r.source_id)&&!r.superseded&&r.month===c.month);
  if(c.eligible!==null)assert.equal(c.eligible,docs.length,source.id+' denominator');
 }
 for(const metric of ['attention','application'])for(const frequency of ['month','quarter'])for(const row of panelMatrix(p,source,metric,frequency,'all',CHILDREN))for(const point of row.points){
  assert(point.n<=point.N);assert(point.ids.every(id=>point.denominator_ids.includes(id)));
  if(!point.complete||!point.N)assert.equal(point.value,null);
  if(point.sample_value!==null)assert.equal(point.sample_value,1000*point.n/point.N);
 }
}
for(const row of panelMatrix(p,aggregate,'attention','month','all',CHILDREN)){
 const last=row.points.at(-1);
 assert.equal(last.N,p.documents.filter(r=>ids.includes(r.source_id)&&!r.superseded&&r.month===last.id).length);
 assert(last.partial,'October remains partial calendar month');
}
assert.equal(read('data/weekly-monitor.json').enabled,false,'Scheduled updater remains paused');
assert.equal(read('data/weekly-monitor.json').paused_by_user,true);
console.log('PASS: source denominators, date bounds, metadata sync, all-news scope, missing/sample ratios, monthly/quarterly matrices and paused schedule');
