import {TECHS,inDateWindow,researchReview,demandRecord,projectKey,dateWindow,monthsInWindow,monthLabel} from './model.js';
import {matchesCategory} from './hierarchy.js';
export const MONTHS=monthsInWindow();
export const inObservationPeriod=(e,window)=>{const w=dateWindow(window);return inDateWindow(e,w.start,w.end);};
export const inResearchPeriod=(e,window)=>researchReview(e)==='accepted'&&inObservationPeriod(e,window);
export const AMOUNTS={budget:'预算',award:'成交',contract:'合同全期',investment:'项目总投资',bid:'候选 / 投标报价',ceiling:'采购 / 框架上限',unit_price:'单价',estimate:'采购预估（不汇总）',contract_estimate:'合同预计区间（不汇总）',none:'未披露 / 不可汇总'};
export const CHIPS={hyg_cpu:'海光 CPU',hyg_dcu:'海光 DCU',hygon_unspecified:'海光（角色待核）',kunpeng:'鲲鹏 CPU',ascend:'昇腾 NPU',hyg_or_kunpeng:'海光或鲲鹏（未确定）'};
export const amountEligible=e=>e.verified_fulltext===true&&e.amount_eligible!==false&&!['reported','lead','conflict'].includes(e.evidence_status)&&['budget','award','contract','investment'].includes(e.amount_kind)&&typeof e.amount_cny==='number'&&Number.isFinite(e.amount_cny)&&e.amount_cny>=0;
export const eventKey=e=>e.event_key||`${e.project_id||e.id}|${e.stage}|${e.published_date}`;
export const monthOf=e=>(e.event_date||e.published_date||'').slice(0,7);
// One amount per project/lot/kind; latest amendment replaces the prior value before filtering.
const amountKey=e=>`${e.amount_group||`${e.project_id||e.id}|${e.lot||''}`}|${e.amount_kind}`;
export function amountRows(rows,qualifies=amountEligible){const map=new Map();for(const e of [...rows].sort((a,b)=>(a.published_date||'').localeCompare(b.published_date||''))){if(qualifies(e))map.set(amountKey(e),e);}return [...map.values()];}
// Reported amounts remain their original unverified rows, never promoted to verified money.
export function reportedAmountRows(rows){const verified=new Set(amountRows(rows).map(amountKey));return amountRows(rows,e=>researchReview(e)==='pending'&&!e.status_conflict&&!e.cross_period_exclusion&&!e.amount_range_cny&&!['candidate','cancel','failure'].includes(e.stage)&&['budget','award','contract','investment'].includes(e.amount_kind)&&Number.isFinite(e.amount_cny)&&e.amount_cny>=0&&!verified.has(amountKey(e)));}
// One current disclosure per known project/lot, across amount types and evidence states.
// ponytail: deduplication uses known IDs; ambiguous aliases need reviewed source mappings.
export function combinedAmountRows(rows){
 const kinds=['investment','estimate','ceiling','budget','bid','contract_estimate','award','contract'],map=new Map();
 const invalid=e=>!!e.status_conflict||e.evidence_status==='conflict'||['cancel','failure'].includes(e.stage);
 const bounds=e=>e.amount_range_cny?[e.amount_range_cny.min,e.amount_range_cny.max]:[e.amount_cny,e.amount_cny];
 const valid=e=>kinds.includes(e.amount_kind)&&bounds(e).every(n=>Number.isFinite(n)&&n>=0)&&bounds(e)[0]<=bounds(e)[1];
 for(const e of [...rows].sort((a,b)=>(a.published_date||'').localeCompare(b.published_date||'')||Number(invalid(a))-Number(invalid(b))||kinds.indexOf(a.amount_kind)-kinds.indexOf(b.amount_kind))){
  if(e.cross_period_exclusion||(!invalid(e)&&!valid(e)))continue;
  const key=e.project_id?`${e.project_id}|${e.lot||''}`:e.amount_group||e.id;map.set(key,e);
 }
 return [...map.values()].filter(e=>!invalid(e)&&valid(e)).map(e=>({...e,_amount_min:bounds(e)[0],_amount_max:bounds(e)[1]}));
}
export function monthlyDisclosureRows(rows,window){return monthsInWindow(window).flatMap(m=>amountRows(rows.filter(e=>monthOf(e)===m).map(e=>e.cross_period_exclusion?{...e,amount_eligible:true}:e)));}
export function monthlySeries(rows,kind='award',eligible=amountRows(rows),window){
 return monthsInWindow(window).map(month=>{const r=rows.filter(e=>monthOf(e)===month),m=eligible.filter(e=>monthOf(e)===month&&e.amount_kind===kind&&r.some(x=>x.id===e.id));return {month,label:monthLabel(month,window),events:new Set(r.map(eventKey)).size,projects:new Set(r.filter(demandRecord).map(projectKey)).size,amount:m.length?Math.round(m.reduce((s,e)=>s+Math.round(e.amount_cny*100),0))/1e6:null,amount_count:m.length};});
}
export function categoryMonthRows(rows,leads=[],eligible=amountRows(rows),reported=reportedAmountRows(rows),window,combined=combinedAmountRows(rows),definitions={...TECHS,focus:'常规芯片采购补充'}){
 return Object.entries(definitions).flatMap(([category,label])=>{
  const belongs=e=>matchesCategory(e,category),r=rows.filter(belongs),l=leads.filter(belongs);
  const amounts=Object.fromEntries(['budget','award','contract','investment'].flatMap(k=>[[k,monthlySeries(r,k,eligible,window)],[`reported_${k}`,monthlySeries(r,k,reported,window)]]));
  return monthlySeries(r,'award',eligible,window).map((s,i)=>{const merged=combined.filter(e=>belongs(e)&&monthOf(e)===s.month),sum=k=>merged.length?merged.reduce((n,e)=>n+Math.round(e[k]*100),0)/1e6:null;return {category,label,month:s.month,events:s.events,projects:s.projects,records:r.filter(e=>monthOf(e)===s.month).length,verified:r.filter(e=>monthOf(e)===s.month&&researchReview(e)==='accepted').length,leads:l.filter(e=>monthOf(e)===s.month).length,total_amount:sum('_amount_min'),total_amount_upper:sum('_amount_max'),total_amount_count:merged.length,amount_ids:merged.map(e=>e.id),...Object.fromEntries(Object.entries(amounts).flatMap(([k,v])=>[[k,v[i].amount],[`${k}_count`,v[i].amount_count]]))};});
 });
}
export function categoryMonthlyCsv(rows){
 const fields=['label','month','events','records','projects','total_amount','total_amount_upper','total_amount_count'];
 return '\ufeff'+[['分类','月份','收录独立事件','收录记录','当月买方采购/投产项目线索','合并披露金额下限万元','合并披露金额上限万元','合并金额项数'],...rows.map(r=>fields.map(k=>r[k]??''))].map(r=>r.join(',')).join('\r\n');
}
export function ledgerCsv(rows){const fields=['id','published_date','event_date','title','customer','project_id','lot','stage','categories','observation_categories','tags','amount_cny','amount_kind','amount_scope','amount_text','amount_eligible','verified_fulltext','url','fact_summary','limitations','publisher','source_type','evidence_status','source_read_result','wechat_account','corroborating_sources','lineage','amount_range_cny','previous_amount_cny','service_duration_months','payment_terms','supplier','note'];const q=v=>{let s=Array.isArray(v)&&v.every(x=>typeof x!=='object')?v.join(' / '):v&&typeof v==='object'?JSON.stringify(v):String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};return '\ufeff'+[fields,...rows.map(e=>fields.map(k=>e[k]))].map(r=>r.map(q).join(',')).join('\r\n');}
