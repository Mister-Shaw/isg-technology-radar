import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {publishedResearchKeys} from '../data/published-research-keys.js';
import {publishedResearchRow,projectPublishedHistory,changedResearchFields} from '../lib/published-research.js';
import {researchWithEdits} from '../lib/research-editing.js';

const snapshot=JSON.parse(readFileSync(new URL('../data/research-2026.json',import.meta.url)));
const [section,snapshotKey,storageKey]=publishedResearchKeys[0];
const identity=publishedResearchRow(storageKey);
const original=snapshot[section].find(row=>row.id===snapshotKey);
const seed={section,key:storageKey,revision:1,value:{id:storageKey,title:'原编辑器摘要',categories:[],note:'',url:original.url}};
const revise=(revision,fields)=>({...seed,revision,value:{...seed.value,...fields}});

test('every reviewed editor key resolves to one snapshot row in the right section',()=>{
 const keys=new Set();
 for(const [section,snapshotKey,storageKey] of publishedResearchKeys){
  assert.ok(snapshot[section].some(row=>row.id===snapshotKey));
  assert.equal(publishedResearchRow(storageKey),publishedResearchRow(snapshotKey));
  keys.add(storageKey);keys.add(snapshotKey);
 }
 assert.equal(keys.size,164);
 assert.equal(publishedResearchRow(original.url),undefined);
});

test('import defaults, visitor edits, deliberate reversions and later canonical saves replay in one sequence',()=>{
 const edits=[seed,revise(2,{note:'核验笔记',title:'更正标题'}),revise(3,{note:'核验笔记'}),{
  ...seed,revision:4,snapshot_key:snapshotKey,value:{...original,note:'',categories:[]}
 }];
 const history=projectPublishedHistory(identity,original,edits);
 assert.deepEqual(history[0].value,original);
 assert.equal(history[1].value.title,'更正标题');
 assert.deepEqual(history[1].value.categories,original.categories);
 assert.equal(history[2].value.title,seed.value.title);
 assert.equal(history[2].value.note,'核验笔记');
 assert.deepEqual(history[3].value.categories,[]);
 assert.equal(history[3].value.note,'');
 for(const row of history)assert.equal(row.value.id,snapshotKey);
 assert.deepEqual(changedResearchFields(seed.value,{...seed.value,note:'旧标签页的更新'}),{note:'旧标签页的更新'});
 assert.throws(()=>projectPublishedHistory(identity,original,[edits[1]]),/历史/);
 const distinct={...seed,key:'another-lot',value:{...seed.value,id:'another-lot'}};
 const projected=researchWithEdits(snapshot,[history[3],distinct]);
 assert.equal(projected[section].length,snapshot[section].length+1);
 assert.equal(projected[section].find(row=>row.id===snapshotKey)._revision,4);
 assert.equal(projected[section].find(row=>row.id==='another-lot').url,original.url);
});
