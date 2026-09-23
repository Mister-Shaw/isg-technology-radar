import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateResearchEdit,researchWithEdits,researchKey} from '../lib/research-editing.js';
for(const month of ['2026-10','2027-01'])assert.equal(validateResearchEdit('monthly_notes',month,{text:'新月份判断'},{month,text:'原判断'}).text,'新月份判断');
assert.throws(()=>validateResearchEdit('monthly_notes','2027-13',{text:'无效月份'},{month:'2027-13'}),/月份无效/);
assert.throws(()=>validateResearchEdit('monthly_notes','2027-01',{text:'不能更换已有判断月份'},{month:'2026-09'}),/月份无效/);
assert.throws(()=>validateResearchEdit('monthly_notes','2027-01',{text:'不能凭空创建判断'}),/不存在/);
import {ledgerCsv} from '../lib/monthly.js';
const snapshot=JSON.parse(readFileSync(new URL('../data/research-2026.json',import.meta.url)));
let count=0;
for(const section of ['events','leads'])for(const row of snapshot[section]){
 const saved=validateResearchEdit(section,row.id,{...row,note:'保存兼容性检查'},row);
 assert.deepEqual(saved,{...row,note:'保存兼容性检查'});count++;
}
const original=snapshot.events[0],edit={id:`events:${original.id}`,section:'events',key:original.id,revision:1,value:{...original,note:'共享笔记'}};
const combined=researchWithEdits(snapshot,[edit]);
assert.equal(combined.events.find(e=>e.id===original.id).note,'共享笔记');
assert.equal(combined.events.find(e=>e.id===original.id)._revision,1);
assert.deepEqual(combined.queries,snapshot.queries);
assert.deepEqual(combined.audit,snapshot.audit);
assert.deepEqual(combined.events[1],{...snapshot.events[1],_revision:0});
assert.match(ledgerCsv(combined.events),/共享笔记/);
assert.equal(validateResearchEdit('events',original.id,{...original,verified_fulltext:false,evidence_status:'conflict'},original).verified_fulltext,false);
assert.throws(()=>validateResearchEdit('events',original.id,{...original,tags:['invented-chip']},original),/400/);
assert.throws(()=>validateResearchEdit('events',original.id,{...original,url:'javascript:alert(1)'},original),/400/);
assert.throws(()=>validateResearchEdit('events',original.id,{...original,amount_cny:-1},original),/400/);
const range=snapshot.events.find(e=>e.amount_range_cny);
assert.throws(()=>validateResearchEdit('events',range.id,{...range,amount_cny:1234,amount_kind:'contract'},range),/400/);
assert.equal(validateResearchEdit('events',range.id,{...range,amount_cny:1234,amount_kind:'contract',amount_range_cny:null},range).amount_range_cny,null);
for(const section of ['monthly_notes','insights','category_notes']){
 const item=snapshot[section][0],key=researchKey(section,item,0);
 const updated=validateResearchEdit(section,key,{...item,action:'共享判断'},item);
 assert.equal(updated.action,'共享判断');
}
console.log(`PASS: all ${count} existing records remain editable; tags and undisclosed projects preserved; range consistency, status changes, research overlays and CSV notes.`);
