import snapshot from '../data/research-2026.json';
import reportAnalysis from '../data/report-analysis.json';
import {reportAnalysisSnapshot} from './report-analysis.js';
import {database,saveRecord} from './database';
import {researchWithEdits,researchKey,validateResearchEdit,RESEARCH_SECTIONS} from './research-editing.js';
import {changedResearchFields,projectPublishedHistory,publishedResearchRow} from './published-research.js';
const OWNER='shared-research';
const sourceSnapshot=reportAnalysisSnapshot(snapshot,reportAnalysis);
const sourceRows=new Map([...sourceSnapshot.events,...sourceSnapshot.leads].map(row=>[row.id,row]));

function historyQuery(section,key,revision) {
 return database().prepare('SELECT data,at FROM history WHERE owner=? AND id=? AND revision<=? ORDER BY revision')
  .bind(OWNER,`${section}:${key}`,revision);
}

export async function readResearch(){
 const {results}=await database().prepare('SELECT data FROM records WHERE owner=? ORDER BY id LIMIT 1001').bind(OWNER).all();
 if(results.length>1000)throw Error('503:研究记录超出容量，请联系维护者。');
 const edits=results.map(r=>JSON.parse(r.data));
 const legacy=[];
 for(const [index,edit] of edits.entries()){
  const identity=publishedResearchRow(edit.key);
  if(!identity||identity.section!==edit.section||identity.storageKey!==edit.key)continue;
  const original=sourceRows.get(identity.snapshotKey);
  if(!original)continue;
  if(edit.snapshot_key===identity.snapshotKey||edit.revision===1){
   const value=edit.snapshot_key===identity.snapshotKey?edit.value:original;
   edits[index]={...edit,key:identity.snapshotKey,value:{...value,id:identity.snapshotKey}};
  }else{
   legacy.push({index,identity,original,edit});
  }
 }
 if(legacy.length){
  const histories=await database().batch(legacy.map(({edit})=>historyQuery(edit.section,edit.key,edit.revision)));
  legacy.forEach(({index,identity,original,edit},i)=>{
   const records=histories[i].results.map(r=>JSON.parse(r.data));
   if(records.at(-1)?.revision!==edit.revision)throw Error('503:研究条目缺少历史版本，无法还原共享修改。');
   edits[index]=projectPublishedHistory(identity,original,records).at(-1);
  });
 }
 return researchWithEdits(sourceSnapshot,edits);
}
export async function saveResearchEdit(payload){
 const {section,key,revision,value}=payload;
 if(!Object.hasOwn(RESEARCH_SECTIONS,section)||!Number.isInteger(revision)||revision<0)throw Error('400:保存版本无效，请刷新后重试。');
 const identity=publishedResearchRow(key);
 if(identity&&identity.section!==section)throw Error('409:条目所属栏目已更新，请刷新后编辑。');
 const snapshotKey=identity?.snapshotKey||key,storageKey=identity?.storageKey||key;
 const current=await readResearch(),base=current[section].find((v,i)=>researchKey(section,v,i)===snapshotKey);
 if((base?._revision||0)!==revision)throw Error('409:此条目已被其他访客更新。当前输入已保留，请复制后关闭并刷新再编辑。');
 let input=value;
 if(identity&&key===storageKey&&revision&&value&&typeof value==='object'&&!Array.isArray(value)){
  // An editor opened before deployment still submits all the old form defaults.
  const raw=await database().prepare('SELECT data FROM records WHERE owner=? AND id=?').bind(OWNER,`${section}:${storageKey}`).first();
  if(raw)input=changedResearchFields(JSON.parse(raw.data).value,value);
 }
 const clean=validateResearchEdit(section,snapshotKey,input,base);
 const saved=await saveRecord(OWNER,{id:`${section}:${storageKey}`,revision,section,key:storageKey,value:clean,...(identity?{snapshot_key:snapshotKey}:{})});
 return {...saved.value,_revision:saved.revision};
}
export async function researchHistory(section,key){
 if(!Object.hasOwn(RESEARCH_SECTIONS,section))throw Error('400:研究类型无效。');
 const identity=publishedResearchRow(key);
 if(identity?.section===section&&sourceRows.has(identity.snapshotKey)){
  const {results}=await historyQuery(section,identity.storageKey,Number.MAX_SAFE_INTEGER).all();
  const edits=projectPublishedHistory(identity,sourceRows.get(identity.snapshotKey),results.map(r=>JSON.parse(r.data)));
  return edits.map((data,i)=>({data,at:results[i].at})).slice(-20).reverse();
 }
 const {results}=await database().prepare('SELECT data,at FROM history WHERE owner=? AND id=? ORDER BY revision DESC LIMIT 20').bind(OWNER,`${section}:${key}`).all();
 return results.map(r=>({data:JSON.parse(r.data),at:r.at}));
}
