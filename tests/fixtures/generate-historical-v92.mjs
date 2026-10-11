import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {gzipSync} from 'node:zlib';

// Regeneration requires the original Site history. Reading fixtures never needs Git.
const commit='81b9c61b6eff247c61e250305695fc004cb94f37';
const sourceRepository=process.argv[2];
if(!sourceRepository)throw new Error('Usage: node tests/fixtures/generate-historical-v92.mjs /path/to/site-checkout');
const git=(...args)=>execFileSync('git',['-C',sourceRepository,...args],{maxBuffer:60*1024*1024});
const read=path=>git('show',`${commit}:${path}`);
const panel=JSON.parse(read('public/market-panel.json'));
const afternoon=JSON.parse(read('data/source-audit-20261010-1600.json'));
// Include only full JSON files used by historical regression assertions.
const paths=[
 'public/market-panel.json',
 ...panel.expansion_assets.map(path=>'public'+path),
 'data/research-2026.json',
 'data/latest-update.json',
 'data/source-audit-20261010-1600.json',
 'data/source-audit-20261010.json',
 'data/report-monitor.json',
 `public/${afternoon.id}.json`,
 'public/idc-march-backfill.json',
].sort();
const root=new URL('./historical-v92/',import.meta.url);
fs.mkdirSync(root,{recursive:true});
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const files={};
for(const path of paths){
 const bytes=read(path),compressed=gzipSync(bytes,{level:9}),fixture=path+'.gz';
 const target=new URL(fixture,root);
 fs.mkdirSync(new URL('./',target),{recursive:true});
 fs.writeFileSync(target,compressed);
 files[path]={fixture,git_blob:git('rev-parse',`${commit}:${path}`).toString().trim(),bytes:bytes.length,sha256:sha256(bytes),gzip_bytes:compressed.length,gzip_sha256:sha256(compressed)};
}
const manifest={schema_version:1,baseline_site_version:92,baseline_site_commit:commit,baseline_site_tree:git('rev-parse',`${commit}^{tree}`).toString().trim(),provenance:'Exact git show <baseline_site_commit>:<path> bytes from the verified Site v92 snapshot; no current-snapshot substitution or JSON reserialization.',encoding:'gzip (level 9); SHA-256 covers both original Git blob bytes and the compressed fixture bytes.',files};
fs.writeFileSync(new URL('manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log(`Wrote ${paths.length} historical v92 fixtures (${Object.values(files).reduce((n,f)=>n+f.gzip_bytes,0)} compressed bytes)`);
