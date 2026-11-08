# ReviewTime 网站设计文档 v2.0

> 更新时间：2026-05-20
> 说明：本节为基于 `web/data.xlsx` 实际字段的新版方案。下方旧版内容保留作为历史参考，后续实施以本节为准。

---

## A. 基于 `data.xlsx` 的真实数据理解

### A.1 当前数据事实

- 当前 `web/data.xlsx` 只有 `1` 个工作表，约 `4463` 条文章记录，`33` 个字段。
- 数据粒度不是期刊汇总，而是**文章级审稿事件主表**。
- 当前可聚合出约 `101` 本期刊。
- 现有字段已经足够支撑第一阶段的核心能力：文章级证据、期刊级分布、趋势、榜单、对比。
- 你说明 `publisher` 与 `subject` 会补上，因此新版方案按“这两个维度可用”进行设计。

### A.2 当前真实可用字段

当前已经可直接使用的关键字段：

- 标识类：`item_id`、`dedup_key`、`pmid`、`pmcid`、`doi`
- 期刊类：`journal_name`、`journal_label`、`issn`
- 文章类：`title`、`article_type`、`publication_types`
- 时间类：`publication_date`、`received_date`、`revised_dates`、`revised_first_date`、`revised_last_date`、`accepted_date`、`collection_date`
- 指标类：`days_received_to_accepted`、`days_revised_last_to_accepted`
- 溯源类：`source_channel`、`source_url`、`extraction_status`、`error_code`、`retry_count`、`confidence_score`、`parse_method`、`parser_version`、`fetched_at`、`updated_at`

补齐后将作为核心筛选维度的字段：

- `publisher`
- `subject`

### A.3 这意味着什么

这意味着 ReviewTime 第一阶段不应该再围绕 “复刻 SciRev 卡片” 来设计，而应该围绕以下真实能力来设计：

1. 某本期刊整体是否快
2. 这本期刊是否稳定
3. 最近是加速还是变慢
4. 这些结论基于多少篇文章
5. 这些数据来自哪里、可信度如何
6. 和同出版社、同学科、相近定位期刊相比如何

---

## B. 产品目标重构

### B.1 产品定位

ReviewTime 的定位是：

**一个帮助研究者进行投稿决策的期刊效率数据库，而不是单纯的数据看板。**

对标 `scirev.org`，但差异点更明确：

- `SciRev` 偏用户提交体验和评分
- `ReviewTime` 偏自动提取时间节点 + 人工补录 + 证据透明

### B.2 三阶段目标

| 阶段 | 目标 | 重点输出 |
|------|------|----------|
| 第一阶段 | 审稿效率数据库 | 单刊页、发现页、榜单页、对比页 |
| 第二阶段 | 效率 + 影响力双维选刊 | IF、分区、大刊概览、选刊矩阵 |
| 第三阶段 | 投稿工具平台 | Citation Verification、Journal Match、Reference Checker |

### B.3 用户核心问题

用户访问网站时最关心的是：

1. 这本期刊审稿快不快
2. 稳不稳定
3. 最近有没有变慢
4. 样本够不够
5. 同学科里是不是好选择
6. 如果追求影响力，是否有更好的折中项

---

## C. 数据准备方案

### C.1 数据准备目标

前端不应直接拿 `xlsx` 原表做所有计算，而应整理成三层数据：

1. 文章级明细层
2. 期刊级汇总层
3. 全局趋势层

### C.2 清洗规则

建议数据清洗遵循以下规则：

- 仅保留 `journal_name` 或 `journal_label` 非空的数据
- 默认仅保留 `extraction_status = ok` 的记录进入主展示
- `days_received_to_accepted <= 0` 的记录剔除
- `days_received_to_accepted > 1000` 的极端值默认进入异常池，不进入前台默认统计
- DOI 统一小写
- ISSN 去空格、统一格式
- 日期统一转为 `YYYY-MM-DD`

### C.3 衍生字段

需要额外生成以下衍生字段：

| 字段 | 说明 |
|------|------|
| `journal_key` | 统一期刊键，优先用 `journal_label` |
| `ym` | `accepted_date` 对应年月 |
| `revision_count` | revision 次数 |
| `has_revision` | 是否有修改记录 |
| `is_high_confidence` | `confidence_score >= 0.9` |
| `source_group` | 来源分组，如 `PMC XML`、`PubMed History`、`Manual` |
| `visibility_level` | 数据可见性等级，Phase 1 可先统一为 `full` |

