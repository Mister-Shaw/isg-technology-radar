import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validDate,monthsInWindow,TECHS} from '../lib/model.js';
import {observationCategories} from '../lib/hierarchy.js';
import {refreshTaxonomy} from './refresh-taxonomy.mjs';
import {analyze} from './weekly-monitor.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const MEDIA=['doit_all','c114_roll_all','zhiding_latest','cbinews_all_news'];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const day=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export function lastSunday(now=new Date()){
 const today=new Date(now.getTime()+8*3600000).toISOString().slice(0,10);
 return day(today,-(new Date(today+'T00:00:00Z').getUTCDay()||7));
}
export function mergeMedia(original,fresh){
 const panel=structuredClone(original),oldEnd=panel.window.end,end=fresh.cutoff,start=fresh.reread_start;
 assert(validDate(start)&&validDate(end)&&validDate(fresh.scanned_through),'Invalid collector dates');
 assert(start===panel.window.start,'Every update must scan the full research window from its original start');
 assert(start<=end&&end<=fresh.scanned_through&&end>=oldEnd,'Collection must cover the full window without moving backwards');
 assert(typeof fresh.checked_at==='string'&&Number.isFinite(Date.parse(fresh.checked_at)),'Missing collection timestamp');
 assert(Array.isArray(fresh.sources)&&Array.isArray(fresh.documents),'Missing collection results');
 assert.deepEqual(fresh.sources.map(s=>s.source_id).sort(),[...MEDIA].sort(),'The same four media sources are required');
 const monthChecks=[];
 for(const id of MEDIA){
  const source=fresh.sources.find(s=>s.source_id===id);
  assert(source.complete===true,`${id}: incomplete collection; existing data was retained`);
  assert(source.rows===fresh.documents.filter(d=>d.source_id===id).length,`${id}: row count mismatch`);
  for(const month of monthsInWindow({start,end})){
   const prior=original.documents.filter(d=>d.source_id===id&&d.month===month&&d.date>=start&&d.date<=oldEnd);
   const reread=new Set(fresh.documents.filter(d=>d.source_id===id&&d.month===month&&d.date>=start&&d.date<=oldEnd).map(d=>d.id));
   const fetched=new Set(fresh.documents.filter(d=>d.source_id===id&&d.month===month&&d.date>=start&&d.date<=end).map(d=>d.id));
   const monthEnd=day(day(month+'-28',4).slice(0,7)+'-01',-1),fullMonth=month+'-01'>=start&&monthEnd<=end;
   const retained=prior.filter(d=>!reread.has(d.id)).map(d=>d.id);
   monthChecks.push({source_id:id,month,previous_rows:prior.length,fetched_rows:fetched.size,comparable_reread_rows:reread.size,retained_not_seen_ids:retained});
   assert(!prior.length||reread.size>=prior.length*.5,`${id} ${month}: reread returned less than half the existing same-month archive; check missing pages before applying`);
   assert(!fullMonth||fetched.size>0,`${id} ${month}: no records for a complete calendar month; verify coverage before applying`);
  }
 }
 const byId=new Map(panel.documents.map(d=>[d.id,d]));
 assert.equal(byId.size,panel.documents.length,'Existing duplicate document IDs');
 const incoming=new Map(),added=[],changed=[],preview=[];
 for(const r of fresh.documents){
  assert(MEDIA.includes(r.source_id)&&typeof r.id==='string'&&r.id&&typeof r.title==='string'&&r.title.trim(),'Invalid news identity');
  if(incoming.has(r.id)){assert(['source_id','title','url','date'].every(k=>incoming.get(r.id)[k]===r[k]),`Conflicting incoming ID: ${r.id}`);continue;}incoming.set(r.id,r);
  assert(validDate(r.date)&&r.month===r.date.slice(0,7)&&r.date>=start&&r.date<=fresh.scanned_through,`Invalid publication date: ${r.id}`);
  const url=new URL(r.url);assert(['http:','https:'].includes(url.protocol)&&!url.username&&!url.password,`Invalid public URL: ${r.id}`);
  assert(Array.isArray(r.categories)&&r.categories.every(c=>Object.hasOwn(TECHS,c))&&Array.isArray(r.tags),`Missing title classification: ${r.id}`);
  if(r.date>end){preview.push(r);continue;}
  const old=byId.get(r.id);
  assert(!old||old.source_id===r.source_id,`Source/ID collision: ${r.id}`);
  if(old&&['title','url','date'].every(k=>old[k]===r[k]))continue;
  const next={...old,...r,context_class:'other',application_reviewed:false,classification_basis:'title_only',eligible_categories:[],required_categories:[],unknown_categories:[]};
  next.observation_categories=observationCategories(next,'news');
  if(old){changed.push({id:r.id,before:{title:old.title,date:old.date,url:old.url},after:{title:r.title,date:r.date,url:r.url}});Object.assign(old,next);}
  else{panel.documents.push(next);byId.set(r.id,next);added.push(r.id);}
 }
 // Same-source normalized-title duplicates; retain every raw row and non-technology topic.
 const seen=new Map();
 for(const r of panel.documents.filter(d=>MEDIA.includes(d.source_id)).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))){
  const key=r.source_id+'|'+r.title.replace(/[^\p{L}\p{N}_]/gu,'').toLowerCase();
  r.duplicate_of=seen.get(key)||null;r.superseded=!!r.duplicate_of;if(!seen.has(key))seen.set(key,r.id);
 }
 panel.window.end=end;
 const months=monthsInWindow(panel.window);
 for(const s of panel.sources.filter(s=>MEDIA.includes(s.id))){
  s.coverage=months.map(month=>{
   const rows=panel.documents.filter(d=>d.source_id===s.id&&d.month===month&&d.date>=panel.window.start&&d.date<=end);
   return {month,status:'complete',total:rows.length,eligible:rows.filter(d=>!d.superseded).length,covered_through:month===end.slice(0,7)?end:day(day(month+'-28',4).slice(0,7)+'-01',-1),note:`全部新闻为分母；同源标题去重；本次从${start}全量回查至${end}，完整仅指当前可访问目录遍历。`};
  });
  s.last_rechecked_at=fresh.checked_at;s.recheck_window={start,end};
  s.limitation=`全量回查${start}至${end}；全部新闻保留在分母，旧记录本次未再出现时保留并列入批次核对清单。历史删除、异标题转载及来源结构变化仍可能影响结果；新增标题的采购/部署行为尚待复核。`;
 }
 for(const s of panel.sources.filter(s=>s.document_source_id||s.document_source_ids)){
  const ids=s.document_source_ids||[s.document_source_id];
  if(!ids.every(id=>MEDIA.includes(id)))continue;
  s.coverage=months.map(month=>{const covered=ids.map(id=>panel.sources.find(s=>s.id===id).coverage.find(c=>c.month===month));return {month,status:covered.every(c=>c.status==='complete')?'complete':'incomplete',total:covered.reduce((n,c)=>n+c.total,0),eligible:covered.reduce((n,c)=>n+c.eligible,0),note:`固定来源全部新闻；统计截至${end}。`};});
  s.last_rechecked_at=fresh.checked_at;s.recheck_window={start,end};
 }
 // A media refresh does not extend official-vendor or procurement coverage.
 if(end>oldEnd)for(const s of panel.sources.filter(s=>!MEDIA.includes(s.id)&&!s.document_source_id&&!s.document_source_ids)){
  for(const c of s.coverage||[])if(c.month>=oldEnd.slice(0,7)&&c.month<=end.slice(0,7)){
   if(c.month===oldEnd.slice(0,7)&&day(oldEnd,1).slice(0,7)!==c.month)continue;
   const through=c.covered_through||oldEnd;
   c.status='incomplete';c.covered_through=through;c.note=`本次仅更新媒体；该来源尚未补采${day(through,1)}之后的数据。`;
  }
 }
 const touched=new Set([...added,...changed.map(c=>c.id)]);
 const candidates=panel.documents.filter(d=>!d.superseded&&touched.has(d.id)&&d.observation_categories.length).map(d=>({id:d.id,title:d.title,url:d.url,published_date:d.date,publisher:d.publisher,source_id:d.source_id,categories:d.observation_categories,tags:d.tags,verified_fulltext:false,review_status:'pending',amount_cny:null,note:'仅新闻标题候选；地域、项目阶段、正文和金额需核验，尚未计入月度研究事件。'}));
 const summary={mode:'full',checked_at:fresh.checked_at,cutoff:end,reread_start:start,month_count:months.length,months,scanned_rows:fresh.documents.length,source_month_checks:monthChecks,added_rows:added.length,changed_rows:changed.length,added_ids:added,changed_metadata:changed,preview_rows:preview.length,research_candidates:candidates.length,unique_media_news:panel.documents.filter(d=>MEDIA.includes(d.source_id)&&!d.superseded&&d.date>=panel.window.start&&d.date<=end).length,sources:fresh.sources.map(({source_id,complete,rows,checked_at})=>({source_id,complete,rows,checked_at}))};
 panel.collected_at=fresh.checked_at;panel.version=`automatic-${fresh.checked_at}`;panel.latest_refresh=summary;
 return {panel,summary,candidates,preview};
}

