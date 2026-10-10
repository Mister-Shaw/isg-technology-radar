import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BOARDS, KEYWORD_BOARD_ROWS, definitionsForRows, classifyBoards} from '../lib/keyword-boards.js';
import {panelMatrix, panelCell, periods} from '../lib/panel.js';
import {categoryMonthRows, amountRows, reportedAmountRows, combinedAmountRows, eventKey, monthOf, inObservationPeriod} from '../lib/monthly.js';
import {researchReview, dateWindow} from '../lib/model.js';
import {visibleObservations, axisPeriods} from '../lib/report-monitor.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const base=read('public/market-panel.json');
const assets=(base.expansion_assets||[]).map(path=>{
  assert.match(path,/^\/[\w.-]+\.json$/,'Expansion asset must be a local public JSON filename');
  return read('public'+path);
});
const panel={...base,documents:[...base.documents,...assets.flatMap(a=>a.documents||[])]};
const research=read('data/research-2026.json'), reports=read('data/report-monitor.json');
const originalIds=['doit_all','c114_roll_all','zhiding_latest','cbinews_all_news'];
const expandedIds=['eet_china','trendforce','zhidx','idcquan_expanded'];
const original=panel.sources.find(s=>s.id==='media_all');
assert.equal(original.name,'全部媒体来源');
assert(!panel.sources.some(s=>s.id==='media_expanded'),'Separate expansion aggregate is removed');
assert.deepEqual(original.document_source_ids,[...originalIds,...expandedIds]);
for(const id of expandedIds)assert(panel.sources.some(s=>s.id===id));
assert.equal(panel.media_summary.total_documents,24014);
assert.equal(original.coverage.at(-1).eligible,675);
const months=periods('month',panel.window).map(p=>p.id);
assert.deepEqual(months,Array.from({length:10},(_,i)=>`2026-${String(i+1).padStart(2,'0')}`));
assert.equal(BOARDS.length,3);assert.equal(KEYWORD_BOARD_ROWS.length,73);
const classifications=new WeakMap();
const classify=(r,mode)=>{let value=classifications.get(r);if(!value){value=classifyBoards(r,mode);classifications.set(r,value);}return value;};
const belongs=(r,row,mode)=>{const c=classify(r,mode);return row.level==='category'?c[row.board].includes(row.id):c.matches.some(m=>m.category===row.parentId&&m.keyword===row.keyword);};
// Fresh title/factual-field classification is an independent oracle for stored parent caches.
for(const [rows,mode] of [[panel.documents,'news'],[[...research.events,...research.leads],'research']])for(const r of rows){
 const fresh=classify(r,mode);
 if(r.board_matches)for(const board of BOARDS)assert.deepEqual(r.board_matches[board.id],fresh[board.id],`Stale ${mode} parent cache: ${r.id}/${board.id}`);
}
let newsCells=0;
for(const source of panel.sources.filter(s=>s.kind==='news'&&(s.document_source_ids||expandedIds.includes(s.id)))){
 const ids=new Set(source.document_source_ids||[source.document_source_id||source.id]);
 for(const board of BOARDS)for(const metric of ['attention','application']){
  const matrix=panelMatrix(panel,source,metric,'month','all',definitionsForRows(board.id));
  for(const row of matrix){
   const definition=KEYWORD_BOARD_ROWS.find(r=>r.id===row.id);
   assert.deepEqual(row.points.map(p=>p.id),months);
   for(const point of row.points){
    const denominator=panel.documents.filter(r=>ids.has(r.source_id)&&!r.superseded&&r.month===point.id&&r.date>=panel.window.start&&r.date<=panel.window.end);
    const numerator=denominator.filter(r=>belongs(r,definition,'news')&&(!source.numerator_scope_filter||r.market_scope===source.numerator_scope_filter)&&(metric!=='application'||r.keyword_context_class==='application'));
    assert.equal(point.N,denominator.length,`${source.id}/${row.id}/${point.id} denominator`);
    assert.deepEqual(point.denominator_ids,denominator.map(r=>r.id));
    assert.deepEqual(point.ids,numerator.map(r=>r.id));assert.equal(point.n,numerator.length);
    if(!point.complete||!point.N)assert.equal(point.value,null,'Unverified or empty coverage must not become zero/full-market rate');
    else assert.equal(point.value,1000*point.n/point.N);
    if(point.sample_value!==null)assert.equal(point.sample_value,1000*point.n/point.N);
    newsCells++;
   }
  }
 }
}
// Removing an asset must change the aggregate; individual original sources are unchanged.
for(const board of BOARDS)for(const metric of ['attention','application'])for(const id of originalIds){const source=panel.sources.find(s=>s.id===id);assert.deepEqual(panelMatrix(panel,source,metric,'month','all',definitionsForRows(board.id)),panelMatrix(base,source,metric,'month','all',definitionsForRows(board.id)));}
for(const c of original.coverage)assert.equal(c.eligible,panel.documents.filter(r=>original.document_source_ids.includes(r.source_id)&&!r.superseded&&r.month===c.month).length);
// Explicit incomplete-sample and missing-month guards, including a real zero-hit sample.
const sampled={id:'sampled',kind:'news',coverage:[{month:'2026-01',status:'incomplete',keyword_application_reviewed:true}]};
const sample={window:{start:'2026-01-01',end:'2026-02-28'},sources:[sampled],documents:[{id:'sample',source_id:'sampled',month:'2026-01',date:'2026-01-02',title:'ordinary business news'}]};
const january=panelCell(sample,sampled,KEYWORD_BOARD_ROWS[0].id,'attention',{id:'2026-01',months:['2026-01']});
assert.equal(january.value,null);assert.equal(january.sample_value,0);
const february=panelCell(sample,sampled,KEYWORD_BOARD_ROWS[0].id,'attention',{id:'2026-02',months:['2026-02']});
assert.equal(february.value,null);assert.equal(february.sample_value,null);
const window=dateWindow(research), records=[...research.events,...research.leads].filter(r=>inObservationPeriod(r,window));
const pending=records.filter(r=>researchReview(r)!=='accepted'), combined=combinedAmountRows(records);
let researchCells=0;
for(const board of BOARDS){
 const matrix=categoryMonthRows(records,pending,amountRows(records),reportedAmountRows(records),window,combined,definitionsForRows(board.id));
 assert.equal(matrix.length,Object.keys(definitionsForRows(board.id)).length*months.length);
 for(const point of matrix){
  const row=KEYWORD_BOARD_ROWS.find(r=>r.id===point.category), matching=records.filter(r=>monthOf(r)===point.month&&belongs(r,row,'research'));
  assert.equal(point.records,matching.length);assert.equal(point.events,new Set(matching.map(eventKey)).size);
  assert.equal(point.verified,matching.filter(r=>researchReview(r)==='accepted').length);
  assert.equal(point.leads,matching.filter(r=>researchReview(r)!=='accepted').length);
  const money=combined.filter(r=>monthOf(r)===point.month&&belongs(r,row,'research'));
  assert.deepEqual(point.amount_ids,money.map(r=>r.id));
  assert.equal(point.total_amount,money.length?money.reduce((n,r)=>n+Math.round(r._amount_min*100),0)/1e6:null);
  assert.equal(point.total_amount_upper,money.length?money.reduce((n,r)=>n+Math.round(r._amount_max*100),0)/1e6:null);
  researchCells++;
 }
}
// Reports keep observation periods and publication/vintage provenance; refresh months do not invent observations.
assert.equal(reports.series.length,78);
assert.deepEqual(read('public/report-monitor.json'),reports,'Published report data must match source data');
const patterns={annual:/^\d{4}$/,quarterly:/^\d{4}Q[1-4]$/,half_year:/^\d{4}H[12]$/,half_year_H1_only:/^\d{4}H1$/,forecast_vintage:/^\d{4}$/};
const catalog=new Map(reports.source_catalog.map(s=>[s.id,s]));
let observations=0,unknownPublicationDates=0;
for(const series of reports.series){
 assert(patterns[series.frequency],`Unexpected invented frequency for ${series.id}: ${series.frequency}`);
 assert.equal(visibleObservations(series,'all').length,series.observations.length);
 for(const o of series.observations){
  assert.match(o.period,patterns[series.frequency]);assert(o.source_url&&catalog.has(o.source_id),`Missing report source: ${series.id}/${o.id}`);
  assert(o.vintage,'Missing observation vintage');
  if(o.publication_date===null){assert.equal(o.publication_date_precision,'unknown');assert(o.publication_date_note);unknownPublicationDates++;}
  else if(o.publication_date_precision==='month')assert.match(o.publication_date,/^\d{4}-\d{2}$/);
  else assert.match(o.publication_date,/^\d{4}-\d{2}-\d{2}$/);
  observations++;
 }
 if(series.family!=='revision')for(const period of axisPeriods([series],'all'))assert.match(period,patterns[series.frequency]);
}
console.log(`PASS: ${newsCells} news cells and ${researchCells} research cells; all eight media combined, single-source records preserved; ${reports.series.length} report series/${observations} native-period observations.`);
