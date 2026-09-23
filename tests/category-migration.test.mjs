import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const db=new DatabaseSync(':memory:');
db.exec(read('../drizzle/0000_mature_edwin_jarvis.sql'));
const seed=JSON.parse(read('../data/seed.json'));
const original=seed.map(e=>{
 const copy={...e,revision:7,note:'保留研究笔记，金额和原文不可改动',followup_on:'2026-09-25'};
 if(e.id.startsWith('AD-AI-'))copy.techs=['ai_appliance'];
 if(e.id.startsWith('AD-HE-'))copy.techs=e.techs.map(t=>t==='compute_field'?'heterogeneous':t);
 delete copy.classification_note;
 return copy;
});
// Existing destination tag and a second retired tag must not create duplicates.
original.find(e=>e.id==='AD-HE-004').techs.push('compute_field','ai_appliance');
for(const e of original)db.prepare('INSERT INTO records VALUES (?,?,?,?,?)').run('owner',e.id,e.revision,JSON.stringify(e),'2026-09-19T00:00:00Z');
db.prepare('INSERT INTO history VALUES (?,?,?,?,?)').run('owner','AD-AI-001',7,JSON.stringify(original.find(e=>e.id==='AD-AI-001')),'2026-09-19T00:00:00Z');
const sql=read('../drizzle/0001_merge_legacy_categories.sql');
db.exec(sql);
const rows=()=>db.prepare('SELECT * FROM records ORDER BY id').all();
assert.equal(rows().length,original.length);
for(const row of rows()){
 const before=original.find(e=>e.id===row.id),after=JSON.parse(row.data),changed=before.techs.some(t=>['heterogeneous','ai_appliance'].includes(t));
 const expected=[...new Set(before.techs.map(t=>['heterogeneous','ai_appliance'].includes(t)?'compute_field':t))];
 assert.deepEqual(after.techs,expected);
 assert.equal(row.revision,before.revision+Number(changed));assert.equal(after.revision,row.revision);
 for(const key of Object.keys(before).filter(k=>!['techs','revision'].includes(k)))assert.deepEqual(after[key],before[key],`${row.id}: ${key}`);
 if(changed){const history=db.prepare('SELECT data FROM history WHERE id=? ORDER BY revision').all(row.id).map(r=>JSON.parse(r.data));assert.deepEqual(history,[before,after]);}
}
assert.equal(db.prepare('SELECT count(*) AS n FROM history').get().n,14);
const once=rows(),history=db.prepare('SELECT * FROM history ORDER BY id,revision').all();
db.exec(sql);assert.deepEqual(rows(),once);assert.deepEqual(db.prepare('SELECT * FROM history ORDER BY id,revision').all(),history);
db.close();
console.log('PASS: 7 records merged, other tags deduplicated, notes/amounts/dates preserved, before-and-after history retained, migration idempotent');
