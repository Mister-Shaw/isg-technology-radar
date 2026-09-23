import assert from 'node:assert/strict';
import fs from 'node:fs';
import {panelCell,periods,panelMatrix,panelCsv,perMille,panelColors} from '../lib/panel.js';
const data=JSON.parse(fs.readFileSync(new URL('../public/market-panel.json',import.meta.url),'utf8'));
const baseline={...data,documents:data.documents.filter(r=>!(data.latest_refresh?.added_ids||[]).includes(r.id))};
assert.equal(data.documents.filter(r=>r.source_id==='doit_all'&&r.eligible&&!r.superseded&&r.tags.includes('kunpeng')).length,10);
assert.equal(data.documents.filter(r=>r.source_id==='doit_all'&&r.eligible&&!r.superseded&&r.tags.includes('hyg_dcu')).length,1);
assert.equal(new Set(data.documents.map(r=>r.id)).size,data.documents.length);
const news=data.sources.find(s=>s.id==='doit_all'),proc=data.sources.find(s=>s.kind==='procurement');
assert.deepEqual(periods().map(p=>panelCell(baseline,news,'liquid_cooling','attention',p).N),[184,111,344,307,226,365,409,365,330]);
for(const source of data.sources)for(const metric of source.kind==='news'?['attention','application']:['demand'])for(const frequency of ['month','quarter'])for(const row of panelMatrix(data,source,metric,frequency))for(const p of row.points){assert(p.n+p.u<=p.N);assert(p.ids.every(id=>p.denominator_ids.includes(id)));if(!p.complete||!p.N)assert.equal(p.value,null);if(source.kind==='procurement')assert.equal(p.value,null);}
const q=periods('quarter')[0],month=periods()[0],m=panelCell(data,news,'liquid_cooling','attention',month),qc=panelCell(data,news,'liquid_cooling','attention',q);
assert.equal(qc.N,639);assert.equal(qc.value,1000*qc.n/639);
assert.equal(panelCell(data,news,'liquid_cooling','attention',month,'hyg_cpu').N,m.N);

const allNews=data.documents.filter(r=>r.source_id==='doit_all'&&!r.superseded);
assert.equal(baseline.documents.filter(r=>r.source_id==='doit_all'&&!r.superseded).length,2641);
assert.equal(baseline.documents.filter(r=>r.source_id==='doit_all'&&!r.superseded&&r.categories.length).length,160);
for(const source of data.sources.filter(s=>s.kind==='news'&&(s.id==='doit_all'||s.document_source_id==='doit_all')))for(const metric of ['attention','application'])for(const chip of ['all','hyg_cpu','hyg_dcu','kunpeng'])for(const row of panelMatrix(data,source,metric,'month',chip))for(const p of row.points)assert.equal(p.N,allNews.filter(r=>r.month===p.id).length);
assert.equal(panelCell({...data,documents:data.documents.map(r=>({...r,eligible:false}))},news,'liquid_cooling','attention',month).N,m.N);
const nonTechnology=allNews.find(r=>r.month===month.id&&!r.categories.length&&!r.eligible);
assert(nonTechnology&&m.denominator_ids.includes(nonTechnology.id));
const domestic=data.sources.find(s=>s.id==='doit_china');
for(const p of panelMatrix(data,domestic,'attention').flatMap(r=>r.points))assert(p.ids.every(id=>data.documents.find(r=>r.id===id).market_scope==='china_explicit'));

const missing={...news,coverage:news.coverage.map((c,i)=>i===0?{...c,status:'incomplete'}:c)};assert.equal(panelCell(data,missing,'liquid_cooling','attention',q).value,null);
assert.equal(panelCell({...data,documents:[]},news,'liquid_cooling','attention',month).value,null);
assert.equal(panelCell({...data,documents:data.documents.map(r=>({...r,categories:[]}))},news,'liquid_cooling','attention',month).value,0);
const may=periods()[4],focusUnknown=panelCell(data,proc,'domestic_gpu','demand',may,'hyg_cpu');assert.equal(focusUnknown.N,2);assert.equal(focusUnknown.u,0);
const frozen=JSON.parse(fs.readFileSync(new URL('../../comparable-measures-2026-09-21/procurement-panel/monthly.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
for(const row of frozen.filter(r=>r.N!==null)){const p=panelCell(data,proc,row.category,'demand',periods().find(p=>p.id===row.month));assert.equal(p.n,row.n);assert.equal(p.N,row.N);assert.equal(p.u,row.unknown);}
const aggregate=data.sources.find(s=>s.id==='media_all');
assert(aggregate.document_source_ids.length>=4);
const sourceRows=data.sources.filter(s=>aggregate.document_source_ids.includes(s.id));
for(const p of periods()){
 const combined=panelCell(data,aggregate,'supernode','attention',p);
 const parts=sourceRows.map(s=>panelCell(data,s,'supernode','attention',p));
 assert.equal(combined.N,parts.reduce((n,x)=>n+x.N,0));
 assert.equal(combined.n,parts.reduce((n,x)=>n+x.n,0));
 for(const row of panelMatrix(data,aggregate,'attention','month','kunpeng'))assert.equal(row.points.find(x=>x.id===p.id).N,combined.N);
}
assert(data.documents.filter(r=>aggregate.document_source_ids.includes(r.source_id)&&!r.superseded).length>20000);
console.log('PASS: monthly denominators, weighted quarter, source and chip scope, missing versus zero, and procurement audit reconciliation.');

const rates=panelMatrix(data,aggregate,'attention');
const janLiquid=rates.find(r=>r.id==='liquid_cooling').points[0];
assert.equal(janLiquid.value,1000*4/1759);
assert.equal(perMille(janLiquid.value),'2.3‰');
assert.equal(perMille(null),'—');
assert(panelCsv(rates).includes('明确比例下限（‰）'));
const range=panelColors([{points:[{value:null},{value:2},{value:4},{value:6}]}]);
assert.deepEqual([range.min,range.max],[2,6]);
assert.equal(range.background(2),'rgb(241,246,253)');
assert.equal(range.background(6),'rgb(129,175,232)');
assert.notEqual(range.background(4),range.background(2));
assert.equal(range.background(null),'#f1f3f6');
assert.equal(panelColors([{points:[{value:0},{value:0}]}]).background(0),'rgb(241,246,253)');
assert.equal(panelColors([{points:[{value:null}]}]).min,null);
const sources=JSON.parse(fs.readFileSync(new URL('../public/sample-sources.json',import.meta.url),'utf8'));
assert.deepEqual(sources.sources,data.sources.filter(s=>['media','official'].includes(s.group)&&!s.document_source_id));
assert.deepEqual(sources.unavailable_sources,data.unavailable_sources);
console.log('PASS: per-mille calculations and exports, shared dynamic color bounds, zero/missing handling, and synchronized source metadata.');
