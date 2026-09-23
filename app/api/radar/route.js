import {database,saveRecord,importRecords} from '@/lib/database';
import {validateRecord,safeUrl,TECHS} from '@/lib/model';
import {collectPage,allowedHosts,readBounded} from '@/lib/collect';
import {sourcePanel,sourceForUrl} from '@/data/sources';
import {pendingRecord,canonicalUrl} from '@/lib/imports';
import {readResearch,saveResearchEdit} from '@/lib/research-store';
import {readRadar,recordHistory,saveWorkspaceResearch,SHARED_WORKSPACE} from '@/lib/radar-store';
import {LEGACY_ALIASES} from '@/lib/unified-records';
import monitoring from '@/data/weekly-monitor.json';
export const dynamic='force-dynamic';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
// Reuse the existing site's data partition so its records, notes and history remain intact.
// This is a fixed storage key, not a visitor identity or authentication credential.
function failure(e){const message=e?.issues?'400:'+e.issues.map(i=>i.message).slice(0,3).join('；'):e.message||'';const known=message.match(/^(400|401|403|409|429|503):(.+)/);return known?json({error:known[2]},Number(known[1])):json({error:'操作暂未完成，请稍后重试。当前输入会保留。'},500);}
async function captureLog(owner,capture){const {pdf_base64,...stored}=capture;await database().prepare('INSERT INTO captures (owner,id,url,status,data,at) VALUES (?,?,?,?,?,?)').bind(owner,stored.id,stored.url,stored.status,JSON.stringify(stored),stored.captured_at).run();}
export async function GET(request){try{
 const owner=SHARED_WORKSPACE,db=database(),params=new URL(request.url).searchParams;
 if(params.has('research_history'))return json({history:await recordHistory(params.get('research_history'),params.get('section'))});
 const unified=await readRadar();
 const {results}=await db.prepare('SELECT data FROM captures WHERE owner=? ORDER BY at DESC LIMIT 15').bind(owner).all();
 const id=new URL(request.url).searchParams.get('history');
 if(id)return json({history:await recordHistory(id)});
 const checks=await db.prepare("SELECT data FROM captures WHERE owner=? AND json_extract(data,'$.kind')='discover' ORDER BY at DESC LIMIT 300").bind(owner).all();
 const sourceChecks={};for(const r of checks.results){const c=JSON.parse(r.data);if(c.source_id&&!sourceChecks[c.source_id])sourceChecks[c.source_id]=c;}
 return json({...unified,captures:results.map(r=>JSON.parse(r.data)),allowedHosts,sourceChecks,as_of:unified.research.period_end,scheduling:monitoring.enabled,monitoring});
}catch(e){return failure(e);}}
export async function POST(request){try{
 const owner=SHARED_WORKSPACE;
 let payload;try{payload=JSON.parse(await readBounded(request,850000));}catch{throw Error('400:内容格式无效或超过单批大小限制。');}
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)throw Error('403:请在本站操作。');
 if(!payload||typeof payload!=='object')throw Error('400:请求格式无效。');
 if(payload.op==='save_research'){
  if(['events','leads'].includes(payload.section)){
   const existing=(await readRadar()).records.find(e=>e.id===payload.key);
   if(LEGACY_ALIASES[payload.key]||existing&&(existing._ref.source!=='research'||existing._ref.section!==payload.section))throw Error('409:此记录已存在，请刷新后从原记录编辑。');
  }
  return json({record:await saveResearchEdit(payload)});
 }
 if(payload.op==='save_workspace_research')return json({record:await saveWorkspaceResearch(payload)});
 if(payload.op==='save'){
  const id=payload.record?.id,research=await readResearch();
  if(LEGACY_ALIASES[id]||[...research.events,...research.leads].some(e=>e.id===id))throw Error('409:此记录已归入月度研究，请刷新后编辑统一记录。');
  const record=validateRecord(payload.record);return json({record:await saveRecord(owner,record)});
 }
 if(payload.op==='import'){
  if(!Array.isArray(payload.rows)||!payload.rows.length||payload.rows.length>50||!Object.hasOwn(TECHS,payload.tech))throw Error('400:每批导入1–50条，并选择技术。');
  if(payload.source_id&&!sourcePanel.some(s=>s.id===payload.source_id))throw Error('400:来源无效。');
  let rows;try{rows=await Promise.all(payload.rows.map(r=>pendingRecord(r,payload.tech,payload.source_id,'import')));}catch(e){throw Error('400:'+e.message.replace(/^400:/,''));}
  const result=await importRecords(owner,rows,(await readRadar()).records);
  const capture={id:crypto.randomUUID(),kind:'import',status:'imported',url:rows[0].url,title:'资料导入',message:`新增 ${result.added} 条，重复或容量限制跳过 ${result.skipped} 条。新增记录待核验，已有记录保持不变。`,captured_at:new Date().toISOString(),source_id:payload.source_id||null};
  await captureLog(owner,capture);return json({...result,capture});
 }
 if(['collect','discover'].includes(payload.op)){
  const source=sourcePanel.find(s=>s.id===payload.source_id),listing=payload.op==='discover';
  if(listing&&(!source||source.mode!=='public'))throw Error('400:此来源请使用官方检索或导入入口。');
  const url=listing?source.url:safeUrl(payload.url);
  if(!url||!Object.hasOwn(TECHS,payload.tech))throw Error('400:请填写有效HTTPS链接并选择技术。');
  const keyword=String(payload.keyword||'').trim();if(listing&&(!keyword||keyword.length>200))throw Error('400:请输入1–200字的主题关键词。');
  const db=database(),at=new Date().toISOString();
  const recent=await db.prepare("SELECT count(*) AS n FROM captures WHERE owner=? AND at>? AND status!='imported'").bind(owner,new Date(Date.now()-60000).toISOString()).first();
  if(recent.n>=30)throw Error('429:本分钟已执行30次读取，请稍后再试。');
  const sameHost=await db.prepare("SELECT count(*) AS n FROM captures WHERE owner=? AND at>? AND url LIKE ? AND status!='imported'").bind(owner,new Date(Date.now()-60000).toISOString(),new URL(url).origin+'/%').first();
  if(sameHost.n>=6)throw Error('429:同一来源每分钟最多读取6次，请稍后继续。');
  const id=crypto.randomUUID(),initial={id,url,status:'reading',kind:payload.op,source_id:source?.id||sourceForUrl(url)?.id||null,captured_at:at,title:'正在读取'};
  await captureLog(owner,initial);
  let capture;try{capture={...initial,...await collectPage(url,{listing,keyword}),source_id:initial.source_id};}catch(e){capture={...initial,status:'failed',title:'读取未完成',message:e.name==='TimeoutError'?'来源响应超时，请稍后重试或导入。':e.message.replace(/^\d{3}:/,'')};}
  const {pdf_base64,...stored}=capture;
  await db.prepare('UPDATE captures SET status=?,data=? WHERE owner=? AND id=?').bind(capture.status,JSON.stringify(stored),owner,id).run();
  let record=null;
  if(capture.status==='fetched'){
   const records=(await readRadar()).records;record=records.find(e=>canonicalUrl(e.url)===canonicalUrl(capture.url));
   if(!record){const incoming=await pendingRecord({title:capture.title,url:capture.url,excerpt:capture.excerpt,published_date:capture.published_date||''},payload.tech,capture.source_id,'web');await importRecords(owner,[incoming],records);record=(await readRadar()).records.find(e=>e.id===incoming.id)||null;}
  }
  return json({capture,record});
 }
 throw Error('400:未知操作');
}catch(e){return failure(e);}}