### C.4 期刊级聚合指标

每个期刊建议预先生成：

| 指标 | 说明 |
|------|------|
| `count` | 样本量 |
| `median_days` | 收稿到接收中位数 |
| `p25_days` | 25 分位 |
| `p75_days` | 75 分位 |
| `iqr_days` | `p75 - p25` |
| `min_days` | 最快值 |
| `max_days` | 最慢值 |
| `med_3m` | 近 3 月中位 |
| `med_6m` | 近 6 月中位 |
| `med_12m` | 近 12 月中位 |
| `med_24m` | 近 24 月中位 |
| `trend_6_vs_24` | 近 6 月相对近 24 月变化 |
| `revision_share` | 有 revision 的文章占比 |
| `median_rev_to_accept` | 最后修改到接收的中位天数 |
| `coverage_start` | 最早 accepted 日期 |
| `coverage_end` | 最晚 accepted 日期 |
| `source_mix` | 来源占比 |
| `confidence_median` | 中位置信度 |
| `publisher` | 出版商 |
| `subject` | 学科 |

### C.5 推荐快照文件

建议前端最终消费这些文件，而不是反复直读 `xlsx`：

- `review_rows_clean.csv`
- `snapshot_journal_stats.csv`
- `snapshot_journal_trend.csv`
- `snapshot_global_trend.csv`
- `snapshot_global_summary.csv`
- `snapshot_publisher_stats.csv`
- `snapshot_subject_stats.csv`
- `snapshot_data_quality.csv`

### C.6 Phase 1 数据传输方案

你当前明确的约束是：

- **没有后端服务**
- 网站可以纯静态部署
- 数据可以放在网站代码目录下
- 也可以放在 Supabase

因此 Phase 1 的数据传输必须满足以下目标：

1. 前端可直接通过 `fetch()` 获取数据
2. 首屏加载快
3. 不依赖运行中的 Python/Node/Flask 后端
4. 部署尽量简单
5. 后续能平滑迁移到 Supabase

#### C.6.1 可选方案对比

| 方案 | 传输方式 | 优点 | 缺点 | 适合阶段 |
|------|----------|------|------|----------|
| A. 浏览器直读 `data.xlsx` | 前端 `fetch(data.xlsx)` + SheetJS 解析 | 最省事，开发快 | 首屏慢、重复聚合、流量大、缓存粒度差 | 仅开发期 |
| B. 网站目录下静态快照文件 | 前端 `fetch(/data/*.json 或 *.csv)` | 无后端、部署简单、速度快、缓存友好 | 每次更新需要重新上传文件 | **Phase 1 推荐** |
| C. Supabase 数据库直连 | 前端通过 Supabase JS SDK 查询表 | 方便增量更新、便于筛选分页 | 结构更复杂、需做 RLS 和查询优化 | Phase 1.5 / Phase 2 |
| D. Supabase Storage 静态文件 | 前端直接读取公开 JSON/CSV 文件 | 仍然无后端、更新比本地文件方便 | 仍需管理文件版本与缓存 | 可作为 B 的远程版 |

#### C.6.2 Phase 1 推荐结论

**Phase 1 推荐采用方案 B：网站目录下的静态快照文件。**

原因：

1. 你现在最重要的是先把产品页面和用户体验做对
2. 当前数据规模约 `4463` 篇文章、`101` 本期刊，静态快照完全足够
3. 静态快照最容易部署到任意静态托管平台
4. 不需要在 Phase 1 就引入 Supabase 的鉴权、查询、分页、RLS、索引设计复杂度
5. 后续如果要迁移到 Supabase，可以保持前端接口不变，只替换数据源

#### C.6.3 Phase 1 推荐目录结构

建议在 `web/` 下新增：

```text
web/
  data/
    global-summary.json
    global-trend.json
    journals.json
    journal-trend.json
    publisher-stats.json
    subject-stats.json
    articles/
      journal-<slug>.json
```

其中：

- `global-summary.json`
  - 首页 KPI
- `global-trend.json`
  - 首页全局趋势图
