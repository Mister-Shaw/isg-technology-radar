import assert from 'node:assert/strict';
import {sourcePanel,sourceForUrl,CATEGORIES} from '../data/sources.js';

const added={
 eet_china:['wechat','public',['www.eet-china.com','eet-china.com']],
 trendforce:['wechat','public',['www.trendforce.cn','trendforce.cn','www.trendforce.com.tw','trendforce.com.tw']],
 zhidx:['wechat','public',['zhidx.com','www.zhidx.com']],
 shanghai_drc:['projects','public',['fgw.sh.gov.cn']],
 gt_procurement:['operators','public',['cg.gt.cn']],
 gds_ir:['disclosures','public',['investors.gds-services.com']],
 hkex:['disclosures','public',['www.hkexnews.hk','hkexnews.hk']],
 jiangsu_ggzy:['procurement','manual',['jsggzy.jszwfw.gov.cn']],
 zycg:['procurement','manual',['www.zycg.gov.cn','zycg.gov.cn']],
 zzcg:['procurement','manual',['www.zzcg.gov.cn','zzcg.gov.cn']],
};
assert.equal(sourcePanel.length,130);
assert.equal(new Set(sourcePanel.map(s=>s.id)).size,130);
assert.equal(Object.keys(added).length,10);
for(const [id,[category,mode,hosts]] of Object.entries(added)){
 const source=sourcePanel.find(s=>s.id===id);
 assert(source,id);assert.equal(source.category,category,id);assert.equal(source.mode,mode,id);
 assert(CATEGORIES[source.category]);assert.equal(sourceForUrl(source.url)?.id,id);
 for(const host of hosts)assert.equal(sourceForUrl(`https://${host}/test-source`)?.id,id,host);
 assert.match(source.note,/不镜像全文/,id);
 if(mode==='manual')assert.match(source.note,/自动读取尚未确认可用/,id);
}
const idc=sourcePanel.filter(s=>s.id==='idcquan');
assert.equal(idc.length,1);
assert(!sourcePanel.some(s=>s.id==='idcquan_expanded'));
for(const host of ['news.idcquan.com','www.idcquan.com','cloud.idcquan.com','dc.idcquan.com'])assert.equal(sourceForUrl(`https://${host}/test`)?.id,'idcquan');
// Registry matching remains an exact hostname match, never suffix or query matching.
assert.equal(sourceForUrl('https://www.eet-china.com.evil.example/'),null);
assert.equal(sourceForUrl('https://evil.example/?source=https://www.hkexnews.hk/'),null);
assert.equal(sourceForUrl('not a URL'),null);
console.log('PASS: 130 distinct sources, ten scoped additions, exact host attribution, conservative manual modes, and one expanded IDC publisher');
