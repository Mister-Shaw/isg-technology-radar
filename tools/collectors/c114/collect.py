"""C114 public daily rolling-news archive; no keyword prefilter. Python stdlib only."""
import concurrent.futures as cf
import datetime as dt
import hashlib
import html
import json
import re
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'output' / 'c114'
RAW = ROOT / 'raw'
RAW.mkdir(parents=True, exist_ok=True)
START = dt.date(2026, 1, 1)
END = dt.date(2026, 9, 20)
SOURCE = 'c114_roll_all'
REFRESH = False
ROW = re.compile(r'<div class="new_list_c"><h6><a href="([^"]+)">(.*?)</a></h6><div class="new_list_c_bot"><div class="new_list_author fl">(.*?)</div><div class="new_list_time fl">(.*?)</div>', re.S)


def clean(s):
    return ' '.join(html.unescape(re.sub('<[^>]+>', '', s)).split())


def fetch(url, filename):
    p = RAW / filename
    if p.exists() and not REFRESH:
        return p.read_bytes().decode('gb18030')
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'PublicResearch/1.0'})
            with urllib.request.urlopen(req, timeout=35) as response:
                content = response.read()
            text = content.decode('gb18030')
            page_title = re.search(r'<title>(.*?)</title>', text, re.S)
            if page_title and re.search(r'captcha|安全验证|访问验证', page_title[1], re.I):
                raise RuntimeError('CAPTCHA/access challenge; no bypass')
            p.write_bytes(content)
            time.sleep(.15)
            return text
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


def daily(day):
    url = f'https://www.c114.com.cn/news/roll.asp?y={day.year}&m={day.month}&d={day.day}'
    log = {'date': str(day), 'url': url, 'complete': False}
    try:
        text = fetch(url, f'roll-{day}.html')
        matches = ROW.findall(text)
        if text.count('<div class="new_list_c">') != len(matches):
            raise RuntimeError('Unparsed archive rows; possible layout change')
        parsed = []
        date_matches = True
        for url, title, origin, day_text in matches:
            stamp = clean(day_text)
            expected = f'{day.month}/{day.day}'
            today=dt.datetime.now(dt.timezone(dt.timedelta(hours=8))).date()
            date_matches &= stamp == expected or (day == today and bool(re.fullmatch(r'\d{1,2}:\d{2}', stamp)))
            article_id = re.search(r'/a(\d+)\.html', url)
            item_id = f'c114-{article_id[1]}' if article_id else 'c114-' + hashlib.sha256(url.encode()).hexdigest()[:16]
            parsed.append({'id': item_id, 'url': url, 'title': clean(title),
                           'date': str(day), 'month': str(day)[:7], 'source_id': SOURCE,
                           'publisher': 'C114通信网', 'origin': clean(origin), 'duplicate_of': None,
                           'entry_kind': 'article' if article_id else 'topic_or_live',
                           'date_basis': '公开滚动资讯按日归档及列表日期', 'archive_url': log['url']})
        fields = dict(re.findall(r'<input[^>]+name="([ymd])"[^>]+value="(\d+)"', text))
        form_matches = fields == {'y': str(day.year), 'm': str(day.month), 'd': str(day.day)}
        container_valid = 'content_c_list' in text and '查看全部' in text and '滚动资讯' in text
        log.update({'total': len(matches), 'date_matches': date_matches, 'form_matches': form_matches,
                    'complete': date_matches and form_matches and container_valid,
                    'pagination': '按日归档，无下一页/加载更多控件',
                    'sha256': hashlib.sha256((RAW / f'roll-{day}.html').read_bytes()).hexdigest()})
        return parsed, log
    except Exception as exc:
        log['error'] = f'{type(exc).__name__}: {exc}'
        return [], log