- `journals.json`
  - 发现页、榜单页、对比页使用的期刊级汇总
- `journal-trend.json`
  - 单刊页趋势图和热力图使用的月度数据
- `publisher-stats.json`
  - 出版社维度汇总
- `subject-stats.json`
  - 学科维度汇总
- `articles/journal-<slug>.json`
  - 单刊页的文章级证据表

#### C.6.4 为什么不建议单文件传输所有文章

不建议 Phase 1 只保留一个超大的 `data.xlsx` 或 `all-articles.json` 给所有页面直读。

原因：

1. 首页、榜单页、发现页并不需要全量文章数据
2. 单个大文件会拖慢首屏
3. 浏览器需要重复解析和聚合
4. 缓存粒度太粗，任意小改动都要整体失效

更合适的做法是：

- 列表页只加载汇总快照
- 单刊页按需加载该刊文章明细

#### C.6.5 推荐加载顺序

Phase 1 前端建议采用如下加载策略：

1. 首页
   - 首先请求 `global-summary.json`
   - 再请求 `global-trend.json`
   - 最后按需请求 `journals.json` 中的少量推荐数据

2. 发现页 / 榜单页 / 对比页
   - 首次只请求 `journals.json`
   - 所有筛选、排序在前端完成

3. 单刊页
   - 首先从 `journals.json` 读取该刊摘要
   - 再请求 `journal-trend.json`
   - 最后请求 `articles/journal-<slug>.json`

这种方式的优点是：

- 首屏快
- 数据职责清晰
- 网络请求可控
- 后续切换 Supabase 时页面结构不用推翻

#### C.6.6 JSON 还是 CSV

Phase 1 更推荐使用 **JSON** 而不是 CSV。

原因：

1. 前端直接消费更方便
2. 嵌套结构更自然，例如 `source_mix`、`timeSeries`
3. 单刊文章列表用 JSON 可直接渲染
4. 减少浏览器端二次解析复杂度

建议：

- 汇总层可以用 JSON
- 如果后续有导出或离线分析需求，再保留 CSV 副本

#### C.6.7 缓存策略

无后端情况下，缓存非常重要。

建议：

- 文件名带版本号或构建时间，如：
  - `journals.v20260520.json`
  - `global-summary.v20260520.json`
- 首页只缓存摘要文件
- 单刊文章文件按期刊粒度缓存
- 浏览器端可增加 `localStorage` 或 `sessionStorage` 短缓存

如果部署平台支持静态资源缓存头，可设置：

- 汇总快照：中等缓存
- 文章明细：较长缓存
- 首页摘要：较短缓存

#### C.6.8 Phase 1 前端仓储层设计

即使没有后端，也建议前端把“数据来源”抽象出来。

建议新增一个统一仓储层：

```text
assets/js/
  repositories/
    summary-repo.js
    journal-repo.js
    article-repo.js
```

对页面暴露统一方法，例如：

- `getGlobalSummary()`
- `getGlobalTrend()`
- `getJournalList()`
- `getJournalBySlug(slug)`
- `getJournalTrend(slug)`
- `getJournalArticles(slug)`

这样做的好处是：

- 现在可以读本地 `data/*.json`
- 以后可以无缝切到 Supabase
- 页面代码不需要重写

#### C.6.9 Supabase 在 Phase 1 中的角色

Supabase 在 Phase 1 中**不是必须**，但可以作为可选增强方案。

如果你希望：

- 后续频繁更新数据
- 在不同设备上管理数据
- 以后继续扩展登录、提交、人工审核

那么可以提前为 Supabase 留接口。

但 Phase 1 不建议直接把所有页面建立在 Supabase 查询之上，原因是：

1. 你还在快速迭代产品形态
2. 现在最重要的是先稳定页面、字段和口径
3. 直接查询数据库会让前端逻辑、分页、筛选、权限设计变复杂

#### C.6.10 Supabase 的正确用法

如果使用 Supabase，更推荐两种方式：

1. **方式一：Supabase Storage 放静态 JSON**
   - 本质仍然是静态快照
   - 只是文件托管在云端
   - 前端仍然通过公开 URL 获取

2. **方式二：Supabase Database 放聚合表**
   - 仅放已聚合的快照表
   - 不在 Phase 1 直接查询原始文章大表

