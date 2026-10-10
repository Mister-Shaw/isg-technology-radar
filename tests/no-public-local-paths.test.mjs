import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
test('published data never includes machine-local filesystem paths',()=>{
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
 for(const file of [...walk('public'),...walk('data')].filter(p=>/\.(json|csv)$/.test(p))){
  assert(!/(?:\/|\\\\)(?:workspace|tmp|home\/agent|root|Users)(?:\/|\\\\)/.test(fs.readFileSync(file,'utf8')),file);
 }
});