def write_json(name, data):
    (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


def run():
    days = [START + dt.timedelta(days=n) for n in range((END - START).days + 1)]
    articles, logs = [], []
    with cf.ThreadPoolExecutor(max_workers=3) as pool:
        for rows, log in pool.map(daily, days):
            articles.extend(rows)
            logs.append(log)
            print(log['date'], log.get('total'), log['complete'], flush=True)
    articles.sort(key=lambda a: (a['date'], a['id']))
    seen_urls, seen_titles, id_counts, all_titles = {}, {}, {}, {}
    for a in articles:
        normalized_title = re.sub(r'\W+', '', a['title']).lower()
        title_key = (a['entry_kind'], normalized_title)
        base_id = a['id']
        id_counts[base_id] = id_counts.get(base_id, 0) + 1
        if id_counts[base_id] > 1:
            a['id'] = base_id + '-repeat' + str(id_counts[base_id])
        a['duplicate_of'] = seen_urls.get(a['url']) or seen_titles.get(title_key)
        a['duplicate_all_entries_of'] = seen_urls.get(a['url']) or all_titles.get(normalized_title)
        seen_urls.setdefault(a['url'], a['id'])
        seen_titles.setdefault(title_key, a['id'])
        all_titles.setdefault(normalized_title, a['id'])
        a['duplicate_basis'] = 'exact_normalized_title_first_publication_or_same_url'
    write_json('articles.json', articles)
    write_json('page-log.json', logs)

    # Audit selected-date pages immediately outside the reporting period.
    boundary_logs = [daily(START - dt.timedelta(days=1))[1], daily(END + dt.timedelta(days=1))[1]]
    write_json('boundary-checks.json', boundary_logs)
    # Every month's earliest and latest retained story gets an independent detail-page date check.
    samples = []
    for month in sorted(set(a['month'] for a in articles)):
        subset = [a for a in articles if a['month'] == month]
        samples.extend([subset[0], subset[-1]])
    checks = []
    for a in samples:
        check = {'id': a['id'], 'url': a['url'], 'expected_date': a['date'], 'month': a['month']}
        try:
            text = fetch(a['url'], a['id'] + '.html')
            match = re.search(r'<div class="time">(20\d{2})/(\d{1,2})/(\d{1,2})\s', text)
            if not match:
                match = re.search(r'(20\d{2})/(\d{1,2})/(\d{1,2})\s+\d{1,2}:\d{2}', text)
            actual = str(dt.date(*map(int, match.groups()))) if match else None
            check.update({'actual_date': actual, 'matched': actual == a['date']})
        except Exception as exc:
            check.update({'matched': False, 'error': str(exc)})
        checks.append(check)
    write_json('date-checks.json', checks)
    months = []
    for month in [f'2026-{m:02d}' for m in range(1, 10)]:
        subset = [a for a in articles if a['month'] == month]
        relevant_logs = [l for l in logs if l['date'].startswith(month)]
        relevant_checks = [c for c in checks if c['month'] == month]
        complete = bool(relevant_logs) and all(l['complete'] for l in relevant_logs) and len(relevant_checks) == 2 and all(c['matched'] for c in relevant_checks)
        months.append({'month': month, 'total': len(subset), 'unique': sum(a['duplicate_all_entries_of'] is None for a in subset),
                       'all_entries': {'total': len(subset), 'unique': sum(a['duplicate_all_entries_of'] is None for a in subset)},
                       'article_news': {'total': sum(a['entry_kind'] == 'article' for a in subset), 'unique': sum(a['entry_kind'] == 'article' and a['duplicate_of'] is None for a in subset)},
                       'complete': complete, 'days_requested': len(relevant_logs),
                       'days_success': sum(l['complete'] for l in relevant_logs),
                       'first_date': min((a['date'] for a in subset), default=None),
                       'last_date': max((a['date'] for a in subset), default=None),
                       'partial_calendar_month': month == '2026-09',
                       'note': '所选滚动资讯日归档完整；9月仅截至20日' if month == '2026-09' else '所选滚动资讯日归档逐日连续覆盖；不保证网站从未删文'})
    coverage = {'source_id': SOURCE, 'name': 'C114通信网·滚动资讯全部内容',
                'url': 'https://www.c114.com.cn/news/roll.asp',
                'scope': 'C114公开滚动资讯“查看全部”按日归档，保留所有标题，包括非11类技术、海外、消费终端和转载。并非保证整个网站所有独立栏目均被纳入。',
                'method': '请求2026-01-01至2026-09-20全部263个日归档，不按主题预筛；核对页面日期字段、每条列表日期及每月首末条正文日期；按文章ID及规范化完全相同标题去重。',
                'months': months, 'collected_at': dt.datetime.now(dt.timezone.utc).isoformat(),
                'total': len(articles), 'unique': sum(a['duplicate_all_entries_of'] is None for a in articles),
                'all_entries': {'total': len(articles), 'unique': sum(a['duplicate_all_entries_of'] is None for a in articles)},
                'article_news': {'total': sum(a['entry_kind'] == 'article' for a in articles), 'unique': sum(a['entry_kind'] == 'article' and a['duplicate_of'] is None for a in articles)},
                'article_entries': sum(a['entry_kind'] == 'article' for a in articles),
                'topic_or_live_entries': sum(a['entry_kind'] == 'topic_or_live' for a in articles),
                'date_checks': {'sample_size': len(checks), 'matched': sum(c['matched'] for c in checks)},
                'limitations': ['完整仅指当前可访问滚动资讯归档，不保证网站全站所有栏目或历史已删文章。',
                                '分母保留全部标题；技术提及可另作分子，不能按分子类别筛分母。',
                                '正文只核验18篇月边界样本；其余标题和日期来自日归档。',
                                '同标题去重仅识别完全相同标题，改写/转载跨媒体重复仍需下游处理。',
                                '媒体报道份额代表媒体关注，不直接等同采购或客户采用。',
                                '9月仅截至20日，日历月份尚未结束。']}
    write_json('coverage.json', coverage)
    assert len(logs) == 263
    assert all(a['title'] and a['date'] >= str(START) and a['date'] <= str(END) for a in articles)
    assert len({a['id'] for a in articles}) == len(articles)
    assert all(a['duplicate_of'] != a['id'] for a in articles)
    print(json.dumps({'total': coverage['total'], 'unique': coverage['unique'], 'months': months, 'checks': coverage['date_checks']}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    assert clean('A&nbsp; <b>B</b>') == 'A B'
    run()
