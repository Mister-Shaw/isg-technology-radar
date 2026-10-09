import assert from 'node:assert/strict';
import fs from 'node:fs';
import {panelMatrix,panelCell,periods} from '../lib/panel.js';
import {definitionsForRows} from '../lib/keyword-boards.js';
const documents=[
 {id:'a',source_id:'one',date:'2026-01-03',month:'2026-01',title:'GPU服务器采购',tags:[],categories:[]},
 {id:'b',source_id:'two',date:'2026-02-05',month:'2026-02',title:'AIDC液冷服务器',tags:[],categories:[]},
 {id:'c',source_id:'one',date:'2026-02-06',month:'2026-02',title:'普通新闻',tags:[],categories:[]},
 {id:'obsolete',source_id:'one',date:'2026-01-01',month:'2026-01',title:'GPU服务器',superseded:true},
 {id:'outside',source_id:'one',date:'2025-12-31',month:'2025-12',title:'GPU服务器'},
];
const source={id:'combined',kind:'news',document_source_ids:['one','two'],coverage:[{month:'2026-01',status:'complete'},{month:'2026-02',status:'incomplete'}]};
const data={window:{start:'2026-01-01',end:'2026-02-09'},sources:[source],documents};
const defs=definitionsForRows('components');let scans=0;
const normalFilter=documents.filter;documents.filter=function(...args){scans++;return normalFilter.apply(this,args);};
const matrix=panelMatrix(data,source,'attention','month','all',defs);
assert.equal(scans,2,'Full document collection is scanned once per period, not per category');
for(const row of matrix)for(const p of periods('month',data.window))assert.deepEqual(row.points.find(cell=>cell.id===p.id),panelCell(data,source,row.id,'attention',p));
assert.strictEqual(matrix[0].points[0].denominator_ids,matrix[1].points[0].denominator_ids,'Read-only denominator IDs are shared rather than duplicated per row');
const app=fs.readFileSync(new URL('../app/market-panel.jsx',import.meta.url),'utf8');
assert(app.includes('ALL_KEYWORD_DEFINITIONS'));
assert(app.includes('[data,source,metric,frequency,chip]'),'Board/fold/period selection must not invalidate aggregate memo');
assert(app.includes('bars={NEWS_BARS}'));
console.log('PASS: period-bucket scan count, cell parity, shared IDs, aggregate memo dependencies, stable chart bars');
