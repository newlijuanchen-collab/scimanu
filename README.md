# Journal Review Time MVP (Machine-Extracted)

这个项目是一个最小可行版本（MVP），用于构建“**article级数据库**”：

- 先从 PubMed/PMC 抓取文献
- 再抽取 `Received / Revised / Accepted / Collection date`
- 最后生成可用于任意维度比较的数据库与榜单

同时保留了从元数据文本直接抽取的兼容命令。

---

## 0) 快速跑通（先抓几篇文章）

本项目当前推荐只跑一条**最小主流程**：

1. 准备期刊输入 `data/journals_seed.csv`
2. 标准化输入 `prepare-input`
3. 跑小样本抓取 `build-db`（每刊 2 篇）
4. 查看 3 个核心输出文件

先不要做复杂统计，先把这条链路跑通。

---

## 1) 准备输入文件

主输入文件：`data/journals_seed.csv`

字段：

- `journal_id`：你自定义唯一ID
- `journal_name`：期刊名
- `issn_print` / `issn_online`：纸本/电子 ISSN（至少一个）
- `publisher`：出版社
- `subject`：学科
- `active`：是否纳入采集（1/0）

模板已提供：`data/journals_seed.csv`

运行输入校验与标准化（第 1 步命令）：

```bash
python -m reviewtime.cli prepare-input \
  --input-csv data/journals_seed.csv \
  --output-jsonl out/journals_normalized.jsonl \
  --output-report out/input_validation_report.json
```

输出文件：

- `out/journals_normalized.jsonl`：标准化后可直接用于抓取
- `out/input_validation_report.json`：字段缺失/格式问题报告

人工只做这 3 件事：

仅做高价值人工：

1. 校对期刊主数据（ISSN、刊名、publisher、subject）
2. 抽样验收提取准确率（每刊 3-10 篇）
3. 标注异常原因（无PMCID/来源不可抓/字段缺失）

不建议人工逐篇录入文章。

采集策略：

- 主线：**Crawler/API**（PubMed/PMC/Crossref）
- 补位：**RPA**（仅在必须 JS 渲染或特殊页面时使用）

---

## 2) 跑小样本 build-db（第 2 步命令）

`build-db` 默认会读取 `out/journals_normalized.jsonl`，所以不需要再传 `--journals`。

先跑小样本（每刊 2 篇）：

```bash
python -m reviewtime.cli build-db \
  --output-articles out/articles_master.jsonl \
  --output-sqlite out/articles_master.db \
  --output-report out/ingestion_report.json \
  --output-schema out/schema_articles_master.json \
  --output-leaderboard out/leaderboard_by_journal.json \
  --from-pub-date 2024-01-01 \
  --until-pub-date 2024-02-01 \
  --retmax-per-journal 2
```

如需兼容旧输入（可选）：

```bash
python -m reviewtime.cli build-db \
  --journals data/journals_issn.jsonl \
  --output-articles out/articles_master.jsonl \
  --output-sqlite out/articles_master.db \
  --output-report out/ingestion_report.json \
  --output-schema out/schema_articles_master.json \
  --output-leaderboard out/leaderboard_by_journal.json \
  --from-pub-date 2024-01-01 \
  --until-pub-date 2024-02-01 \
  --retmax-per-journal 2
```

---

## 3) 如何判断“已跑通”

先看这 3 个输出：

- `out/articles_master.jsonl`
- `out/ingestion_report.json`
- `out/leaderboard_by_journal.json`

建议判定标准：

- `valid_records > 0`
- `invalid_records = 0`（MVP阶段尽量满足）
- `coverage_days_received_to_accepted` 有值

---

## 4) 输出说明

- `out/articles_master.jsonl`：一文一行，含拆分字段（received/revised/accepted 等）
- `out/articles_master.db`：SQLite 主库（可直接做任意维度查询）
- `out/ingestion_report.json`：抓取与抽取质量报告
- `out/schema_articles_master.json`：主表schema定义
- `out/leaderboard_by_journal.json`：按期刊聚合（可发布榜单基础）

