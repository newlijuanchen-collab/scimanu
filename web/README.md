# ReviewTime — 可视化网站使用说明

> 纯静态前端（Phase 1）+ 外部 API 工具（Phase 2），无需后端服务即可运行。

---

## 快速启动

### 方式一：Python 内置服务器（推荐）

```bash
# 从项目根目录运行
cd web
python serve.py        # 默认 http://localhost:8765
# 或自定义端口
python serve.py 8080
```

浏览器会自动打开 `http://localhost:8765`。

> **为何需要 HTTP 服务器？**  
> 浏览器对本地文件（`file://`）有严格的跨域限制，无法用 `fetch()` 读取同目录下的 `.xlsx` 文件。
> 通过 HTTP 服务器访问可绕过此限制。

### 方式二：VS Code Live Server 插件

1. 安装 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 插件
2. 右键 `web/index.html` → **Open with Live Server**

### 方式三：Node.js（如已安装）

```bash
cd web
npx serve .          # 或 npx http-server -p 8765
```

---

## data.xlsx 列定义

`data.xlsx` 是唯一数据源，由 Python 后端（`reviewtime/jsonl_to_excel.py`）生成，需放在 `web/` 目录下。

前端 `data-loader.js` 自动适配以下字段名（支持多种别名）：

| 字段名（推荐） | 别名 | 类型 | 必填 | 说明 |
|--------------|------|------|------|------|
| `journal_label` | `Journal Label`, `journal_abbr` | string | ✅ | 期刊简称（聚合键） |
| `journal_name` | `Journal Name`, `journal` | string | ✅ | 期刊全名 |
| `days_received_to_accepted` | `Days Received→Accepted`, `days_review` | int | ✅ | 投稿→接受天数（核心指标） |
| `issn` | `ISSN` | string | 推荐 | 国际标准期刊号（用于 IF 检索） |
| `publisher` | `Publisher` | string | 推荐 | 出版商名称 |
| `subject` | `Subject`, `category` | string | 推荐 | 学科分类 |
| `received_date` | `Received Date`, `received` | date | 推荐 | 投稿日期 |
| `accepted_date` | `Accepted Date`, `accepted` | date | 推荐 | 接受日期 |
| `online_date` | `Online Date`, `published` | date | 可选 | 在线发布日期 |
| `doi` | `DOI` | string | 可选 | 数字对象标识符（用于 Citation 工具） |
| `title` | `Title` | string | 可选 | 论文标题 |
| `extraction_status` | `Status` | string | 可选 | `ok` / `metadata_only` |
| `confidence_score` | `Confidence` | float | 可选 | 数据可信度 0.0–1.0 |

**最小可用数据集**（仅需 3 列即可启动）：

```
journal_label | days_received_to_accepted | accepted_date
```

---

## 目录结构

```
web/
├── index.html              ← Dashboard 总览
├── leaderboard.html        ← 最快/最慢/趋势榜单
├── explorer.html           ← 期刊搜索与详情
├── compare.html            ← 多刊横向对比
├── tools/
│   ├── citation.html       ← [Phase 2] 参考文献验证 + 引用图谱
│   └── impact.html         ← [Phase 2] Impact Factor 检索 + 选刊矩阵
├── assets/
│   ├── css/app.css         ← 全站自定义样式
│   └── js/
│       ├── data-loader.js  ← 核心：xlsx 读取 + 清洗 + 聚合
│       └── charts.js       ← ECharts 图表配置工厂
├── data.xlsx               ← ⚠️ 数据文件（需手动放入或由后端生成）
├── serve.py                ← 一键启动本地服务器
├── design.md               ← 完整设计文档
└── README.md               ← 本文件
```

---

## 功能说明

### Phase 1 — 审稿周期可视化

| 页面 | 功能 |
|------|------|
| **Dashboard** | KPI 卡片 + 箱线图 + 全局趋势折线 + 期刊×月份热力图 |
| **榜单** | 最快/最慢期刊表格（DataTables 可搜索排序）+ 改善趋势榜 |
| **期刊浏览器** | 实时搜索/筛选 + 展开查看时序图 + 文章级数据预览 |
| **对比工具** | 多刊并排箱线图 + 趋势折线对比 + 统计汇总表 |

### Phase 2 — 辅助工具（外部 API，需网络）

| 工具 | 数据来源 | 功能 |
|------|---------|------|
| **Citation Checker** | Crossref + OpenAlex | 单篇查询 / 批量验证 / 引用图谱 |
| **Impact Factor 检索** | OpenAlex | 期刊指标查询 / 审稿效率×影响力散点图 |

> Phase 2 工具调用公开免费 API，结果缓存于浏览器 localStorage（24小时有效期）。

---

## 常见问题

**Q: 打开 index.html 没有数据怎么办？**  
A: 必须通过 HTTP 服务器访问（见快速启动），不能直接双击打开 HTML 文件。

**Q: 控制台报 "Failed to load data.xlsx: 404" 怎么办？**  
A: 确认 `data.xlsx` 已放入 `web/` 目录，与 `index.html` 同级。

**Q: 数据有但图表空白？**  
A: 检查 `data.xlsx` 第一行是否为列名，且 `days_received_to_accepted` 列的值在 1–1000 之间。

**Q: 想修改数据字段名？**  
A: 编辑 `assets/js/data-loader.js` 中的 `cleanRows()` 函数，在字段映射中添加别名。

**Q: Impact Factor 查不到期刊？**  
A: 优先使用 ISSN 查询（格式：`xxxx-xxxx`）。OpenAlex 覆盖约 240,000 本期刊，部分小众期刊可能未收录。

---

## 开源协议

| 依赖 | 协议 |
|------|------|
| [Tabler UI](https://tabler.io) | MIT |
| [Apache ECharts](https://echarts.apache.org) | Apache-2.0 |
| [SheetJS CE](https://sheetjs.com) | Apache-2.0 |
| [DataTables](https://datatables.net) | MIT |
| [OpenAlex](https://openalex.org) API | CC0 |
| [Crossref](https://crossref.org) API | 免费非商业 |
