import { z } from 'zod';

export const TECHS = {supernode:'超节点',liquid_cooling:'液冷',domestic_gpu:'国产 GPU',compute_field:'算力场',eda:'EDA',compute_rental:'算力租赁',token_factory:'Token 工厂',optical_switch:'光交换机',ai_storage:'AI 存储',aidc:'AIDC',modular_dc:'模块化数据中心',xpu:'xPU / 异构加速'};
export const STAGES = {intent:'意向 / 规划',tender:'正式采购',candidate:'中标候选',framework:'框架入围',award:'成交',contract:'合同披露',construction:'建设进展',acceptance:'工程验收',pilot:'试点',production:'生产上线',repeat:'扩容 / 复购',launch:'产品发布',policy:'政策',research:'技术 / 研究',cancel:'取消',failure:'失败'};
export const SOURCES = {buyer:'买方 / 采购',gov:'政府',vendor:'厂商',industry:'行业组织',media:'媒体',unknown:'待确认'};
export const REVIEWS = {accepted:'已核验',pending:'待核验',quarantine:'存在冲突'};
export const SCOPES = {hardware:'纯硬件',mixed:'整机 / 混合方案',software_service:'软件 / 研制服务',construction:'土建 / 基础设施',unknown:'软硬件未拆分'};
export const focusOnlyTags=tags=>Array.isArray(tags)&&tags.length>0&&tags.every(t=>['hyg_cpu','kunpeng','hygon_unspecified','hyg_or_kunpeng'].includes(t));
export const DEMAND = ['tender','candidate','award','contract','framework','production','repeat'];
export const projectKey=e=>e.project_id||e.id;
export const demandRecord=e=>!!e.customer&&['buyer','gov'].includes(e.source_type)&&DEMAND.includes(e.stage);
export const researchReview=e=>e.evidence_status==='conflict'?'quarantine':e.verified_fulltext===true&&!['reported','lead'].includes(e.evidence_status)?'accepted':'pending';
export const validDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
// Defaults preserve the original research snapshot; live views pass their collected window.
export const DEFAULT_WINDOW={start:'2026-01-01',end:'2026-09-20'};
export function dateWindow(value){
 const start=value?.start||value?.period_start||DEFAULT_WINDOW.start,end=value?.end||value?.period_end||DEFAULT_WINDOW.end;
 if(!validDate(start)||!validDate(end)||start>end)throw new RangeError('研究日期范围无效');
 return {start,end};
}
export function monthsInWindow(value){
 const {start,end}=dateWindow(value),months=[],cursor=new Date(start.slice(0,7)+'-01T00:00:00Z');
 while(cursor.toISOString().slice(0,7)<=end.slice(0,7)){months.push(cursor.toISOString().slice(0,7));cursor.setUTCMonth(cursor.getUTCMonth()+1);}
 return months;
}
export function partialMonth(month,value){
 const {start,end}=dateWindow(value),last=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).toISOString().slice(0,10);
 return start>month+'-01'||end<last;
}
export function monthLabel(month,value){const w=dateWindow(value);return (w.start.slice(0,4)===w.end.slice(0,4)?Number(month.slice(5))+'月':month)+(partialMonth(month,w)?'*':'');}
export function safeUrl(value) { try {const u=new URL(value); return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.hostname.includes('.')?u.href:null;}catch{return null;} }
export function inDateWindow(e,since=DEFAULT_WINDOW.start,until=DEFAULT_WINDOW.end) {const date=e.event_date||e.published_date;return validDate(e.published_date)&&validDate(date)&&e.published_date<=until&&date>=since&&date<=until;}
export function inWindow(e,since,until) {return e.review_status==='accepted'&&e.verified_fulltext===true&&inDateWindow(e,since,until);}
export function summary(records,since=DEFAULT_WINDOW.start,until=DEFAULT_WINDOW.end,includePending=false) {
 const rows=records.filter(e=>includePending?inDateWindow(e,since,until):inWindow(e,since,until));
 const count=(r,k)=>new Set(r.map(e=>k==='project_id'?projectKey(e):e[k]).filter(v=>v!=null&&v!=='')).size;
 const qualified=rows.filter(demandRecord);
 return {rows,docs:rows.length,events:count(rows,'event_key'),demand:count(qualified,'project_id'),buyers:count(qualified,'customer'),pending:(includePending?rows:records).filter(e=>e.review_status==='pending').length,quarantine:(includePending?rows:records).filter(e=>e.review_status==='quarantine').length,
  techs:Object.entries({...TECHS,focus:'常规芯片采购补充'}).map(([id,name])=>{const r=rows.filter(e=>id==='focus'?!e.techs.length:e.techs.includes(id));return{id,name,docs:r.length,events:count(r,'event_key'),demand:count(r.filter(demandRecord),'project_id'),pilot:count(r.filter(e=>e.source_type==='buyer'&&e.stage==='pilot'),'project_id'),production:count(r.filter(e=>e.source_type==='buyer'&&e.stage==='production'),'project_id')};})};
}
const nullableText=z.string().max(200).nullable().optional();
const recordSchema=z.object({
 id:z.string().min(1).max(120),title:z.string().trim().min(1,'请填写标题').max(300),url:z.string().max(2000).refine(v=>!!safeUrl(v),'请使用无登录信息的HTTPS原文链接'),
 techs:z.array(z.enum(Object.keys(TECHS))).max(Object.keys(TECHS).length),
 event_key:z.string().trim().min(1).max(200),project_id:z.string().trim().min(1).max(200),
 stage:z.enum(Object.keys(STAGES)),source_type:z.enum(Object.keys(SOURCES)),review_status:z.enum(Object.keys(REVIEWS)),
 publisher:z.string().max(300),customer:nullableText,customer_segment:z.string().max(60).optional(),
 published_date:z.string().max(10),event_date:z.string().max(10).nullable().optional(),
 geography:z.literal('中国大陆'),verified_fulltext:z.boolean(),value_cny:z.number().finite().nonnegative().max(1e14).nullable(),amount_scope:z.enum(Object.keys(SCOPES)),
 fact_summary:z.string().max(4000),implication:z.string().max(3000),limitations:z.string().max(3000),note:z.string().max(4000).optional(),
 revision:z.number().int().min(0),followup_on:z.string().max(10).nullable().optional(),
 source_excerpt:z.string().max(16000).optional(),source_id:z.string().max(100).nullable().optional(),
}).passthrough();
export function validateRecord(value) {
 const e=recordSchema.parse(value); e.url=safeUrl(e.url);e.techs=[...new Set(e.techs)];
 if(!e.techs.length&&!focusOnlyTags(e.tags))throw Error('400:常规芯片采购补充仅限海光 CPU、鲲鹏 CPU 或角色待核路线；其他记录请选择技术类别。');
 for(const k of ['published_date','event_date','followup_on'])if(e[k]&&!validDate(e[k]))throw Error('400:日期格式无效');
 if(e.review_status==='accepted') {
  if(!e.verified_fulltext||!validDate(e.published_date)||e.fact_summary.trim().length<8||e.source_type==='unknown')throw Error('400:核验通过需确认正文、发布日期、来源角色，并填写事实摘要');
  const today=new Date().toISOString().slice(0,10);
  if(e.published_date>today||(e.event_date&&e.event_date>today))throw Error('400:未来事件只能保留为待核线索');
  if((e.source_type==='buyer'||(e.source_type==='gov'&&DEMAND.includes(e.stage)))&&!e.customer?.trim())throw Error('400:采购及买方证据需填写买方名称');
 }
 if(e.review_status==='quarantine'&&!e.limitations.trim())throw Error('400:请说明隔离原因');
 return e;
}
export function exportCsv(records) {
 const keys=['id','title','url','published_date','event_date','techs','tags','source_type','stage','customer','project_id','event_key','lot','value_cny','amount_kind','amount_range_cny','amount_scope','amount_eligible','review_status','fact_summary','limitations','note','implication','followup_on','legacy_record_id'];
 const quote=x=>{let s=Array.isArray(x)?x.map(t=>TECHS[t]||t).join(' / '):x&&typeof x==='object'?JSON.stringify(x):String(x??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 return '\ufeff'+[keys,...records.map(e=>keys.map(k=>e[k]))].map(r=>r.map(quote).join(',')).join('\r\n');
}