`articles_master` 重点字段：

- 标识：`item_id, dedup_key, pmid, pmcid, doi`
- 期刊：`journal_name, issn, journal_label`
- 事件：`received_date, revised_dates, accepted_date, collection_date`
- 计算：`days_received_to_accepted, days_revised_last_to_accepted`
- 质量与溯源：`source_channel, source_url, parse_method, confidence_score, extraction_status, error_code, retry_count`

## 5) 兼容模式：文本抽取（可选）

如果你已有论文页面文本，可直接抽取：

- Received
- Revised
- Accepted
- Available online
- Version of Record

并计算关键时长（例如 `Received -> Accepted`），再按期刊做近 24 个月聚合统计。

本项目只依赖 Python 标准库。

```bash
python -m reviewtime.cli analyze \
  --input data/sample_articles.jsonl \
  --output-dir out \
  --as-of 2026-05-01 \
  --window-months 24
```

运行后会输出：

- `out/extracted_articles.jsonl`：每篇文章的事件抽取与时长
- `out/journal_stats.json`：按期刊聚合统计（近24个月）
- `out/journal_trends.json`：趋势统计（近6个月 vs 近24个月）

## 6) Crossref 元数据抓取（辅助入口，可选）

你可以先按 ISSN 批量拉取文章元数据（用于后续拼接 publisher 页面/PDF 抽取）：

```bash
python -m reviewtime.cli fetch-crossref \
  --journals data/journals_issn.jsonl \
  --output out/crossref_works.json \
  --from-pub-date 2024-01-01 \
  --until-pub-date 2026-04-30 \
  --rows-per-journal 20
```

说明：Crossref 通常不直接给 `received/revised/accepted`，该命令用于构建“真实来源接入第一步”的数据底座。

## 7) 输入数据格式（JSONL）

每行一个 JSON，例如：

```json
{
  "article_id": "a1",
  "journal": "Journal of Example Studies",
  "text": "Received 13 November 2025, Revised 8 March 2026, Accepted 12 April 2026, Available online 13 April 2026, Version of Record 16 April 2026"
}
```

可选字段：

- `published_date`：ISO 日期字符串，作为辅助参考

## 8) 默认统计口径

- 时间窗口：`as_of` 往前 24 个月
- 过滤依据：优先使用 `accepted` 日期；若缺失则使用 `available_online`

## 9) 目录结构

```text
reviewtime/
  __init__.py
  aggregate.py
  cli.py
  metrics.py
  parser.py
data/
  journals_issn.jsonl
  sample_articles.jsonl
README.md
```

## 10) 说明

这是用于验证产品可行性的工程样板，后续可扩展：

- 爬虫/来源接入（Crossref、Publisher page、PDF parser）
- 更强日期解析（更多语言和噪声格式）
- Web API + 前端展示
- 反作弊与异常值建模

---

## 12) data.xlsx 预聚合快照（推荐给 Supabase）

为避免前端每次请求都实时聚合（增加交互流量与费用），建议先将 `web/data.xlsx` 离线处理为多张 CSV 快照，再导入 Supabase。

### 12.1 一条命令生成快照

```bash
python reviewtime/build_csv_snapshots.py \
  --input web/data.xlsx \
  --outdir out/snapshots \
  --months 24 \
  --min-count 3 \
  --output-report out/snapshots_report.json
```

### 12.2 主要输出文件

- `out/snapshots/review_rows_clean.csv`：清洗后的文章级明细（可选导入）
- `out/snapshots/snapshot_journal_stats.csv`：期刊统计（count/median/p25/p75/min/max/med6/med24/trend）
- `out/snapshots/snapshot_journal_trend.csv`：期刊 × 月份统计（用于趋势图/热力图）
- `out/snapshots/snapshot_global_trend.csv`：全局月度统计
- `out/snapshots/snapshot_publisher_stats.csv`：出版社维度统计
- `out/snapshots/snapshot_subject_stats.csv`：学科维度统计
- `out/snapshots/snapshot_global_summary.csv`：全局单行 KPI
- `out/snapshots_report.json`：本次生成参数与各文件行数

