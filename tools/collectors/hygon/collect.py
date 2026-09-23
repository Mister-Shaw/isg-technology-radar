"""Record Hygon news-source coverage without inventing an enumerable archive."""
import argparse, datetime, hashlib, json, pathlib, re, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'output' / 'hygon'
ENTRY = 'https://www.hygon.cn/'
ROBOTS = 'http://www.hygon.cn/robots.txt'

def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--refresh-robots',action='store_true'); args=parser.parse_args()
    cache = ROOT/'cache'; cache.mkdir(parents=True,exist_ok=True)
    path = cache/'robots.txt'
    if args.refresh_robots or not path.exists():
        with urllib.request.urlopen(urllib.request.Request(ROBOTS,headers={'User-Agent':'PublicResearch/1.0'}),timeout=20) as response:
            path.write_bytes(response.read())
    robots = path.read_text(encoding='utf-8')
    blocked = bool(re.search(r'User-agent:\s*\*\s+Disallow:\s*/\s',robots,re.I))
    # No publisher HTML or JavaScript is bundled or replayed in this source export.
    files, older_dates, model = {}, [], ''
    note='历史复核未建立可枚举的2026新闻目录；本脚本仅核对公开robots入口，不重新验证新闻目录，也不采集正文或枚举文档编号。当前robots结果见robots_disallow_all。缺失不可记作0。'
    coverage={'source_id':'hygon_official','name':'海光官网新闻','url':ENTRY,'scope':'vendor_official_news_source_unavailable_for_complete_census','source_type':'vendor_official','method':'Manual 2026-09-21 review did not establish an enumerable news archive. This exported probe only checks robots.txt; it does not recheck routes, enumerate document IDs, or establish current news coverage.','months':[{'month':f'2026-{m:02d}','total':None,'unique':None,'complete':False,'note':note} for m in range(1,10)],'collected_at':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat(),'limitations':['This is a coverage failure, not evidence of zero Hygon news or zero market activity.','The historical review stopped collection; inspect robots_disallow_all for this run rather than assuming the rule is unchanged.','The individual-document React route is not a complete news listing.','Publisher HTML and JavaScript evidence are not bundled; this probe does not establish news coverage.','Investor disclosures, third-party articles and social accounts are different sources and were not substituted for the official-news denominator.'],'robots_url':ROBOTS,'robots_disallow_all':blocked,'cached_component_dates':older_dates,'single_document_loader_observed':'docs/doc_' in model,'cached_resources':files,'catalogue_complete':False,'window_count':0}
    assert all(m['total'] is None and m['complete'] is False for m in coverage['months'])
    (ROOT/'articles.json').write_text('[]\n',encoding='utf-8')
    (ROOT/'coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'source':'hygon_official','robots_disallow_all':blocked,'2026_archive_complete':False,'old_component_dates':older_dates},ensure_ascii=False))

if __name__=='__main__':main()
