import {database,readRecords,saveRecord} from './database';
import {readResearch,researchHistory} from './research-store';
import {unifyRecords,LEGACY_ALIASES,workspaceResearch} from './unified-records';
import {validateResearchEdit} from './research-editing';
import {researchReview} from './model';

// Preserve the existing shared partition and its complete history.
export const SHARED_WORKSPACE='local-workspace';
export async function readRadar(){
 const [research,workspace]=await Promise.all([readResearch(),readRecords(SHARED_WORKSPACE)]);
 return unifyRecords(research,workspace);
}
async function oldHistory(id){
 const {results}=await database().prepare('SELECT data,at FROM history WHERE owner=? AND id=? ORDER BY revision DESC LIMIT 20').bind(SHARED_WORKSPACE,id).all();
 return results.map(r=>{const value=JSON.parse(r.data);return {data:{...value,value},at:r.at,source:'工作记录'};});
}
export async function recordHistory(id,section){
 const current=await readRadar();
 const row=current.records.find(e=>e.id===(LEGACY_ALIASES[id]||id));
 if(row?._ref.source==='workspace')return oldHistory(row.id);
 const key=row?.id||id,target=section||row?._ref.section;
 const edits=target?await researchHistory(target,key):[];
 const linked=row?.legacy_record_id?await oldHistory(row.legacy_record_id):[];
 return [...edits.map(h=>({...h,source:'月度研究'})),...linked].sort((a,b)=>b.at.localeCompare(a.at));
}
export async function saveWorkspaceResearch({key,revision,value}){
 const current=(await readRecords(SHARED_WORKSPACE)).find(e=>e.id===key);
 if(!current||LEGACY_ALIASES[key])throw Error('409:此记录已归入月度研究，请刷新后编辑统一记录。');
 if(!Number.isInteger(revision)||current.revision!==revision)throw Error('409:此记录已被其他访客更新，请保留输入并刷新后重试。');
 const clean=validateResearchEdit('events',key,value,workspaceResearch(current));
 delete clean._ref;delete clean._revision;
 const saved=await saveRecord(SHARED_WORKSPACE,{...current,...clean,revision,techs:clean.categories,value_cny:clean.amount_cny,review_status:researchReview(clean)});
 return workspaceResearch(saved);
}
