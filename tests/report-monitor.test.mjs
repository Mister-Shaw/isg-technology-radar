import fs from 'node:fs';import assert from 'node:assert/strict';
import {visibleObservations,numberText,changeText,periodCells,monitorCsv,numericAxis,formatAxisTick} from '../lib/report-monitor.js';
const d=JSON.parse(fs.readFileSync(new URL('../data/report-monitor.json',import.meta.url)));
assert.deepEqual(d.groups.map(g=>g.name),['万全异构智算方案','服务器','存储','数据网络']);
assert.equal(new Set(d.series.map(s=>s.id)).size,d.series.length);
for(const g of d.groups)assert(d.series.some(s=>s.group===g.id));
for(const s of d.series){assert(s.scope&&s.unit&&s.provider&&s.frequency);assert(!s.id.startsWith('GLOBAL_'));for(const o of s.observations){assert(Number.isFinite(o.value));assert(o.period&&o.vintage&&o.source_url.startsWith('http'));assert(['actual','estimate','forecast','derived'].includes(o.nature));}if(s.family==='revision'){assert.equal(new Set(s.observations.map(o=>o.period)).size,1);assert(visibleObservations(s,'history').every(o=>o.nature==='forecast'));}else assert(visibleObservations(s,'history').every(o=>o.nature!=='forecast'));}
const ai=d.series.find(s=>s.id==='CN_AI_IAAS_REVENUE_H');assert.deepEqual(ai.observations.map(o=>o.value),[60.67,78.68,89.33,124.08,198.7,288]);
assert(changeText(ai,'history',d.series).includes('132.1'));
const revenue=d.series.find(s=>s.id==='CN_EXT_STORAGE_REV_A');assert(changeText(revenue,'history',d.series).includes('7.4'));
const q=d.series.find(s=>s.id==='CN_SERVER_REVENUE_Q');assert.equal(periodCells(q,'history').size,2);
assert(numberText({value:100,qualifier:'>'}).startsWith('>'));assert(numberText({value:20,qualifier:'接近'}).startsWith('近'));
assert(monitorCsv([ai]).includes('预测版本'));assert(!JSON.stringify(d).includes('/workspace/'));assert(!JSON.stringify(d).includes('libfile_'));
console.log(`PASS: four-class monitor, ${d.series.length} metric series; actual/forecast separation, fixed-target revisions, provenance and official growth links`);

assert.deepEqual(numericAxis([13.8,30.7]),{domain:[0,40],ticks:[0,10,20,30,40]});
assert.equal(formatAxisTick(36.839999999999996),'36.84');
for(const values of [[0,0],[null,NaN],[-9.2,-.5],[-10.8,43.6],[.0138,.0307],[1900000,2000000]]){const a=numericAxis(values);assert(a.domain.every(Number.isFinite));assert(a.ticks.every(Number.isFinite));assert(a.domain[0]<=0&&a.domain[1]>=0);assert(a.ticks.every(v=>!formatAxisTick(v).includes('999999')));}
for(const series of d.series){const a=numericAxis(series.observations);assert(a.domain.every(Number.isFinite));assert(a.ticks.length<=8);for(const o of series.observations)assert(o.value>=a.domain[0]&&o.value<=a.domain[1]);}
console.log('PASS: LLM solution axis 0–40; clean ticks for all 76 series and negative/zero/fractional/missing cases');
