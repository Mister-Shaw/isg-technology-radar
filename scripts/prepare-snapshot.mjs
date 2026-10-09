import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function prepareSnapshot(dir=root){
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'data/market-panel.snapshot.json'),'utf8'));
 const target=path.join(dir,'public/market-panel.json'),marker=path.join(dir,'.cache/market-snapshot.json');
 const sha=b=>createHash('sha256').update(b).digest('hex');
 const blob=b=>createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
 let previous;try{previous=JSON.parse(fs.readFileSync(marker,'utf8')).sha256;}catch{}
 const existing=fs.existsSync(target)?fs.readFileSync(target):null;
 if(existing&&sha(existing)!==manifest.sha256&&sha(existing)!==previous&&blob(existing)!==manifest.previous_git_blob){
  console.log('保留本地已更新的市场样本。');return 'preserved';
 }
 if(!existing||sha(existing)!==manifest.sha256){
  const data=gunzipSync(fs.readFileSync(path.join(dir,'data/market-panel.snapshot.json.gz')));
  if(sha(data)!==manifest.sha256)throw Error('市场样本完整性校验失败');
  JSON.parse(data.toString('utf8'));fs.mkdirSync(path.dirname(target),{recursive:true});
  const temp=target+'.tmp';fs.writeFileSync(temp,data);fs.renameSync(temp,target);
 }
 fs.mkdirSync(path.dirname(marker),{recursive:true});fs.writeFileSync(marker,JSON.stringify({sha256:manifest.sha256})+'\n');
 return 'ready';
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))prepareSnapshot();
