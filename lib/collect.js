import seed from '../data/seed.json' with {type:'json'};
import research from '../data/research-2026.json' with {type:'json'};
import {sourcePanel,sourceForUrl} from '../data/sources.js';
import {safeUrl,validDate} from './model.js';
export const allowedHosts=[...new Set([...seed.map(e=>new URL(e.url).hostname),...research.events.map(e=>new URL(e.url).hostname),...sourcePanel.filter(s=>s.mode!=='license').flatMap(s=>s.hosts)])];
const UA='ISGTechnologyResearch/1.0';
export async function readBytes(response,limit=1000000){
 const r=response.body?.getReader();if(!r)return new Uint8Array();const parts=[];let total=0;
 for(;;){const p=await r.read();if(p.done)break;total+=p.value.byteLength;if(total>limit){await r.cancel();throw Error('400:内容过大，请缩小文件或打开原文手动核验。');}parts.push(p.value);}
 const all=new Uint8Array(total);let n=0;for(const p of parts){all.set(p,n);n+=p.byteLength;}return all;
}
export async function readBounded(response,limit=1000000){return new TextDecoder('utf-8').decode(await readBytes(response,limit));}
export const cleanText=s=>s.replace(/<!--[\s\S]*?-->/g,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>{const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return v>0&&v<=0x10ffff?String.fromCodePoint(v):'';}).replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n').trim();
// Only explicit publication metadata; never infer a date from a URL or search crawl time.
export function publicationDate(html){
 const normalize=s=>{const m=String(s||'').match(/^(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);const d=m?`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`:'';return validDate(d)?d:'';},found=[];
 for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){const attrs=Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m=>[m[1].toLowerCase(),m[2]]));if(/^(article:published_time|datepublished|pubdate|publishdate|publish_date|pub_date|publication_date)$/i.test(attrs.property||attrs.name||attrs.itemprop||''))found.push(normalize(attrs.content));}
 for(const match of html.matchAll(/"datePublished"\s*:\s*"([^"]+)"/g))found.push(normalize(match[1]));
 if(!found.some(Boolean)){const match=cleanText(html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'')).match(/(?:发布日期|发布时间|发稿时间)\s*[:：]?\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2})/);if(match)found.push(normalize(match[1]));}
 const dates=[...new Set(found.filter(Boolean))];return dates.length===1?dates[0]:'';
}
export function extractPage(html,fallback){
 const title=cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||fallback).slice(0,300);
 const stripped=html.replace(/<(script|style|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
 // ponytail: article/main/h1 heuristic, manual review remains required for unusual layouts.
 const article=stripped.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]||stripped.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
 const start=stripped.search(/<h1\b/i),body=article||(start>=0?stripped.slice(start):stripped);
 return{title,published_date:publicationDate(html),excerpt:cleanText(body.replace(/<\/(p|div|li|h\d)>/gi,'\n')).slice(0,16000)};
}
function checkedUrl(input){const url=safeUrl(input);if(!url||!allowedHosts.includes(new URL(url).hostname))throw Error('400:此地址未开放自动采集。请通过原文或文件导入保留线索。');return url;}
export function robotsAllows(text,path){
 const groups=[];let group=null,hasRule=false;
 for(const line of text.split('\n')){const m=line.replace(/#.*$/,'').match(/^\s*([\w-]+)\s*:\s*(.*?)\s*$/);if(!m)continue;const key=m[1].toLowerCase(),value=m[2];
  if(key==='user-agent'){if(!group||hasRule){group={agents:[],rules:[]};groups.push(group);hasRule=false;}group.agents.push(value.toLowerCase());}
  else if(group&&['allow','disallow','crawl-delay'].includes(key)){group.rules.push([key,value]);hasRule=true;}
 }
 const specific=groups.filter(g=>g.agents.some(a=>a!=='*'&&a&&UA.toLowerCase().startsWith(a)));
 const rules=(specific.length?specific:groups.filter(g=>g.agents.includes('*'))).flatMap(g=>g.rules);
 let best=null;
 for(const [key,value] of rules){if(key==='crawl-delay'&&Number(value)>0)return false;if(!value||key==='crawl-delay')continue;
  const regex=value.split('*').map(s=>s.replace(/[.+?^${}()|[\]\\]/g,'\\$&')).join('.*').replace(/\\\$$/,'$');
  if(new RegExp('^'+regex).test(path)&&(!best||value.length>best[1].length||(value.length===best[1].length&&key==='allow')))best=[key,value];
 }
 return best?.[0]!=='disallow';
}
async function fetchPublic(input){
 let url=checkedUrl(input);const options={headers:{'User-Agent':UA},redirect:'manual',signal:AbortSignal.timeout(20000)};
 for(let n=0;n<4;n++){
  const u=new URL(url),robots=await fetch(u.origin+'/robots.txt',options);
  if(robots.status!==404){if(!robots.ok)throw Error('400:无法确认该站点采集规则，请打开原文或导入。');const text=await readBounded(robots,150000);if(/<html/i.test(text))throw Error('400:未取得有效采集规则，请打开原文或导入。');if(!robotsAllows(text,u.pathname+u.search))throw Error('400:站点采集规则限制此页面，请手动核验。');}
  const response=await fetch(url,options);
  if(response.status>=300&&response.status<400){const next=response.headers.get('location');if(!next)throw Error('400:原文跳转地址缺失。');try{url=checkedUrl(new URL(next,url).href);}catch{throw Error('400:原文跳转到未登记地址，请打开原文核验。');}continue;}
  if(!response.ok)throw Error('400:原文暂不可读（'+response.status+'），请打开原文或导入。');
  return{response,url};
 }
 throw Error('400:原文跳转次数过多，请手动核验。');
}
export async function collectPage(input,{listing=false,keyword=''}={}){
 const {response,url}=await fetchPublic(input),type=(response.headers.get('content-type')||'').toLowerCase();
 const base={url,source_id:sourceForUrl(url)?.id||null,captured_at:new Date().toISOString(),automatic_verification:false};
 if(type.includes('application/pdf')){
  if(listing)throw Error('400:此地址为 PDF，请通过原文采集。');const bytes=await readBytes(response,5000000);
  if(new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-')throw Error('400:响应不是有效 PDF 文件。');
  let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return{...base,status:'pdf',title:'PDF 附件',pdf_base64:btoa(binary),message:'PDF 已读取，需提取正文后确认导入。'};
 }
 if(!type.includes('text/html'))throw Error('400:支持公开 HTML 和 PDF；其他文件请导出为 CSV、JSON 或 TXT 后导入。');
 const bytes=await readBytes(response);const head=new TextDecoder().decode(bytes.subarray(0,4096));
 const encoding=(type.match(/charset=([\w-]+)/)?.[1]||head.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1]||'utf-8');
 let html;try{html=new TextDecoder(encoding).decode(bytes);}catch{html=new TextDecoder().decode(bytes);}
 const page=extractPage(html,new URL(url).hostname);
 if(page.excerpt.length<60||(/验证码|人机验证|环境异常|安全验证|captcha|access denied/i.test(page.excerpt)&&page.excerpt.length<1200))throw Error('400:页面为空、动态加载或要求访问验证，请在官方页面查询后导入。');
 if(listing)return{...base,status:'discovered',title:page.title,candidates:extractLinks(html,url,keyword),message:'仅检查当前栏目页的静态链接，不含翻页、动态结果或全部历史；零命中不代表没有需求。'};
 return{...base,...page,status:'fetched'};
}
export function extractLinks(html,base,keyword=''){
 const terms=keyword.trim().toLowerCase().split(/[\s,，|]+/).filter(Boolean),links=new Map();
 // ponytail: one public listing page, no recursive crawl; panel history requires a separate coverage study.
 for(const m of html.matchAll(/<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi)){
  const title=cleanText(m[4]);if(title.length<4||!terms.some(t=>title.toLowerCase().includes(t)))continue;
  let url;try{url=safeUrl(new URL(cleanText(m[1]??m[2]??m[3]),base).href);}catch{continue;}
  if(!url||url===base||links.has(url))continue;
  links.set(url,{title:title.slice(0,300),url,collectable:allowedHosts.includes(new URL(url).hostname),format:new URL(url).pathname.toLowerCase().endsWith('.pdf')?'pdf':'html'});
  if(links.size>=40)break;
 }
 return [...links.values()];
}
