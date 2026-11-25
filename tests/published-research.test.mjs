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
 for(const [section,snapshotKey,storageKey,storageSection=section] of publishedResearchKeys){
  assert.ok(snapshot[section].some(row=>row.id===snapshotKey));
  assert.equal(publishedResearchRow(storageKey),publishedResearchRow(snapshotKey));
  assert.equal(publishedResearchRow(storageKey).storageSection,storageSection);
  assert.ok(!keys.has(storageKey)&&!keys.has(snapshotKey));
  keys.add(storageKey);keys.add(snapshotKey);
 }
 assert.equal(publishedResearchRow(original.url),undefined);
});

test('revision one of a native snapshot ID retains its first visitor edit after promotion',()=>{
 const key='native-snapshot-id',identity={section:'events',storageSection:'leads',snapshotKey:key,storageKey:key};
 const prior={id:key,title:'预算公示',stage:'tender',note:'',verified_fulltext:false};
 const current={...prior,title:'中标公告',stage:'award',verified_fulltext:true};
 const edit={key,section:'leads',revision:1,value:{...prior,note:'人工跟进'}};
 const edits=[edit,{...edit,revision:2,value:{...edit.value,note:''}}];
 const rows=projectPublishedHistory(identity,current,edits,prior);
 assert.equal(rows[0].value.note,'人工跟进');assert.equal(rows[1].value.note,'');
 for(const entry of rows){assert.equal(entry.section,'events');assert.equal(entry.value.stage,'award');assert.equal(entry.value.verified_fulltext,true);}
});

test('a promoted lead retains visitor changes while its verified snapshot and history appear only under events',()=>{
 const moved={section:'events',storageSection:'leads',snapshotKey:'snapshot-id',storageKey:'editor-uuid'};
 const prior={id:moved.snapshotKey,title:'原条目',verified_fulltext:false,note:'',collection_batch:'旧版'};
 const verified={...prior,title:'采购已核实',verified_fulltext:true,collection_batch:'新版'};
 const initial={section:'leads',key:moved.storageKey,revision:1,value:{id:moved.storageKey,title:'录入默认值',note:''}};
 const revisions=[initial,
  {...initial,revision:2,value:{...initial.value,note:'访客补记'}},
  {...initial,revision:3,snapshot_key:moved.snapshotKey,value:{...prior,note:'更正补记'}},
  {...initial,revision:4,snapshot_key:moved.snapshotKey,snapshot_changes:{note:''},value:{...verified,note:''}}
 ];
 const projected=projectPublishedHistory(moved,verified,revisions,prior);
 assert.deepEqual(projected.map(x=>x.value.note),['','访客补记','更正补记','']);
 for(const entry of projected){
  assert.equal(entry.section,'events');assert.equal(entry.key,moved.snapshotKey);
  assert.equal(entry.value.id,moved.snapshotKey);assert.equal(entry.value.title,verified.title);
  assert.equal(entry.value.verified_fulltext,true);assert.equal(entry.value.collection_batch,'新版');
 }
 const study=researchWithEdits({events:[verified],leads:[]},[projected[2]]);
 assert.equal(study.events.length,1);assert.equal(study.leads.length,0);
 assert.equal(study.events[0]._revision,3);assert.equal(study.events[0].note,'更正补记');
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
