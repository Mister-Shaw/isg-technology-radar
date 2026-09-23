import {safeUrl,validDate,TECHS,STAGES,SOURCES,SCOPES,validateRecord,focusOnlyTags} from './model.js';
import {normalizeChip} from './hierarchy.js';
import {AMOUNTS,CHIPS} from './monthly.js';
import {sourcePanel,sourceForUrl} from '../data/sources.js';
export function parseImport(text,name){
 if(text.length>800000)throw Error('文件最多 800 KB，请分批导入。');
 text=text.replace(/^\uFEFF/,'');let rows;
 if(name.toLowerCase().endsWith('.json')){const d=JSON.parse(text);rows=Array.isArray(d)?d:d.records;if(!Array.isArray(rows))throw Error('JSON 需要记录数组或含 records 数组。');}
 else{
  const table=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(quoted||cell==='')quoted=!quoted;else throw Error('CSV 引号格式无效，请使用模板。');}else if(!quoted&&(c===','||c==='\n'||c==='\r')){row.push(cell);cell='';if(c!==','){if(row.some(v=>v.trim()))table.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}}else cell+=c;}
  if(quoted)throw Error('CSV 引号未闭合。');row.push(cell);if(row.some(v=>v.trim()))table.push(row);
  const header=table.shift()?.map(s=>s.trim());if(!header?.length)throw Error('文件为空。');
  if(new Set(header).size!==header.length)throw Error('CSV 列名不能重复。');
  rows=table.map((cells,i)=>{if(cells.length!==header.length)throw Error(`第 ${i+2} 行列数与表头不一致。`);return Object.fromEntries(header.map((k,n)=>[k,cells[n]]));});
 }
 if(!rows.length||rows.length>50)throw Error('每批导入 1–50 条记录。');
 const aliases={标题:'title',项目名称:'title',链接:'url',原文链接:'url',发布日期:'published_date',事件日期:'event_date',发布主体:'publisher',正文:'excerpt',正文片段:'excerpt',摘要:'excerpt',项目编号:'project_id',标包:'lot',买方:'customer',阶段:'stage',来源角色:'source_type',技术分类:'categories',芯片路线:'tags',金额:'amount_cny',金额元:'amount_cny',金额单位:'amount_unit',金额类型:'amount_kind',金额范围:'amount_scope',事实摘要:'fact_summary'};
 return rows.map((r,i)=>{
  if(!r||typeof r!=='object'||Array.isArray(r))throw Error(`第 ${i+1} 条格式无效。`);
  const mapped=Object.fromEntries(Object.entries(r).map(([k,v])=>[aliases[k]||k,v]));
  const v={title:String(mapped.title||'').trim(),url:safeUrl(mapped.url),published_date:mapped.published_date||'',publisher:String(mapped.publisher||''),excerpt:String(mapped.excerpt||mapped.source_excerpt||mapped.fact_summary||'')};
  if(!v.title||v.title.length>300||!v.url||v.url.length>2000||v.publisher.length>300||v.excerpt.length>16000)throw Error(`第 ${i+1} 条需有效标题、HTTPS 原文链接，正文片段不超过 16,000 字。`);
  v.event_date=mapped.event_date||'';
  for(const k of ['published_date','event_date'])if(v[k]&&!validDate(v[k]))throw Error(`第 ${i+1} 条日期需 YYYY-MM-DD，未知请留空。`);
  for(const k of ['project_id','lot','customer','fact_summary']){v[k]=String(mapped[k]||'').trim();if(v[k].length>(k==='fact_summary'?4000:200))throw Error(`第 ${i+1} 条 ${k} 过长。`);}
  if(v.project_id===mapped.id||/^url-[a-f\d]{64}$/i.test(v.project_id))v.project_id='';
  for(const [k,options] of Object.entries({stage:STAGES,source_type:SOURCES,amount_scope:SCOPES,amount_kind:AMOUNTS})){
   const input=String(mapped[k]||'').trim(),alias={合同:'contract',总投资:'investment',采购:'tender'};
   v[k]=!input?'':Object.hasOwn(options,input)?input:Object.entries(options).find(([,label])=>label===input)?.[0]||(Object.hasOwn(options,alias[input])?alias[input]:'');
   if(input&&!v[k])throw Error(`第 ${i+1} 条 ${k} 无效，请使用模板中的分类名称。`);
  }
  for(const [k,options] of [['categories',TECHS],['tags',CHIPS]]){
   const input=mapped[k]??(k==='categories'?mapped.techs:[]);
   // Missing classification uses the selected topic; an explicit empty array preserves CPU-only focus records.
   if(k==='categories'&&(input==null||typeof input==='string'&&!input.trim()))continue;
   const items=Array.isArray(input)?input:String(input).split(/[;；|,，、]/).map(s=>s.trim()).filter(Boolean);
   if(k==='categories'&&items.length===1&&['focus','常规芯片采购补充'].includes(items[0])){v[k]=[];continue;}
   v[k]=[...new Set(items.map(raw=>{const s=k==='tags'?normalizeChip(raw):raw;return Object.hasOwn(options,s)?s:Object.entries(options).find(([,label])=>label===s)?.[0]}))];
   if(v[k].some(s=>!s)||v[k].length>Object.keys(options).length)throw Error(`第 ${i+1} 条 ${k} 无效。多项用分号分隔。`);
  }
  if(v.categories?.length===0&&!focusOnlyTags(v.tags))throw Error(`第 ${i+1} 条空技术分类仅限海光 CPU、鲲鹏 CPU 或角色待核路线。`);
  const input=mapped.amount_cny??mapped.value_cny,unit=mapped.amount_unit||'元',factor={'元':1,'万元':1e4,'亿元':1e8}[unit];
  if(!factor)throw Error(`第 ${i+1} 条金额单位仅支持人民币元、万元、亿元。`);
  if(input!=null&&!['number','string'].includes(typeof input))throw Error(`第 ${i+1} 条金额格式无效。`);
  v.amount_cny=input==null||String(input).trim()===''?null:Number(typeof input==='string'?input.replaceAll(',','').trim():input)*factor;
  if(v.amount_cny!==null&&(!Number.isFinite(v.amount_cny)||v.amount_cny<0||v.amount_cny>1e14||!v.amount_kind||v.amount_kind==='none'))throw Error(`第 ${i+1} 条需有效非负金额及金额类型，未知请留空。`);
  v.amount_range_cny=null;
  if(mapped.amount_range_cny){const r=typeof mapped.amount_range_cny==='string'?JSON.parse(mapped.amount_range_cny):mapped.amount_range_cny;if(!Number.isFinite(r.min)||!Number.isFinite(r.max)||r.min<0||r.max<r.min||r.max>1e14||v.amount_cny!==null||v.amount_kind!=='contract_estimate')throw Error(`第 ${i+1} 条区间须为人民币元、上下限有效且类型为 contract_estimate。`);v.amount_range_cny={min:r.min,max:r.max};}
  return v;
 });
}
export function canonicalUrl(input){const u=new URL(safeUrl(input));u.hash='';for(const k of [...u.searchParams.keys()])if(/^utm_/i.test(k))u.searchParams.delete(k);return u.href;}
export function importProject(e){const project=String(e.project_id||'').trim();return project===e.id||/^url-[a-f\d]{64}$/i.test(project)?'':project;}
export const importKey=e=>canonicalUrl(e.url)+(importProject(e)?'|project:'+encodeURIComponent(importProject(e)):'')+(e.lot?.trim()?'|lot:'+encodeURIComponent(e.lot.trim()):'');
export const ambiguousImport=(a,b)=>canonicalUrl(a.url)===canonicalUrl(b.url)&&(a.lot?.trim()||'')===(b.lot?.trim()||'')&&!!importProject(a)!==!!importProject(b);
export async function pendingRecord(item,tech,sourceId,method='import'){
 if(!Object.hasOwn(TECHS,tech))throw Error('400:请选择技术类别。');
 const row=parseImport(JSON.stringify([item]),'records.json')[0],url=canonicalUrl(row.url);
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(importKey(row)));
 const id='url-'+[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
 const source=sourceForUrl(url);
 return validateRecord({id,revision:0,title:row.title,url,techs:row.categories??[tech],tags:row.tags,event_key:id,project_id:row.project_id||id,lot:row.lot,stage:row.stage||'research',source_type:row.source_type||'unknown',publisher:row.publisher||source?.name||new URL(url).hostname,customer:row.customer||null,published_date:row.published_date,event_date:row.event_date||null,geography:'中国大陆',verified_fulltext:false,value_cny:row.amount_cny,amount_range_cny:row.amount_range_cny,amount_kind:row.amount_kind||'none',amount_scope:row.amount_scope||'unknown',amount_eligible:false,review_status:'pending',fact_summary:row.fact_summary,implication:'',limitations:'新采集线索；结构化字段尚待核对，不自动升级为已核。',note:'',followup_on:null,source_id:source?.id||null,discovery_source_id:sourcePanel.some(s=>s.id===sourceId)?sourceId:null,source_excerpt:row.excerpt,ingest_method:method,ingested_at:new Date().toISOString()});
}
