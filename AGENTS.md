# 发表论文入库

本仓库用于整理个人已发表论文。AI 接到文献链接、DOI、Pubmed 或 PDF 时，按本文件走完入库；字段细则见 [`README.md`](README.md)「数据规范」。

**隐私**：公开文档（本文件、README、规则）**禁止**写入本人真实姓名。匹配「本人」时只读本地 [`data/owner.local.json`](data/owner.local.json)（已 gitignore；模板见 [`data/owner.local.example.json`](data/owner.local.example.json)）。若该文件不存在，先请用户按 example 创建，**不要**把姓名写回本文件或提交进 git。

---

## 1. 目标任务

把用户丢来的一篇（或多篇）文献变成站点里可查、可点开 PDF 的完整记录。

**完工标准**

- `data/publications.json` 已追加完整 `Publication` 对象（字段与派生规则见 README）
- 若有 PDF：`public/paper/` 下已有规范命名的 `__full.pdf` 与 `__first.pdf`
- 已 `git commit` 并 `git push origin HEAD`（除非用户明确说先别提交 / 不要 push）
- 不发明 README 未列出的字段名；不把 DOI 写进 `pubmed`
- 未把本人姓名新增进任何会被提交的文档/规则

**非目标**

- 不改 UI/构建流程，除非用户同时要求
- 不提交密钥、`.env`、`data/owner.local.json`、桌面散落的未匹配 PDF 原名文件
- 不试图改写历史论文署名（`publications.json` 里作者列表是文献原文，属书目数据）

---

## 2. 背景信息

| 项 | 说明 |
|----|------|
| 站点 | GitHub Pages（owner/repo 见设置或 `src/lib/github.ts` 默认值） |
| 数据 | `data/publications.json`（数组） |
| 本人标识 | **仅** `data/owner.local.json` 的 `names` 数组（中英文等署名变体） |
| 类型 | `src/types.ts` |
| PDF | `public/paper/{basename}__full.pdf` / `__first.pdf` |
| 命名 | `src/lib/pdfName.ts`；对照可用 `npx tsx scripts/list-pdf-names.mts` |
| 截首页 | `npm run pdf:first`（缺 `tsx` 时用 `npx tsx scripts/extract-first-page.mts`） |
| 字段/RIS/派生 | [`README.md`](README.md) |
| 默认 push | `.cursor/rules/auto-commit-push.mdc` |

**常见用户说法**：「把这篇弄上去」「加进去」、丢 Pubmed/DOI/期刊链接、丢桌面 PDF 路径。

**界面约定（改展示时）**：「当年 IF」胶囊只显示数字（无 `IF` 前缀）；颜色随数值映射，越高越叶月红且高低档要拉开（见 `src/lib/ifChip.ts`）。

---

## 3. 工作要求

- 严格遵守 README 数据规范与派生自检（`rank` / `authorTotal` / 一作共一 / 通讯作者取作者列表末位等）
- 计算「本人」角色时：读取 `owner.local.json` 的 `names`，在 `authors` 中匹配（大小写与空格按原文）
- **禁止**把 `names` 抄进 AGENTS.md、README、`.cursor/rules`、commit message 正文以外的公开说明
- `date` 用 `YYYY-MM`，优先 online 月，其次 print
- `impactFactor` 填**发表当年** IF；中文刊可空。`cas` 如 `医学3区`；中文刊可空
- `correspondingAuthor` 一般只填一人（末位），不要写成 `A; B`
- 有 PDF 才写 `pdfFull`/`pdfFirst` 并落盘；无 PDF 可留路径占位或按现有条目习惯填写后说明缺文件
- 只改与本篇入库相关的文件；不要顺手重写无关 `__first.pdf`
- Windows PowerShell 下 commit message 可用 here-string，勿假设 bash HEREDOC 可用
- 交付级改动做完即 commit + push，勿再问「要不要提交」；**勿** `git add data/owner.local.json`

---

## 4. 工作流程

### Step 1 — 识别入口与查重

从链接 / DOI / PDF 文件名或全文首页提取题目与 DOI。在 `data/publications.json` 查是否已有同 DOI / 同题；已存在则只补 PDF 或修正字段，不重复追加。

### Step 2 — 读取本人标识

若存在 `data/owner.local.json`，读取 `names`。若不存在：复制 example 的说明请用户补全本地文件后继续，不要把姓名写入仓库文档。

### Step 3 — 抓取元数据

解析 Pubmed / Crossref / 期刊页 / PDF 首页，填齐：`title`、`journal`、`volume`、`issue`、`pages`、`date`、`year`、`authors`、`firstAuthor`、`pubmed`、`online`。再查发表年 IF、中科院分区、收录。

### Step 4 — 算本人角色与派生字段

用 Step 2 的 `names` 在作者列表中定位本人，计算 `rank`、`authorTotal`、`isFirstAuthor`、`coFirst`、`firstAuthorRank`、`isCorresponding`、`correspondingAuthor`（规则见 README）。生成稳定 `id`（建议 `pub_{年}_{期刊缩写}_{主题词}`）。

### Step 5 — 处理 PDF（若有）

用 `buildPdfPaths` 得到 basename；把全文复制为 `public/paper/...__full.pdf`，再生成 `__first.pdf`（可先复制一份再跑截页脚本）。JSON 中 `pdfFull` / `pdfFirst` 与文件名一致。

### Step 6 — 写 JSON 与 RIS

追加对象到 `data/publications.json`（缩进 2 空格）。生成 Zotero 可用 `ris`（可参考 `src/lib/ris.ts` / `generateRis`）。写入后做 README 中的派生自检。

### Step 7 — 提交推送

只 stage 本篇相关的 JSON 与 PDF；确认未 stage `owner.local.json`；commit 说明「加哪篇 / 为何」（可用题目关键词，不必写本人全名）；`git push origin HEAD`。可提示 Pages 部署后验证全文/首页链接。

### 入口接法

| 入口 | 步骤 |
|------|------|
| 仅 Pubmed / DOI / 期刊链接 | Step 1 → 2 → 3 → 4 → 6 → 7（无 PDF 则跳过 Step 5） |
| 仅 PDF（本地路径） | Step 1 → 2 → 3（从 PDF/DOI）→ 4 → 5 → 6 → 7 |
| 链接 + PDF | Step 1 → 2 → 3 → 4 → 5 → 6 → 7 |
| 已有条目、只补 PDF | Step 1 → 5 → 必要时改 JSON 路径 → 7 |
| 只改 IF 展示等前端 | 不走入库链；改 `src/` 后同样 commit + push |
