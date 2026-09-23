"""Offline checks: argument validation, output containment, and title boundaries."""
import contextlib
import importlib.util
import io
from pathlib import Path

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
print('Offline CLI and title-boundary checks passed; no network requests made.')
