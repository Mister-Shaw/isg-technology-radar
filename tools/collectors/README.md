# Public-source collectors

These Python standard-library scripts preserve the research collectors used for the September 2026 snapshot. Python 3.10 or later is required. For automated media collection, merging, coverage checks, backups and monitoring, use `npm run update` from the repository root; see [WEEKLY_UPDATE.md](../../WEEKLY_UPDATE.md). Publisher endpoints, page structures, coverage limits, and permissions can change.

All generated data, downloaded responses, and local caches go under the ignored `tools/collectors/output/` directory. No publisher HTML/JavaScript archives, private browser data, credentials, or hosting settings are included. Existing cached responses can contain publisher content; do not commit that output directory.

## Refresh a chosen media window

From the repository root:

```sh
python tools/collectors/refresh-media.py --start 2026-01-01 --end 2026-09-20 --cutoff 2026-09-20 --output output/2026-09-23
```

This manually requests DOIT, C114, CBINews, and Zhiding public lists again, retains all news topics, and writes per-source audits plus `media-refresh.json`. It never prefilters the news denominator by technology keywords. Dates must satisfy `start <= cutoff <= end`. The output path is relative to the collectors folder and must remain under its `output/` directory.

`cutoff` records the completed-period boundary: documents after that date remain in the file as previews. Downstream analysis must separate them from completed-period figures. The script does not merge results into the app, deduplicate real-world events across publishers, verify full article bodies, or publish/deploy anything. A failed source or an unreached pagination boundary makes the command exit with status 1 after saving available results. Inspect each source's `complete` value; even a completed traversal only covers the currently accessible archive.

The automated updater always requests the entire research window, starting at market-panel.json window.start. DOIT and Zhiding paginate until a whole page is older than that start; repeated pages, unexpected empty pages, request failures and a 55-minute per-source deadline fail explicitly. C114 checks every calendar day. CBINews retains a 1,000-page per-section safety limit and fails if reached. Completed traversal describes the current public archive; it does not prove the absence of deleted history. A shorter diagnostic collection cannot be applied as a full update.

## Original fixed-window collectors

The original collectors retain the **2026-01-01 through 2026-09-20** reporting window, monthly labels, and manual validation assumptions. Changing those constants alone does not update every coverage assertion or narrative; maintain them together before reusing the full-window collectors for another period.

| Script | Scope and behavior |
| --- | --- |
| `doit/collect_news.py` | Whole-site public article list; `--refresh` replaces its cache; `--check` runs classification assertions offline. |
| `c114/collect.py` | Daily rolling archive, all topics; cached responses are reused. |
| `cbinews/collect.py` | All 12 enumerated main-navigation news sections; `--refresh` replaces its cache. |
| `zhiding/collect.py` | Latest-article stream, all topics; cached responses are reused. |
| `kunpeng/collect.py` | Vendor's public official-news catalogue; `--refresh` replaces its cache. Keep official vendor voice separate from media. |
| `hygon/collect.py` | Coverage-gap probe only; `--refresh-robots` reloads robots.txt. It does not enumerate or crawl Hygon news. Missing coverage is not zero news. Historical route observations are not revalidated by this probe. |
| `classify.py` | Reads the fixed-window source outputs from `output/`, applies the shared DOIT title dictionary, and writes `classified.json` plus `integration-audit.json`. Run it only after reviewing those source outputs. |

Example fixed-window usage:

```sh
python tools/collectors/doit/collect_news.py --refresh
python tools/collectors/cbinews/collect.py --refresh
python tools/collectors/classify.py
```

The classifier combines the five expansion sources; DOIT remains in its own output. Non-technology news stays in the denominator. Exact-title duplicates are linked within each source, and non-article topic/live/landing pages are excluded by document type. The legacy coverage field called `eligible` in `classified.json` is the count of unique news titles of all topics, not the number of technology matches. Classification is a title-based screen, not evidence of purchasing, deployment, or adoption. The optional DOIT `application-review.json` is not shipped; absent reviews stay pending.

## Offline verification

```sh
python tools/collectors/check_cli.py
python -m compileall -q tools/collectors
```

These checks validate arguments, output containment, syntax, title boundaries and failed collection handling without network access. Full-history pagination checks also cross the former 30/150-page limits and verify mixed-date boundaries, repeated/empty pages, timeouts and incomplete day coverage. Live batch results are recorded in weekly-runs; they do not guarantee future endpoint availability.
