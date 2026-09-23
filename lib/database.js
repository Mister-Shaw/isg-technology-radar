import { env } from 'cloudflare:workers';
import seed from '../data/seed.json';
import {importKey,ambiguousImport} from './imports.js';
export function database(){if(!env.DB)throw Error('503:存储暂不可用，请稍后重试，当前输入会保留。');return env.DB;}
export async function readRecords(owner){
 const db=database();
 const has=await db.prepare('SELECT id FROM records WHERE owner=? LIMIT 1').bind(owner).first();
 if(!has)await db.batch(seed.map(e=>db.prepare('INSERT OR IGNORE INTO records (owner,id,revision,data,updated) VALUES (?,?,?,?,?)').bind(owner,e.id,1,JSON.stringify({...e,revision:1,note:'',followup_on:null}),new Date().toISOString())));
 const {results}=await db.prepare('SELECT data FROM records WHERE owner=? ORDER BY updated DESC,id LIMIT 1001').bind(owner).all();
 if(results.length>1000)throw Error('503:记录超出容量，请联系维护者完整导出。');
 return results.map(r=>JSON.parse(r.data));
}
export async function saveRecord(owner,e){
 const db=database(),at=new Date().toISOString(),old=e.revision,next={...e,revision:old+1,updated_at:at};
 if(!old){const total=await db.prepare('SELECT count(*) AS n FROM records WHERE owner=?').bind(owner).first();if(total.n>=1000)throw Error('400:已达到1000条记录，请先导出整理。');}
 const mutation=old?db.prepare('UPDATE records SET data=?,revision=?,updated=? WHERE owner=? AND id=? AND revision=?').bind(JSON.stringify(next),next.revision,at,owner,e.id,old):db.prepare('INSERT OR IGNORE INTO records (owner,id,revision,data,updated) SELECT ?,?,?,?,? WHERE (SELECT count(*) FROM records WHERE owner=?)<1000').bind(owner,e.id,1,JSON.stringify(next),at,owner);
 const audit=db.prepare('INSERT OR IGNORE INTO history (owner,id,revision,data,at) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM records WHERE owner=? AND id=? AND revision=? AND updated=?)').bind(owner,e.id,next.revision,JSON.stringify(next),at,owner,e.id,next.revision,at);
 const results=await db.batch([mutation,audit]);
 if(results[0].meta.changes!==1)throw Error('409:此记录已在另一页面更新。请保留当前输入，关闭并刷新后重试。');
 return next;
}

export async function importRecords(owner,incoming,otherRecords=[]){
 const db=database(),existing=await readRecords(owner),known=[...existing,...otherRecords],seen=new Set(known.map(importKey)),fresh=[];
 for(const e of incoming){
  const key=importKey(e);if(seen.has(key))continue;
  const ambiguous=[...known,...fresh].find(r=>ambiguousImport(r,e));
  if(ambiguous)throw Error(`409:同一原文与标包的项目编号尚有歧义：${ambiguous.title}。请先补齐旧记录或本批资料的项目编号，再重新导入；本批尚未写入。`);
  if(existing.some(r=>r.id===e.id&&importKey(r)!==key))throw Error('409:此链接对应的旧记录已修改原文地址、项目编号或标包，请先核对旧记录；本批尚未导入。');
  fresh.push(e);seen.add(key);
 }
 if(existing.length+fresh.length>1000)throw Error('400:导入将超过1000条容量，请减少本批数量并先导出整理。');
 if(!fresh.length)return {added:0,skipped:incoming.length,records:[]};
 const at=new Date().toISOString(),rows=fresh.map(e=>({...e,revision:1,updated_at:at}));
 // Deterministic URL/project/lot ids prevent duplicate inserts across retried batches; no existing row is overwritten.
 const results=await db.batch(rows.map(e=>db.prepare('INSERT OR IGNORE INTO records (owner,id,revision,data,updated) SELECT ?,?,?,?,? WHERE (SELECT count(*) FROM records WHERE owner=?)<1000').bind(owner,e.id,1,JSON.stringify(e),at,owner)));
 const added=rows.filter((_,i)=>results[i].meta.changes===1);
 return {added:added.length,skipped:incoming.length-added.length,records:added};
}
