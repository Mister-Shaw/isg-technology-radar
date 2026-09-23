# 历史构建脚本与当前维护

`scripts/build-market-panel.mjs` 保留 2026-09-21 的原始面板构建算法。它不是新版本固定新闻全量采集器，也不包含后续 2026-09-23 的修订与增量，不能直接覆盖当前公开面板。

历史构建需要采集者另行提供当时的原始输入目录，未随本仓库再分发第三方网页缓存和整套历史采集附件：

```text
source-expansion-2026-09-21/classified.json
comparable-measures-2026-09-21/
  news-panel-v2/articles.json
  news-panel-v2/coverage.json
  news-panel-v2/classification-rules.json
  procurement-panel/documents.json
  procurement-panel/coverage.json
```

将 `RADAR_HISTORICAL_INPUT` 环境变量设为其中的 `comparable-measures-2026-09-21` 绝对路径，再执行 `node scripts/build-market-panel.mjs --historical`。输出只写入 `artifacts/historical/`，不会覆盖站点数据。没有这些历史输入时，脚本会明确退出。

正常本地运行直接使用仓库附带的当前 `public/market-panel.json`，不需要历史重建。当前维护流程见 [每周更新](../WEEKLY_UPDATE.md)，可复用采集器见 [tools/collectors](../tools/collectors/README.md)。