### 12.3 Supabase 导入建议

建议将上述 CSV 对应导入以下表（可同名）：

- `snapshot_journal_stats`
- `snapshot_journal_trend`
- `snapshot_global_trend`
- `snapshot_publisher_stats`
- `snapshot_subject_stats`
- `snapshot_global_summary`

前端查询时优先直接读这些快照表，仅做筛选/排序，不做大规模实时聚合。

### 12.4 不上传 Supabase：Next.js 直接读取本地快照

如果你选择“不上传 Supabase”，`reviewtime-next` 也可以直接读取 `out/snapshots/*.csv`。

默认读取目录：

- `../out/snapshots`（相对 `reviewtime-next`）

可通过环境变量覆盖：

```bash
# 在 reviewtime-next/.env.local
REVIEWTIME_SNAPSHOT_DIR=../out/snapshots
```

然后启动 Next.js：

```bash
cd reviewtime-next
pnpm dev   # 或 npm run dev / yarn dev
```

这样 `/api/review-data` 会在服务端直接读取 CSV 并组装为页面需要的数据结构，无需 Supabase。

---

## 11) 设计章节（可落地）：安全采集 + 增量更新 + 最小人工

本章节用于回答三个核心问题：

1. 你应该给系统什么输入（journal 还是 article）？
2. 如何周期更新，避免重复查询，只拉增量？
3. 在 publisher 有反爬策略时，如何“最安全”运行？

### 11.1 目标与约束

**目标（Goal）**

- 以期刊清单为主驱动，自动构建 article 级数据库。
- 每次只抓增量；已经入库的文章不重复处理。
- 人工只做抽样核验与异常审核。

**约束（Constraints）**

- 不使用高风险绕过手段（代理池、验证码绕过、指纹伪造等）。
- 优先 API/RSS/开放数据源，不高频直接抓 publisher 页面。
- 遇到 403/429 时自动降级与退避，不硬顶请求。

### 11.2 输入设计（推荐）

采用“**1份主输入 + 1份可选线索**”结构：

1. **主输入（必需）**：`data/journals_seed.csv`
   - 当前必填列：`journal_id,journal_name,issn_print,issn_online,publisher,subject,active`
   - 用途：驱动 `prepare-input -> build-db` 主流程。

2. **可选线索（增强）**：article 线索池（后续可加）
   - 例如：`doi/pmid/pmcid/source_url/published_date/journal_id`
   - 用途：补齐 API 未覆盖文章、提升匹配率。

> 结论：长期自动化以 **journal 主输入** 为核心；article 线索是“加速器”。

### 11.3 MDPI 批量接入（本次已落地）

你提供了 `data/journal_list.txt` 中的 MDPI 期刊列表（516 本），并已安全整合到：

- `data/journals_seed.csv`（总计 519 行，含原有 3 行）
- `out/input_validation_report.json` 校验结果：`invalid_rows = 0`

映射策略：

- `journal_name` <- MDPI Journal Name
- `issn_online` <- 提供的 ISSN（单 ISSN 先入 online 列）
- `publisher` <- `MDPI`
- `subject` <- `Multidisciplinary`（后续可再细分）
- `active` <- `1`
- `journal_id` <- `MDPI_0001...`

### 11.4 安全采集策略（Anti-Block First）

#### 数据源优先级（从安全到风险）

1. **Low Risk（默认）**：PubMed / PMC / Crossref / RSS
2. **Medium Risk**：文章详情页（仅必要时）
3. **High Risk（禁用）**：反爬绕过类方案

#### 运行策略

- **API-first / Feed-first**：优先官方/开放接口。
- **单域名串行**：并发=1，降低突发流量。
- **低频请求**：建议 0.1~0.2 req/s，并加入随机抖动。
- **指数退避**：403/429/5xx 触发退避与熔断。
- **失败降级**：站点受限时回落到 API/RSS，不强行抓页面。
- **可审计日志**：记录状态码、重试次数、暂停原因。

### 11.5 增量更新设计（查过不再查）

