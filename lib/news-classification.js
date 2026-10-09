// Reconstructed from the site's saved title-only rules. Existing reviewed rows
// are preserved; this function is used for newly collected archive titles.
export const normalizedNewsTitle=title=>String(title).toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function classifyNewsTitle(title,rules){
 const hit=p=>new RegExp(p,'i').test(title);
 const categories=Object.entries(rules.technology_patterns).filter(([,p])=>hit(p)).map(([k])=>k);
 const eligible=categories.length>0||(hit(rules.scope_positive)&&!hit(rules.consumer_title_exclusion));
 const market_scope=hit(rules.foreign_title_exclusion)?(hit('中国|国内|国产|我国')?'unknown':'global'):hit(rules.china_explicit)?'china_explicit':'unknown';
 const tags=[];
 if(hit('海光|\\bHygon\\b')){tags.push('hygon_unspecified');if(hit('海光.{0,10}CPU|Hygon.{0,10}CPU'))tags.push('hyg_cpu');if(hit('海光.{0,10}DCU|深算.{0,10}(?:芯片|卡)'))tags.push('hyg_dcu');}
 if(hit('鲲鹏|\\bKunpeng\\b'))tags.push('kunpeng');
 if(hit('昇腾|\\bNPU\\b'))tags.push('npu_not_gpu');
 if(hit('token|词元|令牌')&&!categories.includes('token_factory'))tags.push('token_discussion_not_factory');
 return {eligible,market_scope,categories,tags,classification_note:eligible?'仅按标题识别；未出现技术词不代表正文未涉及。':'outside_server_infrastructure_scope'};
}
