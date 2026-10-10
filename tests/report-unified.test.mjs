import assert from 'node:assert/strict';
import fs from 'node:fs';
import {visibleObservations,monitorCsv,axisPeriods} from '../lib/report-monitor.js';
const data=JSON.parse(fs.readFileSync('data/report-monitor.json','utf8'));
const source=fs.readFileSync('app/report-analysis.jsx','utf8');
assert.equal(data.series.length,78);
assert(!source.includes('report-business-tabs'));
assert(!source.includes('groupSeries'));
assert(!source.includes('axisPeriods(rows'));
assert(source.includes("useState('all')"));
assert(source.includes('type="search"'));
assert(source.includes('data.series.map(s=><tr'));
for(const s of data.series){assert.equal(visibleObservations(s,'all').length,s.observations.length);assert(axisPeriods([s],'all').length>0);}
assert.equal(monitorCsv(data.series).split('\r\n').length,1+data.series.reduce((n,s)=>n+s.observations.length,0));
console.log('PASS: all 78 report indicators available; unified filters, single-series axes and complete exports');
