"""Enumerate the public Kunpeng news catalogue using its own frontend API."""
import argparse, concurrent.futures, datetime, hashlib, json, math, pathlib, re, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'output' / 'kunpeng'
START, END = '2026-01-01', '2026-09-20'
ENTRY = 'https://www.hikunpeng.com/zh/activities/news'
API = 'https://www.hikunpeng.com/kunpenggateway/kunpengservice/news/data/list/zh'

def page(number, refresh=False):
    url = API + '?' + urllib.parse.urlencode({'pageNo': number, 'pageSize':36, 'lang':'zh', 'page':5, 'domainCode':''})
    path = ROOT / 'cache' / f'page-{number:03d}.json'
    if path.exists() and not refresh:
        data = path.read_bytes()
    else:
        req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0', 'Referer': ENTRY, 'Origin':'https://www.hikunpeng.com'})
        with urllib.request.urlopen(req, timeout=30) as res:
            data = res.read()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    result = json.loads(data)
    assert result.get('code') == 200, result.get('msg')
    info = result['data']['pageInfo']
    return info, {'page':number, 'url':url, 'count':len(info['list']), 'reported_total':info['totalCount'], 'sha256':hashlib.sha256(data).hexdigest()}

def main():
    p = argparse.ArgumentParser(); p.add_argument('--refresh', action='store_true'); args = p.parse_args()
    ROOT.mkdir(parents=True, exist_ok=True)
    first, log = page(1, args.refresh)
    count = math.ceil(first['totalCount'] / 36)
    data, logs, errors = list(first['list']), [log], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        jobs = {i:executor.submit(page, i, args.refresh) for i in range(2, count + 1)}
        for number, job in jobs.items():
            try:
                info, log = job.result(); data.extend(info['list']); logs.append(log)
            except Exception as e: errors.append({'page':number, 'error':str(e)})
    ids, articles, duplicate_ids = set(), [], []
    for raw in data:
        key, date = str(raw['newsId']), raw['publishTime'][:10]
        if key in ids: duplicate_ids.append(key); continue
        ids.add(key)
        assert re.fullmatch(r'\d{4}-\d{2}-\d{2}', date)
        if not START <= date <= END: continue
        articles.append({'id':'kunpeng-'+key, 'url':raw.get('newsRemoteLink') or f'https://www.hikunpeng.com/zh/activities/dynamic-news/{urllib.parse.quote(key)}', 'catalogue_url':ENTRY, 'official_detail_url':f'https://www.hikunpeng.com/zh/activities/dynamic-news/{urllib.parse.quote(key)}', 'title':raw['newsTitle'].strip(), 'date':date, 'month':date[:7], 'source_id':'kunpeng_official', 'publisher':'鲲鹏社区（华为）', 'source_type':'vendor_official', 'duplicate_of':None, 'date_basis':'official_catalogue_publishTime', 'news_domain':raw.get('domainName'), 'full_text_verified':False})
    seen = {}
    for r in sorted(articles, key=lambda x:(x['date'],x['id'])):
        title = re.sub(r'\W+', '',r['title']).lower()
        r['duplicate_of'] = seen.get(title); seen.setdefault(title,r['id'])
    newest = max((r['publishTime'][:10] for r in data), default=None)
    catalogue_complete = not errors and len(ids) == first['totalCount'] and len(logs) == count
    months = []
    for month in [f'2026-{m:02d}' for m in range(1,10)]:
        selected = [r for r in articles if r['month']==month]
        recency_gap = bool(newest and month >= newest[:7])
        note = '当前公开目录已遍历；该月未见新闻不代表厂商未发声。'
        if recency_gap: note = f'当前目录最新发布日期停在{newest}，不足以确认本月持续更新完整；不得把缺更新当作市场零值。'
        months.append({'month':month,'total':len(selected),'unique':sum(r['duplicate_of'] is None for r in selected),'complete':catalogue_complete and not recency_gap,'note':note})
    coverage = {'source_id':'kunpeng_official','name':'鲲鹏社区官方新闻目录','url':ENTRY,'scope':'vendor_official_news_catalogue_only','source_type':'vendor_official','method':'Public frontend /news/data/list/zh endpoint, all domainCode values, 36 items per page; enumerate every reported page and reconcile totalCount; no keyword prefilter.', 'months':months, 'collected_at':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat(), 'catalogue_total_reported':first['totalCount'],'catalogue_unique_ids':len(ids),'catalogue_complete':catalogue_complete,'window_count':len(articles),'latest_catalogue_date':newest,'date_range':[START,END],'page_log':logs,'duplicate_ids':duplicate_ids,'errors':errors,'limitations':['Only this official news directory, not all Huawei press releases, ecosystem sites or WeChat posts.','Vendor voice is separate from independent media and buyer demand.','Some official records link to WeChat or event pages; the directory title and date were collected, destination full text was not verified.','Catalogue stops updating before the analysis cutoff; recent month completeness is not claimed.','Complete months mean currently accessible catalogue traversal only, not historical absence of deletion.']}
    assert len({r['id'] for r in articles}) == len(articles)
    assert sum(m['total'] for m in months) == len(articles)
    for name,obj in [('articles.json',articles),('coverage.json',coverage),('catalogue-all.json',data)]:
        (ROOT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'window':len(articles),'catalogue':len(ids),'complete':catalogue_complete,'latest':newest,'months':months},ensure_ascii=False))

if __name__ == '__main__': main()
