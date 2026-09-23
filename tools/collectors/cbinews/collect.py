"""Collect the complete public lists of all 12 CBI main-navigation news sections.

No keyword or technology filters. Standard library only. Cached response replay is
the default; pass --refresh to replace cached public responses.
"""
import concurrent.futures
import datetime as dt
import html
import json
from pathlib import Path
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent.parent / 'output' / 'cbinews'
RAW = ROOT / 'raw'
RAW.mkdir(parents=True, exist_ok=True)
START, END = '2026-01-01', '2026-09-20'
SOURCE = 'cbinews_all_news'
CATS = [(623,'行业资讯','VAR'),(56,'存储','storage'),(694,'人工智能','AI'),
        (705,'物联网','IoT'),(667,'融合架构','Onemachine'),(688,'数据中心','IDC'),
        (664,'云计算','cloud'),(696,'网络与安全','net'),(55,'软件与服务','software'),
        (50,'智能终端','desktop'),(622,'生态伙伴','channel'),(702,'数字化转型','digital')]
REFRESH = '--refresh' in sys.argv


def save(name, data):
    (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


def fetch(url, filename, payload=None):
    path = RAW / filename
    if path.exists() and not REFRESH:
        return path.read_text(encoding='utf-8')
    request = urllib.request.Request(url, data=json.dumps(payload).encode() if payload else None,
        headers={'Content-Type':'application/json', 'User-Agent':'ISGMarketResearch/1.0 public-news-audit',
                 'Referer':'https://www.cbinews.com/'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                body = response.read().decode('utf-8')
            if 'aliyun_waf_' in body or '<title>验证码' in body:
                raise ValueError('Access verification, stopped without bypass')
            path.write_text(body, encoding='utf-8')
            time.sleep(.2)
            return body
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1 + attempt)


def collect_category(cat):
    cid, name, slug = cat
    rows, pages, earlier, errors, id_errors = [], [], [], [], []
    previous_date = '9999-99-99'
    previous_id, prior_year_pages = float('inf'), 0
    for page in range(1, 1001):
        payload = {'cat_id':cid, 'page':page, 'pageSize':21}
        response = json.loads(fetch('https://api.cbinews.com/api/cate_list',
                                   f'category-{cid}-page-{page:03}.json', payload))
        assert response['code'] == 0, response
        entries = response['data']['list']
        assert isinstance(entries, list)
        dates = [x['created_at'][:10] for x in entries]
        for entry in entries:
            if entry['id'] > previous_id:
                id_errors.append(f"non-descending id: {entry['id']} after {previous_id}, page {page}")
            previous_id = entry['id']
        for date in dates:
            if date > previous_date:
                errors.append(f'non-descending date: {date} after {previous_date}, page {page}')
            previous_date = date
        pages.append({'page':page,'rows':len(entries),'first_date':dates[0] if dates else None,
                      'last_date':dates[-1] if dates else None,
                      'reported_all_history_total':response['data']['total']})
        for item in entries:
            date = item['created_at'][:10]
            if START <= date <= END:
                rows.append({**item, 'date':date, 'category_id':cid, 'category_name':name})
            elif date < START:
                earlier.append({k:item[k] for k in ('id','title','url','created_at')})
        # Public list follows article ID, not strictly publication date. Two complete
        # prior-year pages guard against small editorial date shifts at the boundary.
        prior_year_pages = prior_year_pages + 1 if dates and max(dates) < START else 0
        if not entries or prior_year_pages >= 2:
            break
    else:
        raise RuntimeError('Page cap reached before year boundary')
    result = {'category_id':cid,'name':name,'url':'https://www.cbinews.com/'+slug,
              'pages':pages,'earlier_boundary_records':earlier,
              'complete':bool(earlier) and not id_errors,'ordering_errors':errors,
              'id_ordering_errors':id_errors,'complete_prior_year_pages':prior_year_pages}
    print(f'{name}: {len(rows)} period rows; {len(pages)} pages; boundary {previous_date}', flush=True)
    return rows, result


def title_key(value):
    return re.sub(r'[\W_]+','',unicodedata.normalize('NFKC',html.unescape(value)).lower())


def audit_article(item):
    body = fetch(item['url'], 'article-'+item['id']+'.html')
    plain = html.unescape(re.sub(r'<[^>]+>', ' ', body))
    heading = re.search(r'<h1[^>]*>(.*?)</h1>', body, re.S)
    title = html.unescape(re.sub(r'<[^>]+>', '', heading.group(1))).strip() if heading else None
    result = {'id':item['id'],'url':item['url'],'expected_title':item['title'],
              'expected_date':item['date'],'h1':title,
              'title_matches':title_key(title or '')==title_key(item['title']),
              'date_in_body':item['date'] in plain,
              'visible_text_chars':len(plain),
              'cache':'raw/article-'+item['id']+'.html'}
    return result


def main():
    # Public main navigation was inspected before fixing this source frame.
    fetch('https://www.cbinews.com/','homepage.html')
    all_rows, category_coverage = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for rows, result in pool.map(collect_category, CATS):
            all_rows.extend(rows)
            category_coverage.append(result)
    unique_ids = {}
    for x in all_rows:
        aid = 'cbinews-'+str(x['id'])
        url = urllib.parse.urljoin('https://www.cbinews.com/', x['url'])
        if aid in unique_ids:
            assert unique_ids[aid]['date'] == x['date'] and unique_ids[aid]['title'] == x['title']
            unique_ids[aid]['archive_categories'].append(x['category_name'])
        else:
            unique_ids[aid] = {'id':aid,'url':url,'title':html.unescape(x['title']),
                'date':x['date'],'month':x['date'][:7],'source_id':SOURCE,
                'publisher':'电脑商情在线','duplicate_of':None,'archive_categories':[x['category_name']]}
    articles = sorted(unique_ids.values(), key=lambda x:(x['date'],x['id']))
    keys = {}
    for x in articles:
        key = title_key(x['title'])
        x['duplicate_of'] = keys.get(key)
        keys.setdefault(key,x['id'])
    months = []
    selected = []
    complete = all(x['complete'] for x in category_coverage)
    for m in range(1,10):
        month = f'2026-{m:02}'
        rows = [x for x in articles if x['month']==month]
        months.append({'month':month,'total':len(rows),'unique':sum(x['duplicate_of'] is None for x in rows),
                       'complete':complete,'note':'连续抓取全部12栏目；九月截至20日，非完整自然月' if m==9 else '连续抓取全部12栏目至2025年边界'})
        if rows:
            selected.extend((rows[0],rows[-1]))
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        body_audit = list(pool.map(audit_article,selected))
    assert all(x['title_matches'] and x['date_in_body'] for x in body_audit), body_audit
    assert len({x['url'] for x in articles}) == len(articles)
    assert len(months)==9 and all(x['total']>0 for x in months)
    assert all(START<=x['date']<=END for x in articles)
    save('articles.json',articles)
    save('category-coverage.json',category_coverage)
    save('body-audit.json',body_audit)
    save('coverage.json',{'source_id':SOURCE,'name':'电脑商情在线（全部12新闻栏目）',
        'url':'https://www.cbinews.com/','scope':'官网主导航12个新闻栏目全集并集，包含所有主题；不包含活动报名、视频、白皮书资料库及未在这12栏目中公开的内容。不是首页精选。',
        'method':'从官网公开分页接口 cate_list 按其默认21条/页、文章ID倒序连续回溯12栏目，直至每栏读取两个完整的2025年页（或栏目历史已穷尽）；不使用关键词检索、不按技术预筛。先按文章ID跨栏目合并，再对规范化完全相同标题标记 duplicate_of。',
        'months':months,'collected_at':dt.datetime.now(dt.timezone.utc).isoformat(),
        'date_start':START,'date_end':END,'article_count':len(articles),
        'unique_count':sum(x['duplicate_of'] is None for x in articles),'complete':complete,
        'limitations':['完整性指公开12栏目分页中可读的存续文章，不等同于该媒体历史上从未删除或未列出的全部文章。',
            '来源为IT行业媒体，包含全球新闻、转述和厂商发布，不能据此直接推断国内购买接受率。',
            '标题识别会漏掉仅正文出现的技术；本次仅逐月首末文章核对正文标题和日期，未采集全部正文。',
            '九月截至20日；各月按来源完整新闻数作为分母，主题未命中新闻仍保留。',
            '同标题去重仅为严格文字去重，并不等于按现实事件去重。'],
        'audit':{'category_count':12,'boundary_verified_count':sum(x['complete'] for x in category_coverage),
                 'body_checked_count':len(body_audit),'body_checks_passed':True,
                 'date_order_anomalies':[{'category':x['name'],'warnings':x['ordering_errors']} for x in category_coverage if x['ordering_errors']]}})
    print(json.dumps({'total':len(articles),'unique':sum(x['duplicate_of'] is None for x in articles),'months':months},ensure_ascii=False),flush=True)


if __name__=='__main__':
    assert title_key('ＡＩ： Test!') == title_key('ai test')
    main()
