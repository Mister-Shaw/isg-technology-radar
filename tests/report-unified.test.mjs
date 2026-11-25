import assert from 'node:assert/strict';
import fs from 'node:fs';
import {visibleObservations,monitorCsv,axisPeriods} from '../lib/report-monitor.js';
const data=JSON.parse(fs.readFileSync('data/report-monitor.json','utf8'));
const source=fs.readFileSync('app/report-analysis.jsx','utf8');
assert.equal(data.series.filter(s=>!s.collection_batch).length,78);
assert(data.series.length>78);
assert(!source.includes('report-business-tabs'));
assert(!source.includes('groupSeries'));
assert(!source.includes('axisPeriods(rows'));
assert(source.includes("useState('all')"));
assert(source.includes('type="search"'));
assert(source.includes('categorySeries.map(s=><tr'));
for(const s of data.series){assert.equal(visibleObservations(s,'all').length,s.observations.length);assert(axisPeriods([s],'all').length>0);}
assert.equal(monitorCsv(data.series).split('\r\n').length,1+data.series.reduce((n,s)=>n+s.observations.length,0));
console.log('PASS: historical and current report indicators, single-series axes and complete exports');

assert(source.includes("[mode,setMode]=useState('history')"));
assert(source.includes("label:'历史统计'"));
assert(source.includes("label:'预测'"));
let historyCount=0,forecastCount=0;
for(const s of data.series){
 const history=visibleObservations(s,'history'),forecast=visibleObservations(s,'forecast');
 assert.equal(history.length+forecast.length,s.observations.length);
 assert(history.every(o=>o.nature!=='forecast'&&o.base_nature!=='forecast'));
 assert(forecast.every(o=>o.nature==='forecast'||o.base_nature==='forecast'));
 if(s.family==='revision')assert.equal(history.length,0);
 historyCount+=history.length;forecastCount+=forecast.length;
}
const baselineCounters={history:0,forecast:0};
for(const s of data.series)for(const mode of ['history','forecast'])baselineCounters[mode]+=visibleObservations(s,mode).filter(o=>!o.collection_batch).length;
assert.deepEqual(baselineCounters,{history:169,forecast:44});
assert.equal(historyCount+forecastCount,data.series.reduce((n,s)=>n+s.observations.length,0));
const batches = [...data.refresh_history, data.latest_refresh];
const checkpoint = batches.findIndex(batch => batch.batch_id === 'source-audit-20261124');
assert(checkpoint >= 0, 'The November 24 audit must remain in the refresh history');
const laterBatches = batches.slice(checkpoint + 1);
const laterIds = new Set(laterBatches.map(batch => batch.batch_id));
const checkpointCounts = { history: 190, forecast: 51 };
for (const [mode, expected] of Object.entries(checkpointCounts)) {
  const records = data.series.flatMap(series => visibleObservations(series, mode));
  const prior = records.filter(record => !laterIds.has(record.collection_batch));
  assert.equal(prior.length, expected, `November 24 checkpoint lost ${mode} records`);
}
for (const batch of laterBatches) {
  for (const [series, expected] of [
    [data.series, batch.added_observations],
    [data.auxiliary, batch.added_auxiliary_observations ?? 0],
  ]) {
    const records = series.flatMap(item => item.observations)
      .filter(record => record.collection_batch === batch.batch_id);
    assert.equal(records.length, expected, `Incorrect observation count for ${batch.batch_id}`);
    assert.equal(new Set(records.map(record => record.id)).size, records.length);
  }
}
assert.equal(historyCount + forecastCount, 241 + laterBatches.reduce((n, b) => n + b.added_observations, 0));
console.log('PASS: historical and forecast observations partitioned without loss or overlap');

const overview=source.slice(source.indexOf('aria-label="研报指标总览"'),source.indexOf('{focus&&<>'));
assert(!overview.includes('<th>性质</th>'));
assert(!overview.includes('NATURES[latest.nature]'));
assert(source.includes('<th>数值</th><th>性质</th><th>发布日期 / 版本</th>'));
