import assert from 'node:assert/strict';
import fs from 'node:fs';
import {combinedAmountRows,combinedAmountSummary,categoryMonthRows,categoryMonthlyCsv,inObservationPeriod,monthOf} from '../lib/monthly.js';
const e={id:'budget',project_id:'project',published_date:'2026-01-01',categories:['liquid_cooling'],tags:[],stage:'tender',amount_kind:'budget',amount_cny:100000,verified_fulltext:false,evidence_status:'lead',amount_eligible:false};
const rows=[e,{...e,id:'award',published_date:'2026-02-01',amount_group:'different-alias',amount_kind:'award',stage:'award',amount_cny:90000,verified_fulltext:true,evidence_status:'primary'},
 {...e,id:'lot1',project_id:'lots',lot:'1',amount_cny:10000}, {...e,id:'lot2',project_id:'lots',lot:'2',amount_cny:20000},
 {...e,id:'range',project_id:'range',amount_cny:null,amount_kind:'contract_estimate',amount_range_cny:{min:30000,max:50000}},
 {...e,id:'quote',project_id:'quote',amount_kind:'bid',amount_cny:40000},
 {...e,id:'bad-quote',project_id:'bad-quote',amount_kind:'candidate_offer'},
 {...e,id:'unit',project_id:'unit',amount_kind:'unit_price'}, {...e,id:'conflict',project_id:'conflict',evidence_status:'conflict'},
 {...e,id:'cancel',project_id:'project',published_date:'2026-03-01',stage:'cancel',amount_cny:null}];
const before=JSON.stringify(rows),combined=combinedAmountRows(rows);
assert.deepEqual(combined.map(e=>e.id).sort(),['lot1','lot2','quote','range']);
assert.equal(JSON.stringify(rows),before,'Evidence remains unchanged');
const matrix=categoryMonthRows(rows,[],[],[],undefined,combined),january=matrix.find(r=>r.category==='liquid_cooling'&&r.month==='2026-01');
assert.equal(january.total_amount,10);assert.equal(january.total_amount_upper,12);assert.equal(january.total_amount_count,4);
assert(!categoryMonthlyCsv(matrix).includes('已核'));assert(categoryMonthlyCsv(matrix).includes('合并披露金额下限万元'));
assert.equal(combinedAmountRows(rows.slice(0,2))[0].id,'award','Do not sum a budget and its award');
assert.deepEqual(combinedAmountSummary([]),{total_amount:null,total_amount_upper:null,total_amount_count:0});
assert.deepEqual(combinedAmountSummary(combinedAmountRows([{...e,amount_cny:0}])),{total_amount:0,total_amount_upper:0,total_amount_count:1});
assert.deepEqual(combinedAmountSummary(combined),{total_amount:10,total_amount_upper:12,total_amount_count:4});
const cents=combinedAmountRows(['a','b'].map(id=>({...e,id,project_id:id,amount_cny:0.105})));
assert.deepEqual(combinedAmountSummary(cents),{total_amount:0.000022,total_amount_upper:0.000022,total_amount_count:2},'Round each amount to cents before adding and converting to ten-thousand yuan');
const overlapRows=rows.map(r=>({...r,categories:['liquid_cooling','aidc','compute_field']})),overlapCombined=combinedAmountRows(overlapRows);
const overlapMatrix=categoryMonthRows(overlapRows,[],[],[],{start:'2026-01-01',end:'2026-03-31'},overlapCombined,
 {all:'全部',facilities:'设施',liquid_cooling:'液冷',aidc:'AIDC',platforms:'平台',compute_field:'算力场'});
for(const cell of overlapMatrix){
 const {total_amount,total_amount_upper,total_amount_count}=cell;
 assert.deepEqual({total_amount,total_amount_upper,total_amount_count},combinedAmountSummary(overlapCombined.filter(r=>monthOf(r)===cell.month)),`${cell.category} ${cell.month}: heatmap, bar and summary use the same monthly amount items`);
}
const overlapJanuary=Object.fromEntries(overlapMatrix.filter(r=>r.month==='2026-01').map(r=>[r.category,r.total_amount]));
assert.equal(overlapJanuary.facilities,overlapJanuary.liquid_cooling,'A parent is a union, not the sum of overlapping children');
assert.equal(overlapJanuary.all,overlapJanuary.facilities,'The total must not add overlapping parents');
assert.notEqual(overlapJanuary.facilities,overlapJanuary.liquid_cooling+overlapJanuary.aidc);
assert.notEqual(overlapJanuary.all,overlapJanuary.facilities+overlapJanuary.platforms);
const research=JSON.parse(fs.readFileSync(new URL('../data/research-2026.json',import.meta.url))),live=[...research.events,...research.leads].filter(inObservationPeriod),result=combinedAmountRows(live);
assert(result.some(e=>e.id==='recon-compute-008'),'Include single estimated total');
assert(!result.some(e=>e.amount_kind==='candidate_offer'||e.cross_period_exclusion||e.status_conflict));
assert.equal(result.filter(e=>e.amount_range_cny).reduce((n,e)=>n+e._amount_min,0),390e8);
assert.equal(result.filter(e=>e.amount_range_cny).reduce((n,e)=>n+e._amount_max,0),460e8);
const suzhou=result.filter(e=>e.project_id==='JSZC-320500-JZCG-G2026-0118');assert.equal(suzhou.length,1);assert.equal(suzhou[0].amount_cny,414300);
console.log(JSON.stringify({pass:true,merged_items:result.length,checks:['unverified and verified combined','all disclosed total types','known project/lot deduplication','range bounds','cancellation and conflicts','CSV','unchanged underlying evidence']}));