// Each replacement is atomic. A retained journal restores the whole batch after a crash.
export function recoverTransaction(workspace){
 const journal=path.join(workspace,'weekly-runs/update-transaction.json');
 if(!fs.existsSync(journal))return false;
 const batch=read(journal);
 for(const {file,existed} of batch.files){
  assert(!path.isAbsolute(file)&&!file.split(/[\\/]/).includes('..'),'Invalid recovery path');
  const target=path.join(workspace,file),backup=path.join(batch.backup,file),tmp=target+'.update-tmp';
  if(existed){fs.copyFileSync(backup,tmp);fs.renameSync(tmp,target);}else fs.rmSync(target,{force:true});
  fs.rmSync(tmp,{force:true});
 }
 fs.rmSync(journal);return true;
}
export function commitFiles(workspace,output,files){
 const journal=path.join(workspace,'weekly-runs/update-transaction.json'),backup=path.join(output,'backup');
 const entries=Object.entries(files).map(([file,value])=>{
  const target=path.join(workspace,file),existed=fs.existsSync(target);
  if(existed){fs.mkdirSync(path.dirname(path.join(backup,file)),{recursive:true});fs.copyFileSync(target,path.join(backup,file));}
  write(path.join(output,'staged',file),value);return {file,existed};
 });
 write(journal,{backup,files:entries});
 try{
  for(const {file} of entries){const target=path.join(workspace,file),tmp=target+'.update-tmp';fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(output,'staged',file),tmp);fs.renameSync(tmp,target);}
  fs.rmSync(journal);
 }catch(error){recoverTransaction(workspace);throw error;}
}

