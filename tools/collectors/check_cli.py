"""Offline checks: argument validation, output containment, and title boundaries."""
import contextlib
import importlib.util
import io
from pathlib import Path
from unittest.mock import patch

BASE = Path(__file__).resolve().parent

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

refresh = load('refresh_media', BASE / 'refresh-media.py')
valid = ['--start', '2026-09-07', '--end', '2026-09-23', '--cutoff', '2026-09-20']
args = refresh.parse_args(valid + ['--output', 'output/check-run'])
assert args.output == BASE / 'output/check-run'
assert args.start < args.cutoff < args.end
for override in [
    ['--start', '2026-02-30'],
    ['--start', '20260907'],
    ['--start', '2026-09-24'],
    ['--cutoff', '2026-09-24'],
    ['--cutoff', '2026-09-06'],
    ['--output', '../outside'],
]:
    with contextlib.redirect_stderr(io.StringIO()):
        try:
            refresh.parse_args(valid + override)
        except SystemExit as error:
            assert error.code == 2
        else:
            raise AssertionError(f'Invalid arguments accepted: {override}')
rules = load('doit_rules', BASE / 'doit/collect_news.py')
rules.self_check()
assert not rules.classify('Example unrelated consumer news', '')['eligible']
refresh.START,refresh.END='2026-09-07','2026-09-23'
rows=[{'id':str(i),'title':title,'date':'2026-09-20','source_id':'doit_all','url':f'https://www.doit.com.cn/{i}.html'}
      for i,title in enumerate(['Example unrelated consumer news','中国移动采购海光CPU液冷服务器'])]
enriched=refresh.enrich(rows,'doit_all')
assert len(enriched)==2 and not enriched[0]['eligible'] and enriched[0]['categories']==[]
assert enriched[1]['categories']==['liquid_cooling'] and 'hyg_cpu' in enriched[1]['tags']
assert enriched[1]['market_scope']=='china_explicit' and enriched[1]['scope']=='china_explicit'
assert enriched[1]['context_class']=='other' and enriched[1]['title_context_class']=='procurement_discussion'
assert not enriched[1]['application_reviewed'] and not enriched[1]['full_text_verified']
assert all(enriched[1][key]==[] for key in ['eligible_categories','required_categories','unknown_categories'])
for override in [{'source_id':'other'},{'date':'2026-09-24'},{'date':'2026-02-30'},{'url':'javascript:alert(1)'},{'title':''}]:
    try:refresh.enrich([{**rows[0],**override}],'doit_all')
    except ValueError:pass
    except refresh.argparse.ArgumentTypeError:pass
    else:raise AssertionError(f'Invalid article accepted: {override}')
for body in [b'User-agent: *\nDisallow: /',b'<html>Access challenge</html>']:
    with patch.object(refresh.urllib.request,'urlopen',return_value=io.BytesIO(body)):
        try:refresh.check_robots('https://example.org/news')
        except RuntimeError:pass
        else:raise AssertionError('Disallowed/challenged robots accepted')
with patch.object(refresh.urllib.request,'urlopen',side_effect=TimeoutError('offline')):
    try:refresh.collect('doit',lambda:(_ for _ in ()).throw(AssertionError('Collector must not run')))
    except TimeoutError:pass
    else:raise AssertionError('Unknown robots status accepted')
print('Offline CLI and title-boundary checks passed; no network requests made.')