如果走数据库模式，推荐至少拆成：

- `snapshot_global_summary`
- `snapshot_global_trend`
- `snapshot_journal_stats`
- `snapshot_journal_trend`
- `snapshot_publisher_stats`
- `snapshot_subject_stats`
- `article_rows_by_journal`

#### C.6.11 最终建议

Phase 1 的最终建议是：

**主方案：网站代码目录下静态 JSON 快照**

```text
页面 -> repository 层 -> /web/data/*.json
```

**兼容方案：后续可切换到 Supabase Storage 或 Supabase 快照表**

```text
页面 -> repository 层 -> Supabase
```

这样可以保证：

- Phase 1 先完成
- 无后端即可部署
- 加载速度比直读 `xlsx` 更好
- 未来迁移成本低

### C.7 数据质量标签

每本期刊都应展示：

- 样本量
- 覆盖时间范围
- 来源类型
- 置信度
- 更新时间

这 5 个标签比任何“伪评分”都更重要。

---

## D. 第一阶段的信息架构

建议第一阶段页面结构改成：

```text
index.html           首页
explorer.html        发现页
journal.html         单刊详情页（新增）
leaderboard.html     榜单页
compare.html         对比页
methodology.html     方法页（新增）
tools/
  impact.html        第二阶段
  citation.html      第三阶段
```

### D.1 首页

首页不再做成重型 dashboard，而改成“搜索 + 推荐入口”。

首页职责：

- 搜索期刊
- 告诉用户网站价值
- 提供几个快速入口
- 展示少量高价值概览图

首页首屏建议：

1. 主标题
2. 搜索框
3. 三个 CTA
   - 查单刊
   - 找更快的候选期刊
   - 对比备选期刊
4. 一行 KPI
   - 覆盖期刊数
   - 有效文章数
   - 全局中位数
   - 最近更新时间

首页图表只保留两张：

- 全局趋势图
- Top 期刊速度分布图

### D.2 发现页

发现页是用户找候选期刊的核心页面。

筛选项建议：

- 关键词：期刊名 / ISSN
- 出版社
- 学科
- 最小样本量
- 中位天数范围
- 趋势状态
- 来源类型
- 置信度等级

主表格建议列：

- 期刊名
- 出版社
- 学科
- ISSN
- 样本量
- 中位天数
- P25-P75
- IQR
- 近 6 月变化
- 覆盖时间
- 详情

### D.3 单刊详情页

单刊页是第一阶段最重要的页面。

必须包含 5 个模块：

1. 顶部摘要
   - 期刊名
   - 出版社
   - 学科
   - ISSN
   - 样本量
   - 覆盖时间
   - 中位天数
   - IQR
   - 趋势
   - 来源标签

2. 趋势图
   - 24 个月趋势折线
   - 月度样本量柱状图
   - 热力图

3. 分布解释
   - 最快
   - 最慢
   - 中间 50%
   - revision 后处理速度
   - revision 占比

4. 文章级证据表
   - 标题
   - DOI
   - Received
   - Revised Last
   - Accepted
   - Days
   - Source
   - Confidence
   - 原始链接

5. 类似期刊推荐
   - 同学科更快
   - 同出版社更稳
   - 相近中位数但样本更多

### D.4 榜单页

榜单页建议拆成 4 个榜单：

1. 最快期刊
2. 最慢期刊
3. 最近加速最多
4. 最稳定期刊

榜单列建议：

- 排名
- 期刊名
- 出版社
- 学科
- 样本量
- 中位数
- P25
- P75
- IQR
- 趋势
- 详情

### D.5 对比页

对比页目标是帮助用户在 2 到 5 本候选期刊中做选择。

建议对比维度：

- 中位天数
- IQR
- 样本量
- 近 6 月趋势
- revision 占比
- 来源构成
- 学科
- 出版社

展示方式：

- 汇总表
- 趋势折线图
- 分布图

### D.6 方法页

方法页必须解释：

- 数据来自哪里
- 如何清洗
- 如何聚合
- 为什么某些字段暂不展示
- 什么叫高置信度
- 什么叫覆盖时间
- 结果为什么不能直接等于“投稿成功率”

---