function main(){
 const args=process.argv.slice(2),options={};
 for(let i=0;i<args.length;i++){
  const key=args[i];assert(['--dry-run','--end','--python','--input','--research','--help'].includes(key),`Unknown option: ${key}`);
  if(['--dry-run','--help'].includes(key))options[key]=true;
  else{assert(args[i+1]&&!args[i+1].startsWith('--'),`Missing value for ${key}`);options[key]=args[++i];}
 }
 if(options['--help']){console.log('npm run update -- [--dry-run] [--end YYYY-MM-DD] [--python PATH] [--input media-refresh.json] [--research current-backup.json]\nEvery run rescans all four media from public/market-panel.json window.start through the last completed Sunday (Asia/Shanghai). See WEEKLY_UPDATE.md.');return;}
 const outputRoot=path.join(root,'weekly-runs');fs.mkdirSync(outputRoot,{recursive:true});
 const lock=path.join(outputRoot,'update.lock');
 try{fs.mkdirSync(lock);}catch(e){if(e.code==='EEXIST')throw Error('Another update may be running. If it has stopped, remove weekly-runs/update.lock and retry; recovery runs first.');throw e;}
 const id=new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8),output=path.join(outputRoot,id);
 let applied=false;
 try{
  recoverTransaction(root);
  const original=read(path.join(root,'public/market-panel.json')),samples=read(path.join(root,'public/sample-sources.json')),config=read(path.join(root,'data/weekly-monitor.json'));
  const researchSnapshot=read(options['--research']?path.resolve(options['--research']):path.join(root,'data/research-2026.json')),research=researchSnapshot.research||researchSnapshot;
  assert(Array.isArray(research.events)&&Array.isArray(research.leads),'Invalid research snapshot');
  const end=options['--end']||lastSunday(),start=original.window.start;
  assert(validDate(end)&&new Date(end+'T00:00:00Z').getUTCDay()===0&&end<=lastSunday()&&end>=original.window.end,'Use a completed Sunday at or after the current data cutoff');
  let fresh;
  if(options['--input'])fresh=read(path.resolve(options['--input']));
  else{
   console.log(`Full archive scan: ${start} through ${end}; batch ${id}`);
   const result=spawnSync(options['--python']||process.env.PYTHON||'python',['-X','utf8',path.join(root,'tools/collectors/refresh-media.py'),'--start',start,'--end',end,'--cutoff',end,'--output',`output/${id}`],{cwd:root,stdio:'inherit',timeout:60*60*1000,windowsHide:true});
   assert(!result.error,result.error?.message||'Collector failed');
   assert.equal(result.status,0,'Collector incomplete; see tools/collectors/output/'+id+'; nothing was applied');
   fresh=read(path.join(root,'tools/collectors/output',id,'media-refresh.json'));
  }
  assert.equal(fresh.cutoff,end,'Input cutoff differs from --end');assert.equal(fresh.reread_start,start,'Input must cover the full research window, not an incremental batch');
  const {panel,summary,candidates,preview}=mergeMedia(original,fresh);
  const statePath=path.join(outputRoot,'last-success.json');
  const previous=fs.existsSync(statePath)?read(statePath):analyze(original,research,null,config,original.window.end).next_state;
  const monitor=analyze(panel,research,previous,config,end);
  write(path.join(output,'report.json'),{...summary,dry_run:!!options['--dry-run'],complete:monitor.complete,applied:false});
  write(path.join(output,'monitor.json'),monitor);write(path.join(output,'research-candidates.json'),candidates);write(path.join(output,'preview-news.json'),preview);
  assert(monitor.complete,'Coverage/volume checks failed; inspect report.json and monitor.json. Existing data was retained');
  // Never replace research or local database edits with a title-derived event/amount.
  const taxonomy=refreshTaxonomy(panel,research,{...samples,version:panel.version,collected_at:panel.collected_at,window:panel.window,latest_refresh:summary},fresh.checked_at.slice(0,10));
  const files={'public/market-panel.json':taxonomy.panel,'public/sample-sources.json':taxonomy.sources,'public/taxonomy-review.json':taxonomy.review,'data/weekly-monitor.json':{...config,last_completed_at:fresh.checked_at,last_completed_cutoff:end,latest_window:monitor.window,latest_status:`固定四媒体已全量重采${start}至${end}，覆盖${summary.month_count}个月份；本轮抓取${summary.scanned_rows}条，新增${summary.added_rows}篇，${candidates.length}条标题线索待核验，月度研究与金额未自动改写。`,latest_alerts:monitor.alerts.map(a=>({...a,url:a.url||a.urls?.[0]}))},'weekly-runs/last-success.json':monitor.next_state};
  if(!options['--dry-run']){commitFiles(root,output,files);applied=true;}
  write(path.join(output,'report.json'),{...summary,dry_run:!!options['--dry-run'],complete:true,applied:!options['--dry-run'],alerts:monitor.alerts.length});
  console.log(JSON.stringify({applied:!options['--dry-run'],start,end,months:summary.month_count,scanned_rows:summary.scanned_rows,unique_media_news:summary.unique_media_news,added:summary.added_rows,changed:summary.changed_rows,candidates:candidates.length,alerts:monitor.alerts.length,report:path.join(output,'report.json')}));
 }catch(error){write(path.join(output,'failure.json'),{failed_at:new Date().toISOString(),error:error.message,applied});throw error;}
 finally{fs.rmdirSync(lock);}
}
if(process.argv[1]===fileURLToPath(import.meta.url))try{main();}catch(error){console.error(error.message);process.exitCode=1;}
