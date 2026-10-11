# Historical regression fixtures

`historical-v92/` contains the exact bytes of the eleven JSON files read by
historical regressions, captured from Site v92 commit
`81b9c61b6eff247c61e250305695fc004cb94f37`. Gzip keeps the standalone GitHub ZIP
compact; decompression does not rewrite JSON. No Git executable, Site commit
history, network connection, or current snapshot fallback is used during tests.

`historical-v92/manifest.json` records the pinned source commit and tree, original
Git blob IDs, uncompressed and compressed byte lengths, and SHA-256 hashes of
both byte streams. `tests/historical-fixture.mjs` verifies those lengths, hashes,
and Git blob IDs before returning independently parsed historical JSON values.
Missing paths and different commits fail explicitly.

The files cover the historical market panel and all three declared expansion
assets, research, the latest update, both afternoon/morning audit data inputs,
the public afternoon audit, report-monitor series, and the IDC March receipt.
Their historical assertions remain pinned while current-data tests can advance.

`idc-march-baseline.json` is the existing compact v90 baseline from Site commit
`2ce8902a26639509ad23012de850fd2b0bf2a434`. Its hashes preserve all prior news,
research fields, unaffected sources, and non-March IDC coverage. The IDC test
compares this baseline with v92, which added the four verified March articles.

To regenerate the v92 fixtures from a checkout that has the original Site
history (not needed to run tests):

```sh
node tests/fixtures/generate-historical-v92.mjs /path/to/site-checkout
```

The generator is pinned to the source commit and includes only referenced files.
It does not read the checkout's working-tree JSON files.

`report-measurement-v93-baseline.json` contains only canonical SHA-256 hashes
of the report fields and existing conflict records retained by v94, captured
from Site commit `af997aaac17f3d91a20d036ecca699cc991c5ada`. It does not copy the
two superseded conflict claims. The measurement-scope test verifies preserved
observations/provenance against these hashes without requiring v93 Git history.