## E. 第一阶段不该展示什么

由于当前数据结构与 SciRev 不同，第一阶段不应展示以下内容：

- 审稿报告数量
- 审稿意见质量评分
- 总体评分
- 立即拒稿时间
- 编辑体验评分
- 用统计值硬推导出来的 accepted/rejected 结论

简单说：

**没有真实字段，就不要模仿 SciRev 做出看起来像但实际上不成立的卡片。**

---

## F. 第二阶段设计

第二阶段建立在 `publisher`、`subject` 已可用的前提上。

### F.1 新增能力

- 影响因子
- 5-year IF
- 分区
- OpenAlex 指标
- 年发文量
- 大刊标签
- 选刊矩阵

### F.2 第二阶段的页面表达

重点不是单独做一个 “IF 查询页”，而是把影响力能力融入单刊页和发现页：

1. 单刊页新增“Impact & Context”模块
2. 发现页新增“影响力区间筛选”
3. 对比页新增“效率 vs 影响力”对比
4. 首页新增“快且强”推荐模块

### F.3 无法获得完整时间数据的大刊

对于 Nature、Science 一类无法获得完整时间细节的大刊，采用：

- `overview` 模式

展示：

- 基本信息
- 影响力
- 分区
- 年发文量
- 开放获取状态
- 已知有限审稿时间样本

但不伪装出不存在的完整审稿趋势。

---

## G. 第三阶段设计

### G.1 Citation Verification Tool

优先级最高的工具应是：

- Citation Verification Tool

能力包括：

- DOI 校验
- 元数据校验
- 撤稿标记
- 参考文献批量检查

### G.2 其他工具

后续可加：

- Journal Match Tool
- Reference Risk Checker
- Submission Checklist

---

## H. 实施顺序

后续修改建议严格按以下顺序进行：

1. 重写 `data-loader.js` 的数据口径
2. 明确快照结构与前端数据接口
3. 新增 `journal.html`
4. 重做 `index.html`
5. 重做 `explorer.html`
6. 重做 `leaderboard.html`
7. 重做 `compare.html`
8. 新增 `methodology.html`
9. 再接入 IF 与工具页

---

## I. 接下来逐项改的建议

为了后续一项一项改，建议接下来按下面顺序推进：

### 第 1 项

先改数据准备文档和 `data-loader.js` 口径，明确：

- 输入是什么
- 输出结构是什么
- 页面能拿到哪些字段

### 第 2 项

先做单刊页线框与字段映射，因为这是整个产品的核心。

### 第 3 项

再调整首页和发现页，确保入口和筛选逻辑围绕单刊决策展开。

---

# ReviewTime 可视化网站 — 设计文档

> 版本：v1.0 | 更新时间：2026-05-06

---

## 1. 项目背景与目标

**ReviewTime** 是一个用于追踪和分析学术期刊审稿周期的工具。数据来源为 MDPI 等出版商的 PubMed/PMC/Crossref 元数据，核心字段包括：投稿日期（received）、修改日期（revised）、接收日期（accepted）、在线发布日期（online）等。

### 两阶段目标

| 阶段 | 目标 |
|------|------|
| **Phase 1** | 从多维度可视化各期刊的 Review Time（审稿周期），帮助研究者快速选刊、对比期刊效率 |
| **Phase 2** | 集成 Citation Checker、Impact Factor 检索等辅助工具，提升选刊决策质量 |

---

## 2. 数据源与结构

### 2.1 主数据：web/data.xlsx

由 Python 后端生成，包含以下核心字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `journal_name` | string | 期刊全名 |
| `journal_label` | string | 期刊简称 |
| `issn` | string | ISSN 号 |
| `publisher` | string | 出版商 |
| `subject` | string | 学科分类 |
| `received_date` | date | 投稿日期 |
| `accepted_date` | date | 接收日期 |
| `online_date` | date | 在线发布日期 |
| `days_received_to_accepted` | int | 投稿到接收天数（核心指标） |
| `days_revised_last_to_accepted` | int | 最后修改到接收天数 |
| `extraction_status` | string | 数据质量：`ok` / `metadata_only` |
| `confidence_score` | float | 数据可信度 0.0-1.0 |

### 2.2 辅助 API（Phase 2）

