import {TECHS,dateWindow,monthsInWindow,monthLabel,partialMonth} from './model.js';

import {childIds,matchesCategory,matchesChip,isKeywordCategory} from './hierarchy.js';
export const PANEL_METRICS={demand:'采购需求占比',application:'采购与部署报道占比',attention:'技术新闻占比'};
export const PANEL_DEFINITIONS={demand:'明确要求某技术的标包 ÷ 同一来源适用的全部采购标包；普通方案保留作分母。',application:'标题同时提及该技术和明确采购、试用、部署、上线或扩容的新闻 ÷ 固定来源同期全部去重新闻。',attention:'标题提及该技术的新闻 ÷ 固定来源同期全部去重新闻；未命中观察主题、非基础设施新闻也保留在分母。'};
export function coverageComplete(source,month,end){
 const c=source?.coverage?.find(c=>c.month===month);
 return c?.status==='complete'&&(c.covered_through===undefined||c.covered_through>=end);
}
export function periods(frequency='month',window){
 const w=dateWindow(window),months=monthsInWindow(w);
 if(frequency!=='quarter')return months.map(month=>({id:month,label:monthLabel(month,w),months:[month],partial:partialMonth(month,w)}));
 const groups=new Map();
 for(const month of months){const id=`${month.slice(0,4)}-Q${Math.ceil(Number(month.slice(5))/3)}`;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(month);}
 return [...groups].map(([id,part])=>{const partial=part.length<3||part.some(m=>partialMonth(m,w));return {id,label:(w.start.slice(0,4)===w.end.slice(0,4)?id.slice(5):id)+(partial?'*':''),months:part,partial};});
}
function periodDocuments(data,source,metric,period){
 const w=dateWindow(data.window),sourceIds=new Set(source.document_source_ids||[source.document_source_id||source.id]),months=new Set(period.months);
 return data.documents.filter(r=>r.date>=w.start&&r.date<=w.end&&sourceIds.has(r.source_id)&&months.has(r.month)&&!r.superseded&&(metric!=='demand'||r.eligible));
}
export function panelCell(data,source,category,metric,period,chip='all',prepared=null){
 const coverage=period.months.map(month=>source.coverage.find(c=>c.month===month));
 const established=metric!=='demand'||childIds(category).every(c=>Object.hasOwn(source.denominators||{},c));
 // Review is scoped to each contributing source, month and topic. An old
 // source-wide false flag cannot cancel an explicitly reviewed newer period.
 const contributorIds=source.document_source_ids?.length?source.document_source_ids:source.document_source_id?[source.document_source_id]:null;
 const contributors=contributorIds?contributorIds.map(id=>data.sources.find(s=>s.id===id)):[source];
 const behaviorReviewed=metric!=='application'||contributors.length>0&&contributors.every(member=>!!member&&period.months.every(month=>{
  const c=member.coverage.find(c=>c.month===month);
  if(isKeywordCategory(category))return c?.keyword_application_reviewed===true;
  const reviewed=c?.application_reviewed??member.application_reviewed??false;
  const topics=c?.application_reviewed_topics||member.application_reviewed_topics||Object.keys(TECHS).filter(id=>id!=='xpu');
  return reviewed===true&&childIds(category).every(id=>topics.includes(id));
 }));
 const w=dateWindow(data.window);
 const docs=prepared?.docs??periodDocuments(data,source,metric,period);
 const behaviorPending=metric==='application'&&docs.some(r=>r.application_reviewed===false);
 const covered=period.months.every(month=>{const end=[w.end,new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).toISOString().slice(0,10)].sort()[0];return coverageComplete(source,month,end)&&contributors.every(s=>coverageComplete(s,month,end));});
 const complete=established&&behaviorReviewed&&!behaviorPending&&covered;
 const denominator=metric==='demand'?docs.filter(r=>childIds(category).some(c=>r.eligible_categories.includes(c))):docs;
 const inScope=r=>matchesChip(r,chip)&&(!source.numerator_scope_filter||r.market_scope===source.numerator_scope_filter);
 const numerator=denominator.filter(r=>inScope(r)&&(metric==='demand'?childIds(category).some(c=>r.required_categories.includes(c)):matchesCategory(r,category,'news')&&(metric!=='application'||(isKeywordCategory(category)?r.keyword_context_class:r.context_class)==='application')));
 const unknown=metric==='demand'?denominator.filter(r=>inScope(r)&&childIds(category).some(c=>r.unknown_categories.includes(c))&&!numerator.includes(r)):[];
 const n=numerator.length,N=denominator.length,u=unknown.length,usable=complete&&N>0,sampleUsable=established&&behaviorReviewed&&!behaviorPending&&N>0;
 return {...period,category,n,N,u,complete,partial:period.partial??period.months.some(m=>partialMonth(m,w)),value:usable?1000*n/N:null,sample_value:sampleUsable?1000*n/N:null,sample_upper:sampleUsable?1000*(n+u)/N:null,sample_unknown:sampleUsable?1000*u/N:null,upper:usable?1000*(n+u)/N:null,unknown:usable?1000*u/N:null,other:usable?1000*(N-n-u)/N:null,status:!established?'适用分母未建立':!behaviorReviewed||behaviorPending?'行为复核未完成':!complete?(coverage.some(c=>c?.status==='stale')||contributors.some(s=>s?.coverage?.some(c=>period.months.includes(c.month)&&c.status==='stale'))?'含旧数据，暂不可比':'覆盖不完整'):!N?'无适用分母':u?'含未判定条款':'可计算',ids:numerator.map(r=>r.id),denominator_ids:metric!=='demand'&&prepared?prepared.denominatorIds:denominator.map(r=>r.id),unknown_ids:unknown.map(r=>r.id)};
}
export function panelMatrix(data,source,metric,frequency='month',chip='all',definitions=TECHS){
 const preparedPeriods=periods(frequency,data.window).map(period=>{const docs=periodDocuments(data,source,metric,period);return {period,docs,denominatorIds:docs.map(r=>r.id)};});
 return Object.entries(definitions).map(([id,name])=>({id,name,points:preparedPeriods.map(prepared=>panelCell(data,source,id,metric,prepared.period,chip,prepared))}));
}
export const perMille=value=>value==null?'—':`${value.toFixed(1)}‰`;
export function panelColors(matrix){
 const values=matrix.flatMap(r=>r.points.map(p=>p.value)).filter(Number.isFinite),min=values.length?Math.min(...values):null,max=values.length?Math.max(...values):null;
 return {min,max,background(value){if(value==null)return '#f1f3f6';const t=max>min?Math.max(0,Math.min(1,(value-min)/(max-min))):0;return `rgb(${[241,246,253].map((v,i)=>Math.round(v+([129,175,232][i]-v)*t)).join(',')})`;}};
}
export function panelCsv(matrix){
 const rows=[['技术','时期','明确命中','适用分母','未判定','明确比例下限（‰）','比例上限（‰）','已采样本比例（‰，覆盖不足时仅参考）','覆盖','未完时期'],...matrix.flatMap(c=>c.points.map(p=>[c.name,p.id,p.n,p.N,p.u,p.value??'',p.upper??'',p.sample_value??'',p.status,p.partial?'是':'否']))];
 return '\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
}
