import {TECHS, STAGES, SOURCES, SCOPES, safeUrl, validDate} from './model.js';
import {AMOUNTS, CHIPS, MONTHS} from './monthly.js';

export const RESEARCH_SECTIONS = {events:'核验台账',leads:'待核线索',monthly_notes:'逐月判断',insights:'战略判断',category_notes:'分类判断'};
export const researchKey = (section, value, index) => section==='monthly_notes'?value.month:section==='category_notes'?value.category:section==='insights'?String(index):value.id;
export function researchWithEdits(snapshot, edits=[]) {
 const result={...snapshot};
 for(const section of Object.keys(RESEARCH_SECTIONS)) {
  const items=new Map((snapshot[section]||[]).map((value,index)=>[researchKey(section,value,index),{...value,_revision:0}]));
  for(const edit of edits.filter(e=>e.section===section))items.set(edit.key,{...edit.value,_revision:edit.revision});
  result[section]=[...items.values()];
 }
 return result;
}
const textFields=['title','url','publisher','customer','project_id','event_key','lot','published_date','event_date','stage_label','fact_summary','limitations','amount_text','source_read_result','note','implication','followup_on','text','fact','inference','action','strength','trend','findings','interpretation'];
const enums={stage:STAGES,source_type:SOURCES,amount_scope:SCOPES,amount_kind:AMOUNTS,evidence_status:{primary:'原文已核',reported:'报道待核',lead:'待核线索',conflict:'存在冲突',vendor:'厂商自报'}};
export function validateResearchEdit(section,key,value,base) {
 if(!Object.hasOwn(RESEARCH_SECTIONS,section)||typeof key!=='string'||!key||key.length>100||!value||typeof value!=='object'||Array.isArray(value))throw Error('400:研究条目格式无效。');
 const row=section==='events'||section==='leads';
 if(!base&&!row)throw Error('400:研究判断条目不存在，请刷新后重试。');
 const clean={...(base||{})};delete clean._revision;
 for(const field of textFields)if(Object.hasOwn(value,field)){
  if(value[field]!==null&&typeof value[field]!=='string')throw Error('400:文字字段格式无效。');
  if((value[field]||'').length>(['title','publisher','project_id','event_key'].includes(field)?300:16000))throw Error('400:文字过长，请缩短后保存。');
  clean[field]=value[field];
 }
 for(const [field,options] of Object.entries(enums))if(Object.hasOwn(value,field)){
  if(!Object.hasOwn(options,value[field])&&value[field]!==base?.[field])throw Error('400:请选择有效的分类或状态。');
  clean[field]=value[field];
 }
 for(const field of ['verified_fulltext','amount_eligible'])if(Object.hasOwn(value,field)){
  if(typeof value[field]!=='boolean')throw Error('400:核验与金额标记格式无效。');clean[field]=value[field];
 }
 if(row){
  clean.id=key;
  for(const [field,options] of [['categories',TECHS],['tags',CHIPS]]){
   const items=value[field]??base?.[field]??[];
   if(!Array.isArray(items)||items.length>30||items.some(x=>!Object.hasOwn(options,x)&&!(base?.[field]||[]).includes(x)))throw Error('400:请选择有效的技术分类或芯片路线。');
   clean[field]=[...new Set(items)];
  }
  if(Object.hasOwn(value,'amount_cny')){
   if(value.amount_cny!==null&&(typeof value.amount_cny!=='number'||!Number.isFinite(value.amount_cny)||value.amount_cny<0||value.amount_cny>1e14))throw Error('400:请填写有效金额。');clean.amount_cny=value.amount_cny;
  }
  if(Object.hasOwn(value,'amount_range_cny')){
   const range=value.amount_range_cny;
   if(range!==null&&(!range||typeof range!=='object'||Array.isArray(range)||!Number.isFinite(range.min)||!Number.isFinite(range.max)||range.min<0||range.max<range.min||range.max>1e14))throw Error('400:金额区间需填写有效的上下限。');
   clean.amount_range_cny=range===null?null:{min:range.min,max:range.max};
  }
  if(clean.amount_range_cny&&clean.amount_cny!=null)throw Error('400:请在确定金额和预计区间中选择一种；填写确定金额前请清空区间。');
  if(clean.amount_range_cny&&clean.amount_kind!=='contract_estimate')throw Error('400:预计金额区间请选择“合同预计区间”，不进入确定金额汇总。');
  if(!clean.title?.trim()||!safeUrl(clean.url))throw Error('400:请填写标题和HTTPS原文链接。');
  clean.url=safeUrl(clean.url);
  for(const field of ['published_date','event_date','followup_on'])if(clean[field]&&!validDate(clean[field]))throw Error('400:日期格式无效。');
  if(clean.verified_fulltext&&(!validDate(clean.published_date)||!clean.fact_summary||clean.fact_summary.trim().length<8||!clean.publisher?.trim()||clean.source_type==='unknown'))throw Error('400:核验记录需填写发布日期、发布主体、来源角色和事实摘要。');
  if(clean.verified_fulltext&&(clean.published_date>new Date().toISOString().slice(0,10)||(clean.event_date&&clean.event_date>new Date().toISOString().slice(0,10))))throw Error('400:未来事件不能标记为已核验。');
 }else if(section==='monthly_notes'&&!MONTHS.includes(key))throw Error('400:月份无效。');
 return clean;
}
