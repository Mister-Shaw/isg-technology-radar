import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {prepareSnapshot} from '../scripts/prepare-snapshot.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'isg-package-'));fs.mkdirSync(path.join(dir,'data'));
for(const name of ['market-panel.snapshot.json','market-panel.snapshot.json.gz'])fs.copyFileSync(new URL('../data/'+name,import.meta.url),path.join(dir,'data',name));
try{assert.equal(prepareSnapshot(dir),'ready');const first=fs.readFileSync(path.join(dir,'public/market-panel.json'));assert.deepEqual(first,fs.readFileSync(new URL('../public/market-panel.json',import.meta.url)));assert.equal(prepareSnapshot(dir),'ready');fs.writeFileSync(path.join(dir,'public/market-panel.json'),'{"local":true}');assert.equal(prepareSnapshot(dir),'preserved');assert.equal(fs.readFileSync(path.join(dir,'public/market-panel.json'),'utf8'),'{"local":true}');console.log('PASS lossless snapshot materialization, repeatability and local edit preservation');}finally{fs.rmSync(dir,{recursive:true,force:true});}