已有基础能力：

- `dedup_key`（doi > pmcid > pmid > fallback）
- SQLite `upsert`

建议执行机制：

1. **Journal Cursor（每刊游标）**
   - 记录 `last_until_pub_date`, `last_run_at`, `last_status`
2. **增量窗口**
   - 本次抓取区间 = `(last_until_pub_date - grace_days, today]`
   - `grace_days` 建议 14~30 天，防止延迟上架
3. **去重入库**
   - 全部文章走 `dedup_key + upsert`，天然避免重复
4. **定向回查**
   - 仅回查 `extraction_status != ok` 或 `confidence_score` 低的记录

### 11.6 周期运行建议

- **日更（可选）**：高优先级期刊（例如 MDPI 大刊）
- **周更（推荐）**：全量活跃期刊增量扫描
- **月更（治理）**：异常回查 + 指标复核 + 字段补齐

建议命令模板：

```bash
# 1) 输入校验/标准化
python -m reviewtime.cli prepare-input \
  --input-csv data/journals_seed.csv \
  --output-jsonl out/journals_normalized.jsonl \
  --output-report out/input_validation_report.json

# 2) 增量构建数据库（时间窗口按周期任务动态传入）
python -m reviewtime.cli build-db \
  --output-articles out/articles_master.jsonl \
  --output-sqlite out/articles_master.db \
  --output-report out/ingestion_report.json \
  --output-schema out/schema_articles_master.json \
  --output-leaderboard out/leaderboard_by_journal.json \
  --from-pub-date 2026-04-01 \
  --until-pub-date 2026-05-01 \
  --retmax-per-journal 20
```

### 11.7 人工最小化 SOP

人工只做三件事：

1. 校验新增期刊主数据（ISSN/刊名/publisher）
2. 抽样核对（每周 1~2% 文章）
3. 处理异常队列（403/429/parse_fail/字段缺失）

不建议人工逐篇录入文章历史字段。

---

### 11.8 双轨输入设计（Auto ＋ Manual Patch）

#### 11.8.1 背景与问题

API/爬虫路径能覆盖大多数期刊，但以下情况**永远覆盖不了**：

| 情形 | 典型来源 |
|---|---|
| WAF 反爬（Akamai/Cloudflare）阻断 | MDPI 页面（已验证：403/Access Denied） |
| 仅在 publisher 页面显示完整历史 | MDPI/Cell Press/Springer 等 history_visibility=2 |
| 人工发现个别遗漏文章需要补录 | 任意期刊 |

对这类文章，**最可靠的方式是人工从页面复制文本、系统自动解析**。

#### 11.8.2 publisher history_visibility 分级

根据各 publisher 对审稿历史的公开程度，分为 3 级：

| 级别 | 含义 | 典型字段 | 典型期刊 |
|---|---|---|---|
| **2 = full history** | 完整历史，可被系统直接利用 | Received + Revised + Accepted + Published | MDPI、Cell Press、Springer 部分研究刊 |
| **1 = partial history** | 部分历史，通常只有 Accepted 或上线日期 | Accepted / Accepted manuscript online | BMJ、PLOS、OUP、Wiley |
| **0 = mostly publication-only** | 仅发表日期，无审稿历史 | Published Online / Version of Record | JAMA、Science、NEJM 类 |

> **优先接入顺序建议**：
> - **MDPI / Cell Press / Springer**：字段最全，历史最易提取，但 MDPI 页面有 WAF（通过 Manual Patch 补录）
> - **PLOS / BMJ / OUP / Wiley**：同时看文章页 + accepted/advance 子页，API 可覆盖部分
> - **JAMA / Science / NEJM**：不适合将"完整稿件历史"作为稳定爬取字段

#### 11.8.3 Manual Patch 工作流（已落地）

**你的操作（人工，每篇约 10 秒）**：

1. 打开 publisher 文章页，全选复制可见文本
2. 粘贴到 `data/manual_patches/` 目录下任一 `.txt` 文件（文件名随意，如 `mdpi_2025q3.txt`）
3. 同一个文件里可放**多篇**，用空行隔开

