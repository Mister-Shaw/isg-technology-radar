import {TECHS,dateWindow,monthsInWindow,monthLabel,partialMonth} from './model.js';

import {childIds,matchesCategory,matchesChip} from './hierarchy.js';
export const PANEL_METRICS={demand:'采购需求占比',application:'采购与部署报道占比',attention:'技术新闻占比'};
export const PANEL_DEFINITIONS={demand:'明确要求某技术的标包 ÷ 同一来源适用的全部采购标包；普通方案保留作分母。',application:'标题同时提及该技术和明确采购、试用、部署、上线或扩容的新闻 ÷ 固定来源同期全部去重新闻。',attention:'标题提及该技术的新闻 ÷ 固定来源同期全部去重新闻；未命中观察主题、非基础设施新闻也保留在分母。'};
export function periods(frequency='month',window){
 const w=dateWindow(window),months=monthsInWindow(w);
 if(frequency!=='quarter')return months.map(month=>({id:month,label:monthLabel(month,w),months:[month],partial:partialMonth(month,w)}));
 const groups=new Map();
 for(const month of months){const id=`${month.slice(0,4)}-Q${Math.ceil(Number(month.slice(5))/3)}`;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(month);}
 return [...groups].map(([id,part])=>{const partial=part.length<3||part.some(m=>partialMonth(m,w));return {id,label:(w.start.slice(0,4)===w.end.slice(0,4)?id.slice(5):id)+(partial?'*':''),months:part,partial};});
}
export function panelCell(data,source,category,metric,period,chip='all'){
 const coverage=period.months.map(month=>source.coverage.find(c=>c.month===month));
 const established=metric!=='demand'||childIds(category).every(c=>Object.hasOwn(source.denominators||{},c));
 const behaviorReviewed=metric!=='application'||childIds(category).every(c=>(source.application_reviewed_topics||Object.keys(TECHS).filter(id=>id!=='xpu')).includes(c));
 const w=dateWindow(data.window);
 const docs=data.documents.filter(r=>r.date>=w.start&&r.date<=w.end&&(source.document_source_ids||[source.document_source_id||source.id]).includes(r.source_id)&&period.months.includes(r.month)&&!r.superseded&&(metric!=='demand'||r.eligible));
 const behaviorPending=metric==='application'&&docs.some(r=>r.application_reviewed===false);
 const complete=established&&behaviorReviewed&&!behaviorPending&&coverage.every(c=>c?.status==='complete')&&(metric!=='application'||source.application_reviewed!==false);
 const denominator=docs.filter(r=>metric!=='demand'||childIds(category).some(c=>r.eligible_categories.includes(c)));
 const inScope=r=>matchesChip(r,chip)&&(!source.numerator_scope_filter||r.market_scope===source.numerator_scope_filter);
 const numerator=denominator.filter(r=>inScope(r)&&(metric==='demand'?childIds(category).some(c=>r.required_categories.includes(c)):matchesCategory(r,category,'news')&&(metric!=='application'||r.context_class==='application')));
 const unknown=metric==='demand'?denominator.filter(r=>inScope(r)&&childIds(category).some(c=>r.unknown_categories.includes(c))&&!numerator.includes(r)):[];
 const n=numerator.length,N=denominator.length,u=unknown.length,usable=complete&&N>0;
 return {...period,category,n,N,u,complete,partial:period.partial??period.months.some(m=>partialMonth(m,w)),value:usable?1000*n/N:null,upper:usable?1000*(n+u)/N:null,unknown:usable?1000*u/N:null,other:usable?1000*(N-n-u)/N:null,status:!established?'适用分母未建立':!behaviorReviewed||behaviorPending?'行为复核未完成':!complete?'覆盖不完整':!N?'无适用分母':u?'含未判定条款':'可计算',ids:numerator.map(r=>r.id),denominator_ids:denominator.map(r=>r.id),unknown_ids:unknown.map(r=>r.id)};
}
export function panelMatrix(data,source,metric,frequency='month',chip='all',definitions=TECHS){
 return Object.entries(definitions).map(([id,name])=>({id,name,points:periods(frequency,data.window).map(p=>panelCell(data,source,id,metric,p,chip))}));
}
export const perMille=value=>value==null?'—':`${value.toFixed(1)}‰`;
export function panelColors(matrix){
 const values=matrix.flatMap(r=>r.points.map(p=>p.value)).filter(Number.isFinite),min=values.length?Math.min(...values):null,max=values.length?Math.max(...values):null;
 return {min,max,background(value){if(value==null)return '#f1f3f6';const t=max>min?Math.max(0,Math.min(1,(value-min)/(max-min))):0;return `rgb(${[241,246,253].map((v,i)=>Math.round(v+([129,175,232][i]-v)*t)).join(',')})`;}};
}
export function panelCsv(matrix){
 const rows=[['技术','时期','明确命中','适用分母','未判定','明确比例下限（‰）','比例上限（‰）','覆盖','未完时期'],...matrix.flatMap(c=>c.points.map(p=>[c.name,p.id,p.n,p.N,p.u,p.value??'',p.upper??'',p.status,p.partial?'是':'否']))];
 return '\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
}
