import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {TECHS,inDateWindow,researchReview,validDate} from '../lib/model.js';
import {CHILDREN,matchesCategory,matchesChip} from '../lib/hierarchy.js';
import {amountEligible} from '../lib/monthly.js';
import {coverageComplete} from '../lib/panel.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const day=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
const between=(d,a,b)=>d>=a&&d<=b;
const signature=e=>JSON.stringify([e.stage,e.amount_kind,e.amount_cny,e.amount_range_cny,e.amount_eligible,e.evidence_status,e.verified_fulltext,e.status_conflict,!!e.cross_period_exclusion,[...(e.tags||[])].sort(),[...(e.categories||[])].sort()]);

export function analyze(panel,research,previous,config,end){
 assert(validDate(end)&&new Date(end+'T00:00:00Z').getUTCDay()===0,'Use a valid completed Sunday');
 assert(!previous?.cutoff||end>=previous.cutoff,'Do not move the successful cutoff backwards');
 const start=day(end,-6),baseStart=day(end,-34),baseEnd=day(end,-7),rules=config.rules,alerts=[],metrics=[];
 const sourceIds=rules.media_ids,docs=panel.documents.filter(d=>sourceIds.includes(d.source_id)&&!d.superseded),weeks=[...Array(5)].map((_,i)=>({start:day(end,-6-i*7),end:day(end,-i*7)}));
 const current=docs.filter(d=>between(d.date,start,end)),base=docs.filter(d=>between(d.date,baseStart,baseEnd));
 const months=new Set(weeks.flatMap(w=>[w.start.slice(0,7),w.end.slice(0,7)]));
 let complete=panel.window.start<=baseStart&&panel.window.end>=end;
 for(const id of sourceIds){
  const source=panel.sources.find(s=>s.id===id),covered=source&&[...months].every(m=>coverageComplete(source,m,[end,new Date(Date.UTC(Number(m.slice(0,4)),Number(m.slice(5)),0)).toISOString().slice(0,10)].sort()[0]));
  const n=current.filter(d=>d.source_id===id).length,b=base.filter(d=>d.source_id===id).length/4;
  if(!covered||!n||!b||n<b*.5){complete=false;alerts.push({id:`quality:${end}:${id}`,type:'quality',source_id:id,title:`${source?.name||id}采集覆盖或发稿量需检查`,detail:`本周${n}篇，前4周周均${b}篇；先核目录、缓存和日期覆盖。`});}
 }
 const usable=complete&&current.length>=rules.minimum_weekly_news&&base.length/4>=rules.minimum_weekly_news;
 for(const [category,label] of Object.entries(CHILDREN)){
  const matched=d=>matchesCategory(d,category,'news'),n=current.filter(matched).length,bn=base.filter(matched).length;
  const value=usable?1000*n/current.length:null,baseline=usable?1000*bn/base.length:null,delta=value==null||baseline==null?null:value-baseline;
  const direction=Math.sign(delta||0),confirming=usable?sourceIds.filter(id=>{
   const c=current.filter(d=>d.source_id===id),b=base.filter(d=>d.source_id===id);
   return c.length&&b.length&&Math.sign(c.filter(matched).length/c.length-b.filter(matched).length/b.length)===direction;
  }):[];
  const triggered=usable&&delta!==null&&Math.abs(delta)>=rules.attention_absolute_per_mille&&(baseline===0?value>0:Math.abs(delta)/baseline>=rules.attention_relative_change)&&Math.max(n,bn/4)>=rules.minimum_weekly_hits&&confirming.length>=rules.minimum_confirming_sources;
  metrics.push({category,n,N:current.length,baseline_n:bn,baseline_N:base.length,value,baseline,delta,usable,confirming_sources:confirming});
  if(triggered)alerts.push({id:`attention:${end}:${category}`,type:'attention',category,title:`${label}新闻关注度${direction>0?'上升':'下降'}`,detail:`${value.toFixed(1)}‰，前4周${baseline.toFixed(1)}‰；本周${n}/${current.length}，基线${bn}/${base.length}；不等于采用率。`,urls:current.filter(matched).slice(0,5).map(d=>d.url)});
 }
 if(!usable&&!alerts.some(a=>a.type==='quality'))alerts.push({id:`quality:${end}:window`,type:'quality',title:'完整周比较条件不足',detail:'数据窗口或新闻分母不足，本周暂停定量热度提示。'});
 const rows=[...research.events,...research.leads],known=previous?.records||{},recent=[],eventStart=previous?.cutoff?day(previous.cutoff,1):start;
 for(const e of rows){
  if(!inDateWindow(e,research.period_start,end))continue;
  const date=e.event_date||e.published_date,changed=known[e.id]!==undefined&&known[e.id]!==signature(e),fresh=known[e.id]===undefined;
  if(!(fresh&&(between(date,eventStart,end)||between(e.published_date,eventStart,end))||changed))continue;
  recent.push(e.id);
  const important=['hyg_cpu','hyg_dcu','hygon_unspecified','kunpeng','hyg_or_kunpeng'].some(t=>matchesChip(e,t))&&['tender','award','contract','production','repeat','launch'].includes(e.stage);
  const negative=['cancel','failure'].includes(e.stage)||e.status_conflict||e.evidence_status==='conflict';
  const threshold={award:rules.award_contract_cny,contract:rules.award_contract_cny,budget:rules.budget_cny,investment:rules.investment_cny}[e.amount_kind];
  const large=threshold&&Number.isFinite(e.amount_cny)&&e.amount_cny>=threshold&&!e.amount_range_cny&&!e.cross_period_exclusion&&!['candidate','cancel','failure'].includes(e.stage);
  if(important||negative||large)alerts.push({id:`event:${e.id}:${signature(e)}`,type:'event',record_id:e.id,title:e.title,url:e.url,date,stage:e.stage,amount_cny:e.amount_cny,amount_kind:e.amount_kind,verified:researchReview(e)==='accepted'&&!negative,amount_verified:amountEligible(e)&&!negative&&!e.amount_range_cny&&!e.cross_period_exclusion,reason:negative?'终止或冲突':important?'海光/鲲鹏重点路线':'大额披露',historical_revision:!between(date,start,end)});
 }
 const sent=new Set(previous?.notified_ids||[]);
 return {generated_at:new Date().toISOString(),window:{start,end,event_start:eventStart,baseline_start:baseStart,baseline_end:baseEnd},complete,metrics,new_or_changed_records:recent.length,historical_backfill:rows.filter(e=>known[e.id]===undefined&&(e.event_date||e.published_date)<eventStart).length,alerts:alerts.filter(a=>!sent.has(a.id)),next_state:{cutoff:end,records:Object.fromEntries(rows.map(e=>[e.id,signature(e)])),notified_ids:[...sent]}};
}

