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
