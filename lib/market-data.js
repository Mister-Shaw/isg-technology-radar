// Expansion cohorts are separate assets so each hosted file stays below size limits.
export function mergeMarketAssets(base,parts=[]){
 const documents=[...base.documents],ids=new Set(documents.map(r=>r.id));
 for(const part of parts){
  if(!Array.isArray(part.documents))throw Error('扩展来源数据格式无效');
  for(const row of part.documents){if(ids.has(row.id))throw Error('扩展来源记录重复');ids.add(row.id);documents.push(row);}
 }
 return {...base,documents};
}
export async function loadMarketData(fetcher=fetch){
 const read=async path=>{const response=await fetcher(path);if(!response.ok)throw Error('来源样本数据暂时无法读取');return response.json();};
 const base=await read('/market-panel.json');
 const paths=base.expansion_assets||[];
 if(paths.some(p=>!/^\/market-expansion(?:-\d+)?\.json$/.test(p)))throw Error('扩展来源地址无效');
 return mergeMarketAssets(base,await Promise.all(paths.map(read)));
}