示例文件 `data/manual_patches/mdpi_2025q3.txt`：

```text
Can the Accrual Anomaly Be Explained by Credit Risk?
by Foong Soon Cheong
Account. Audit. 2025, 1(2), 6; https://doi.org/10.3390/accountaudit1020006
Submission received: 19 May 2025 / Revised: 25 June 2025 / Accepted: 2 July 2025 / Published: 14 July 2025

Another Article Title
Journal Abbr. 2025, 2(3), 15; https://doi.org/10.3390/xxxxx2030015
Submission received: 10 Jan 2025 / Accepted: 15 Feb 2025 / Published: 1 March 2025
```

**运行命令**：

```bash
python -m reviewtime.cli ingest-manual \
  --input-dir data/manual_patches \
  --output-articles out/articles_master.jsonl \
  --output-sqlite out/articles_master.db
```

添加 `--no-overwrite-ok` 可以保护已经验证的记录不被意外覆盖：

```bash
python -m reviewtime.cli ingest-manual \
  --input-dir data/manual_patches \
  --output-articles out/articles_master.jsonl \
  --output-sqlite out/articles_master.db \
  --no-overwrite-ok
```

**系统自动做的事**：

1. 扫描 `data/manual_patches/` 下所有 `.txt` 文件（按文件名字母序）
2. 按空行切分 block，每个 block 对应一篇文章
3. 从 block 提取 DOI（优先 `https://doi.org/` URL）
4. 提取历史日期行（`Submission received / Revised / Accepted / Published`），转换为系统统一格式
5. 计算 `days_received_to_accepted` 等指标
6. 按 DOI 做 `dedup_key + upsert`：同 DOI 已存在且为 `ok` 状态时默认覆盖（加 `--no-overwrite-ok` 则跳过）
7. 写入 `out/articles_master.jsonl` 和 SQLite

**已验证**（MDPI 示例）：

```
doi=10.3390/accountaudit1020006
received_date=2025-05-19
revised_dates=['2025-06-25']
accepted_date=2025-07-02
online_date=2025-07-14
days_received_to_accepted=44
source_channel=manual_patch
confidence_score=0.9
extraction_status=ok
```

#### 11.8.4 增量去重与合并逻辑

两条轨道（Auto + Manual）产出的记录**都走同一张表 `articles_master`**：

```
dedup_key = doi（优先）> pmcid > pmid > url_hash
```

合并规则：

| 情形 | 行为 |
|---|---|
| 新 DOI，从未入库 | 直接 INSERT |
| DOI 已在库，`extraction_status=ok` | 默认 UPDATE（Manual 数据置信度 0.9，覆盖 API 的 metadata_only） |
| DOI 已在库，加了 `--no-overwrite-ok` | SKIP（保护已验证记录） |
| Auto 和 Manual 同时有同一 DOI | 最后写入的生效；Manual 通常优先（confidence_score 更高） |

#### 11.8.5 批量补录建议

如果你有一批 MDPI/Springer 文章需要补录：

1. 在浏览器里打开 10-20 篇文章，每篇 Ctrl+A → Ctrl+C
2. 粘贴到同一个 `.txt` 文件（每篇间加一个空行）
3. 跑一次 `ingest-manual` 即可
4. 检查 `[ingest-manual] parsed=XX  new/updated=XX  invalid=0` 确认正常

**一次可批量处理几千篇**，不存在速率限制（本地解析）。

#### 11.8.6 支持的日期格式（自动识别）

系统的 `parser.py` 支持以下所有格式，无需你手动整理：

| 格式示例 | 来源 |
|---|---|
| `Submission received: 19 May 2025` | MDPI |
| `Received: 19 May 2025` | 通用 |
| `Accepted: 2 July 2025` | 通用 |
| `Received 13 November 2025` | Springer |
| `2025-07-02` | ISO 日期 |
| `November 13, 2025` | 北美格式 |

`/` 分隔的多段日期行（MDPI 风格）会自动拆分为逗号分隔再解析。