- **Crossref REST API**：`https://api.crossref.org/works/{doi}` — 引用关系、元数据
- **OpenAlex API**：`https://api.openalex.org/sources?filter=issn:{issn}` — 期刊指标（h-index、引用数、SJR）
- **Semantic Scholar API**：`https://api.semanticscholar.org/graph/v1/paper/{doi}` — 论文引用图谱
- **PubMed E-utilities**：`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/` — PMID 查询

---

## 3. 技术选型（全部开源）

| 类别 | 库 / 框架 | 版本 | 许可证 | 用途 |
|------|-----------|------|--------|------|
| UI 框架 | [Tabler](https://tabler.io) | v1.0 | MIT | 现代 Admin Dashboard 模板 |
| 图表 | [Apache ECharts](https://echarts.apache.org) | v5.4 | Apache-2.0 | 箱线图/折线/热力图/关系图 |
| 数据读取 | [SheetJS (xlsx.js)](https://sheetjs.com) | v0.18 | Apache-2.0 | 浏览器端直接读取 .xlsx |
| 表格 | [DataTables](https://datatables.net) | v1.13 | MIT | 可搜索/排序/分页表格 |
| 轻量响应式 | [Alpine.js](https://alpinejs.dev) | v3 | MIT | 无构建工具的响应式 UI |
| 工具函数 | [Lodash](https://lodash.com) | v4 | MIT | 数组/对象聚合计算 |
| HTTP 请求 | [Axios](https://axios-http.com) | v1 | MIT | Phase 2 API 调用 |

### 设计原则

- **零后端依赖（Phase 1）**：纯静态 HTML + JS，直接从 data.xlsx 读取，无需服务器
- **渐进增强**：Phase 2 工具在已有页面基础上叠加，不破坏 Phase 1 功能
- **响应式设计**：支持桌面和平板设备
- **CDN + 本地降级**：优先本地 lib/ 目录，避免网络依赖

---

## 4. 目录结构

```
web/
├── index.html              # 首页 / Dashboard 总览
├── leaderboard.html        # 审稿周期榜单（最快/最慢/趋势）
├── explorer.html           # 期刊浏览器（搜索+筛选+详情）
├── compare.html            # 多刊横向对比工具
├── tools/
│   ├── citation.html       # [Phase 2] Citation Checker
│   └── impact.html         # [Phase 2] Impact Factor 检索
├── assets/
│   ├── css/
│   │   └── app.css         # 自定义样式
│   └── js/
│       ├── data-loader.js  # 核心：读取xlsx + 数据清洗 + 聚合计算
│       ├── charts.js       # ECharts 图表配置工厂
│       ├── filters.js      # 多维筛选逻辑
│       ├── table.js        # DataTables 初始化
│       └── app.js          # 页面入口，协调各模块
├── lib/                    # 本地开源库
│   ├── echarts.min.js
│   ├── xlsx.min.js
│   ├── alpine.min.js
│   └── lodash.min.js
├── data.xlsx               # 主数据文件（由Python后端生成）
└── design.md               # 本文档
```

---

## 5. Phase 1：Review Time 可视化

### 5.1 Dashboard 总览页（index.html）

**布局**：4列 KPI 卡片 + 2行图表区

```
┌──────────────────────────────────────────────────────┐
│  HEADER: ReviewTime | Dashboard | Leaderboard | ...  │
├──────────┬──────────┬──────────┬────────────────────┤
│ 覆盖刊数  │ 有效样本  │ 中位审稿  │  最快期刊           │
│  N        │  N篇     │  N天     │  Journal X (N天)   │
├──────────┴──────────┴──────────┴────────────────────┤
│  [筛选栏: Publisher | Subject | 时间范围 | 最小样本量] │
├─────────────────────────┬────────────────────────────┤
│  Top 20 期刊箱线图        │  全局审稿趋势折线图          │
│  (ECharts boxplot)      │  (月度中位数 近24个月)       │
├─────────────────────────┴────────────────────────────┤
│  期刊 × 月份 审稿天数热力图 (ECharts heatmap)          │
└──────────────────────────────────────────────────────┘
```

**图表详情**：
1. **箱线图**：X轴=期刊名（按中位数排序），Y轴=天数，须展示 P25/中位/P75/最大/最小
2. **趋势折线图**：按投稿年月聚合，展示全局月度中位审稿天数及置信带（P25-P75区间）
3. **热力图**：行=期刊，列=月份，颜色深浅=中位审稿天数（仅显示样本≥3的单元格）

### 5.2 榜单页（leaderboard.html）

三个 Tab：

**Tab 1 — 最快期刊**
- 筛选：最小样本量滑块（默认≥5篇）、学科、出版商
- 表格列：排名 | 期刊名 | ISSN | 中位天数 | P25 | P75 | 样本量 | 置信度

**Tab 2 — 最慢期刊**
- 同上，按中位天数降序

**Tab 3 — 改善趋势榜**
- 对比"近6个月中位数"vs"近24个月中位数"
- 表格列：排名 | 期刊名 | 近6月中位 | 近24月中位 | 变化 | 变化率
- 颜色标记：绿色=加速，红色=减速

### 5.3 期刊浏览器（explorer.html）

**搜索框**：实时过滤期刊名/ISSN

**高级筛选侧边栏**：
- Publisher（多选）
- Subject（多选树形）
- 数据质量（全部/仅高置信度）
- 时间范围

**主表格**（DataTables）：
- 列：期刊名 | ISSN | 中位天数 | P25-P75 | 样本量 | 趋势 | 详情
- 点击行展开子区域：
  - 该刊 12 个月时序折线图
  - 文章级数据预览表（标题/投稿日/接收日/天数）

### 5.4 对比工具（compare.html）

- 搜索并添加最多 8 本期刊到对比列表
- **并排箱线图**：所选期刊并排比较分布
- **时序折线对比**：各期刊月度中位数折线（可选6/12/24个月窗口）
- **统计汇总表**：期刊 × 指标（中位/P25/P75/样本量/趋势）
- 支持截图导出和 CSV 导出

---

## 6. Phase 2：扩展工具

### 6.1 Citation Checker（tools/citation.html）

**目的**：验证参考文献的准确性，检测撤稿，分析引用关系

**功能模块**：

1. **单篇文章查询**
   - 输入：DOI / PMID / 论文标题
   - 调用：Crossref API + OpenAlex API
   - 输出：元数据卡片（标题/作者/期刊/年份/DOI）、引用次数、被引次数

2. **参考文献批量验证**
   - 输入：粘贴参考文献列表（任意格式）
   - 处理：正则解析 DOI，逐条调用 API 验证
   - 输出：表格（原文/验证状态/建议修正/DOI链接）
   - 特殊标记：撤稿文献（对接 Crossref 撤稿标记）

3. **引用关系图谱**（轻量版）
   - 调用：OpenAlex `/works/{id}/references` + `/works/{id}/citations`
   - 可视化：ECharts force-directed graph，双层展开

**API 限额处理**：
- Crossref：无需认证，推荐加 `mailto` 参数进入礼貌池（5 req/s）
- OpenAlex：完全免费，无需认证，默认限流 10 req/s
- 本地 localStorage 缓存查询结果（24小时有效期）

### 6.2 Impact Factor 检索（tools/impact.html）

**目的**：查询期刊影响力指标，结合 Review Time 辅助选刊

**功能模块**：

1. **期刊指标查询**
   - 输入：ISSN / 刊名
   - 调用：OpenAlex API `/sources`
   - 输出卡片：
     - works_count（发文总量）
     - cited_by_count（总被引次数）
     - h_index
     - 2year_mean_citedness（近似 Impact Factor）
     - 所属学科/ASJC 分类
     - SJR 分区（如 OpenAlex 提供）

2. **IF 趋势图**
   - 展示近5年被引次数趋势
   - 与同学科期刊均值对比

3. **选刊辅助矩阵**（核心功能）
   - X轴：中位审稿天数（来自 ReviewTime 本地数据）
   - Y轴：2year_mean_citedness（来自 OpenAlex）
   - 散点图：帮助找到"快且高质量"的期刊象限
   - 可筛选学科，导出候选期刊列表

---

## 7. 数据流与处理逻辑

### 7.1 前端数据处理管道

```
data.xlsx
  │
  ▼ SheetJS 解析
rawRows: Array<Object>
  │
  ▼ 清洗（data-loader.js cleanRows()）
  • 过滤 extraction_status != 'metadata_only'（或用户可选是否包含）
  • 过滤 days_received_to_accepted <= 0 或 > 1000（异常值）
  • 解析日期字段为 Date 对象
  │
  ▼ 聚合（data-loader.js aggregateByJournal()）
journalMap: Map<journal_label, JournalStats>
  {
    label, issn, publisher, subject,
    count,           // 有效样本数
    median,          // 中位数
    p25, p75,        // 四分位
    min, max,
    timeSeries: Array<{ym: 'YYYY-MM', median, count}>
  }
  │
  ▼ 索引（加速查询）
sortedByMedian: Array（按中位数升序）
subjectMap: Map<subject, Array<journal_label>>
publisherMap: Map<publisher, Array<journal_label>>
```

### 7.2 统计计算方法

- **中位数**：奇数排列取中间值，偶数取两中间值平均
- **百分位数**：线性插值法（与 numpy/pandas percentile 默认方法一致）
- **时序聚合**：以 `accepted_date` 的年月（YYYY-MM）为键分组
- **趋势判断**：近6月中位数 - 近24月中位数，绝对值超过5天标记为有意义变化

---

## 8. UI/UX 设计规范

### 配色方案

| 含义 | 颜色 | HEX |
|------|------|-----|
| 主色调 | Tabler Blue | `#206bc4` |
| 成功/快速 | 绿色 | `#2fb344` |
| 警告/中等 | 橙色 | `#f76707` |
| 危险/慢速 | 红色 | `#d63939` |
| 中性 | 灰色 | `#626976` |

### 审稿周期颜色分级

| 天数范围 | 颜色 | 含义 |
|----------|------|------|
| ≤ 30天 | 深绿 | 极快 |
| 31-60天 | 绿色 | 快速 |
| 61-90天 | 黄绿 | 正常偏快 |
| 91-120天 | 橙黄 | 正常 |
| 121-180天 | 橙色 | 偏慢 |
| > 180天 | 红色 | 慢速 |

### 响应式断点

- 桌面（≥1200px）：4列 KPI + 双列图表
- 平板（768-1199px）：2列 KPI + 单列图表
- 移动（<768px）：1列布局，图表高度自适应

---

## 9. 与 Python 后端的集成（可选扩展）

当数据量超过 10 万条或需要实时更新时，可引入 Flask 微服务：

```python
# web/app.py（可选后端）
GET /api/journals              → 期刊列表 + 聚合统计 (JSON)
GET /api/journal/<issn>        → 单刊详情 + 时序数据
GET /api/leaderboard           → 榜单数据（最快/最慢/趋势）
GET /api/trends                → 全局趋势数据
GET /api/citation/<doi>        → 引用信息代理（避免跨域）
GET /api/impact/<issn>         → Impact Factor 代理查询
```

当前 Phase 1 采用纯静态前端方案，零部署成本，支持直接用浏览器打开 `index.html`。

---

## 10. 实施路线图

| 里程碑 | 内容 | 状态 |
|--------|------|------|
| M1 | design.md 完成 + 项目骨架（HTML/CSS/JS 框架） | ✅ 完成 |
| M2 | data-loader.js（读取/清洗/聚合 xlsx） + Dashboard 基础页面 | ✅ 完成 |
| M3 | leaderboard.html + explorer.html + 完整筛选 | ✅ 完成 |
| M4 | compare.html + 时序热力图 | ✅ 完成 |
| M5 | Phase 2 citation checker（OpenAlex/Crossref API） | ✅ 完成 |
| M6 | Phase 2 Impact Factor 检索 + 选刊辅助矩阵 | ✅ 完成 |
| M7 | serve.py 一键启动脚本 + README 使用说明 | ✅ 完成 |

---

## 11. 参考与致谢

- [Tabler UI](https://tabler.io) — MIT License
- [Apache ECharts](https://echarts.apache.org) — Apache-2.0 License
- [SheetJS Community Edition](https://sheetjs.com) — Apache-2.0 License
- [DataTables](https://datatables.net) — MIT License
- [OpenAlex](https://openalex.org) — CC0 Public Domain（API 免费使用）
- [Crossref](https://www.crossref.org) — Free for non-commercial use with attribution