if(process.argv.includes('--self-test')){
 const rules={media_ids:['a','b'],attention_absolute_per_mille:5,attention_relative_change:.5,minimum_weekly_hits:5,minimum_weekly_news:200,minimum_confirming_sources:2,award_contract_cny:10000000,budget_cny:50000000,investment_cny:1000000000};
 const documents=[];for(let week=0;week<5;week++)for(const source_id of ['a','b'])for(let i=0;i<120;i++)documents.push({id:`${week}-${source_id}-${i}`,source_id,date:day('2026-09-20',-week*7),categories:i<(week===0?12:1)?['liquid_cooling']:[],url:'https://example.org/news'});
 const panel={window:{start:'2026-08-17',end:'2026-09-20'},sources:['a','b'].map(id=>({id,coverage:['2026-08','2026-09'].map(month=>({month,status:'complete'}))})),documents};
 const research={period_start:'2026-01-01',events:[],leads:[]},result=analyze(panel,research,{}, {rules},'2026-09-20');
 assert.equal(result.metrics[1].N,240,'Non-technology news remains in denominator');assert.equal(result.alerts.filter(a=>a.type==='attention').length,1);
 const event={id:'award',published_date:'2026-09-18',stage:'award',amount_kind:'award',amount_cny:10000000,amount_eligible:true,evidence_status:'primary',verified_fulltext:true,tags:[],categories:['liquid_cooling']};
 research.events=[event,{...event,id:'old',published_date:'2026-08-01'},{...event,id:'estimate',amount_kind:'estimate'}];
 const events=analyze(panel,research,{}, {rules},'2026-09-20').alerts.filter(a=>a.type==='event');assert.equal(events.length,1);assert(events[0].amount_verified);
 const state={records:Object.fromEntries(research.events.map(e=>[e.id,signature(e)])),notified_ids:events.map(e=>e.id)};
 assert(!analyze(panel,research,state,{rules},'2026-09-20').alerts.some(a=>a.type==='event'),'No repeat for unchanged events');
 research.events[0]={...event,evidence_status:'conflict'};assert(analyze(panel,research,state,{rules},'2026-09-20').alerts.some(a=>a.type==='event'&&!a.verified),'A new conflict must alert');
 research.events=[{...event,published_date:'2026-09-10'}];assert(analyze(panel,research,{cutoff:'2026-09-06'},{rules},'2026-09-20').alerts.some(a=>a.type==='event'),'Catch up after a missed run');
 research.events=[{...event,event_date:'2026-08-01'}];assert(analyze(panel,research,{}, {rules},'2026-09-20').alerts.some(a=>a.type==='event'&&a.historical_revision),'New disclosure of an older event stays identifiable');
 research.events=[{...event,tags:['kunpeng'],amount_range_cny:{min:100,max:200}}];assert(!analyze(panel,research,{}, {rules},'2026-09-20').alerts.find(a=>a.type==='event').amount_verified,'Ranges cannot be verified point amounts');
 assert.throws(()=>analyze(panel,research,{cutoff:'2026-09-27'},{rules},'2026-09-20'));
 panel.sources[1].coverage[1].status='incomplete';assert(!analyze(panel,research,{}, {rules},'2026-09-20').alerts.some(a=>a.type==='attention'));
 console.log('PASS: all-news denominator, complete coverage, amount type, old backfill, event deduplication and changed evidence');
}else if(process.argv[1]===fileURLToPath(import.meta.url)){
 const end=process.argv[process.argv.indexOf('--end')+1];assert(process.argv.includes('--end'),'Specify --end YYYY-MM-DD');
 const output=path.resolve(root,'weekly-runs');fs.mkdirSync(output,{recursive:true});
 const statePath=path.join(output,'last-success.json'),previous=fs.existsSync(statePath)?read(statePath):null,config=read(path.join(root,'data/weekly-monitor.json'));
 const researchInput=process.argv.includes('--research')?process.argv[process.argv.indexOf('--research')+1]:path.join(root,'data/research-2026.json'),snapshot=read(researchInput);
 const result=analyze(read(path.join(root,'public/market-panel.json')),snapshot.research||snapshot,previous,config,end);
 if(process.argv.includes('--init')){assert(!previous,'Baseline already exists; do not overwrite success state');fs.writeFileSync(statePath,JSON.stringify({...result.next_state,initialized_at:result.generated_at},null,2));result.alerts=[];result.initialization=true;}
 const dest=path.join(output,`monitor-${end}.json`);fs.writeFileSync(dest,JSON.stringify(result,null,2));console.log(JSON.stringify({draft:dest,complete:result.complete,alerts:result.alerts.length,baseline_initialized:!!result.initialization}));
}
