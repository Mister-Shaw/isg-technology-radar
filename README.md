# ISG 技术情报台

中国大陆服务器新技术的研究工作台：查看月度证据、市场风向、项目进展与来源，维护研究笔记，导入 CSV / JSON / TXT / PDF，导出研究数据。

[源码与问题反馈](https://github.com/Mister-Shaw/isg-technology-radar) · [公开演示](https://isg-technology-radar.shaw-gale.chatgpt.site)

本仓库可独立在本机运行，无需 ChatGPT、Sites 或 Cloudflare 账号，也不需要 API 密钥。安装依赖需要访问公共 npm；按需读取来源网页需要联网。

## 本地启动

准备 Node.js 22.13 或更高版本、npm 和 Git。以下命令在 Windows PowerShell、macOS 和 Linux 终端中相同：

```sh
git clone https://github.com/Mister-Shaw/isg-technology-radar.git
cd isg-technology-radar
npm ci
npm run db:init
npm run dev
```

打开 <http://127.0.0.1:5173>。服务默认只监听本机。无需登录即可编辑这份本地数据库；不同电脑的副本彼此独立，保存操作不会同步到公开演示站。

`db:init` 使用 Cloudflare 的本地 D1 模拟器创建数据库表并记录已执行的迁移；终端若提示确认迁移，输入 `y`。重复运行只应用尚未执行的迁移，不清空已有数据。配置中的全零数据库 ID 是本地占位值，不是线上数据库凭据。不要给命令增加 `--remote`。

如果首次打开后提示操作失败，先确认 `npm run db:init` 已成功；只有启动网页不会自动建表。依赖包含本地运行时，安装时请保留开发依赖及可选依赖。

## 构建后运行

开发服务停止后，可在同一目录运行构建版本：

```sh
npm run build
npm start
```

打开 <http://127.0.0.1:8787>。`npm start` 同样只运行本地服务，需要先完成安装、数据库初始化和构建；它与开发服务共用本目录的数据库。首次启动请以终端显示的实际地址为准。

## 数据与备份

- 仓库包含公开研究的静态快照和来源清单。数据截止日以页面和数据文件为准，克隆日期不代表采集日期。仓库不附带线上数据库、访客编辑、个人笔记、采集日志或完整修改历史。
- `data/research-2026.json` 是研究底稿；首次访问空的工作记录分区时，`data/seed.json` 的基础记录写入本地数据库。已有记录不会被再次播种覆盖。
- 研究编辑以覆盖层保存在本地数据库，并保留修订历史；未编辑的底稿字段继续来自研究文件。更新源码或重新构建不会清空本地编辑，但替换研究底稿会影响未被覆盖的内容，更新前应备份。
- 本地数据库存放在 `.wrangler/state/`，已排除在 Git 之外。完整保留数据库及历史时，先停止服务，再复制这个目录到自己的备份位置。不要提交数据库或个人资料。
- 页面上的 JSON / CSV 下载适合研究资料交换。JSON 下载不包含全部数据库历史，不能代替完整数据库备份；结构化导入也不是数据库恢复工具。

公开报道、索引、待核线索、已核事实和研究判断分别标记。金额保留预算、成交、合同、总投资等口径；分类重叠，部分月份不完整，新闻占比不等于采用率或市场份额。

## 维护与检查

```sh
npm test
npm run build
```

`npm test` 运行本地的 9 组数据、导入、分类、金额、日期及迁移回归检查，不访问演示站，也不写本地工作数据库。新增底稿时保留历史基线的回归测试，并增加相应的数据一致性检查。

本地开发服务运行时，可做只读页面与接口检查：

```sh
node scripts/check-public-access.mjs http://127.0.0.1:5173
```

`tests/http-smoke.mjs`、`tests/unified-http.mjs`、`tests/import-http.mjs` 是额外的本地接口测试，会写入测试数据、修订或历史，只在可丢弃的本地数据库上运行，不用于线上站点。

数据库结构位于 `db/schema.ts`，迁移位于 `drizzle/`。修改结构后使用 `npm run db:generate` 生成并审核迁移，再运行 `npm run db:init` 应用到本地数据库。更多协作约定见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 数据更新范围

克隆仓库不会创建每周定时任务，也不会继承原维护者的 Codex 自动化。页面中的历史批次及异动结论是随仓库提供的研究记录。

可在本地使用来源中心读取允许访问的公开网页，或手动导入和核验资料。来源目录表示登记的检索入口，不承诺全国全量覆盖；不会绕过登录、验证码或付费限制。

[WEEKLY_UPDATE.md](WEEKLY_UPDATE.md) 说明每周研究流程与口径。历史采集器、外部研究包和发布编排不属于一个开箱即用的自动流水线；部分历史脚本依赖仓库外的原始资料。`scripts/weekly-monitor.mjs` 根据已有数据计算监测草稿，本身不采集新数据、不安排定时任务、不发布网站。运行任何历史数据生成脚本前，先检查其输入路径和输出行为，并保留本地编辑。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| `app/` | 页面、图表、编辑与 API |
| `lib/` | 数据统一视图、核验、金额与分类规则 |
| `data/` | 研究快照、来源与监测规则 |
| `public/` | 市场风向数据及可下载公开资料 |
| `db/`、`drizzle/` | 数据库结构及迁移 |
| `tests/` | 本地回归与接口检查 |
| `wrangler.jsonc` | 本地数据库绑定与迁移目录 |

前端使用 React、Vinext / Vite，数据写入通过本地 Workers / D1 运行时执行。保留的 Sites 构建兼容文件不要求 Sites 账号。本仓库不是纯静态页面，直接打开 HTML 或仅用 GitHub Pages 无法提供数据库编辑功能。

## 许可

项目原创代码使用 [MIT License](LICENSE)。第三方组件及所附研究资料适用各自的权利说明，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 与 [DATA_NOTICE.md](DATA_NOTICE.md)；项目代码许可不替代原始来源的许可。
