import snapshot from '../data/research-2026.json';
import {database,saveRecord} from './database';
import {researchWithEdits,researchKey,validateResearchEdit,RESEARCH_SECTIONS} from './research-editing.js';
const OWNER='shared-research';
export async function readResearch(){
 const {results}=await database().prepare('SELECT data FROM records WHERE owner=? ORDER BY id LIMIT 1001').bind(OWNER).all();
 if(results.length>1000)throw Error('503:研究记录超出容量，请联系维护者。');
 return researchWithEdits(snapshot,results.map(r=>JSON.parse(r.data)));
}
export async function saveResearchEdit(payload){
 const {section,key,revision,value}=payload;
 if(!Object.hasOwn(RESEARCH_SECTIONS,section)||!Number.isInteger(revision)||revision<0)throw Error('400:保存版本无效，请刷新后重试。');
 const current=await readResearch(),base=current[section].find((v,i)=>researchKey(section,v,i)===key);
 if((base?._revision||0)!==revision)throw Error('409:此条目已被其他访客更新。当前输入已保留，请复制后关闭并刷新再编辑。');
 const clean=validateResearchEdit(section,key,value,base);
 const saved=await saveRecord(OWNER,{id:`${section}:${key}`,revision,section,key,value:clean});
 return {...saved.value,_revision:saved.revision};
}
export async function researchHistory(section,key){
 if(!Object.hasOwn(RESEARCH_SECTIONS,section))throw Error('400:研究类型无效。');
 const {results}=await database().prepare('SELECT data,at FROM history WHERE owner=? AND id=? ORDER BY revision DESC LIMIT 20').bind(OWNER,`${section}:${key}`).all();
 return results.map(r=>({data:JSON.parse(r.data),at:r.at}));
}
