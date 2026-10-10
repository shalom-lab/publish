# 发表论文入库

本仓库用于整理个人（Shaolong Ren / 任少龙）已发表论文。AI 接到文献链接、DOI、Pubmed 或 PDF 时，按本文件走完入库；字段细则见 [`README.md`](README.md)「数据规范」。

---

## 1. 目标任务

把用户丢来的一篇（或多篇）文献变成站点里可查、可点开 PDF 的完整记录。

**完工标准**

- `data/publications.json` 已追加完整 `Publication` 对象（字段与派生规则见 README）
- 若有 PDF：`public/paper/` 下已有规范命名的 `__full.pdf` 与 `__first.pdf`
- 已 `git commit` 并 `git push origin HEAD`（除非用户明确说先别提交 / 不要 push）
- 不发明 README 未列出的字段名；不把 DOI 写进 `pubmed`

**非目标**

- 不改 UI/构建流程，除非用户同时要求
- 不提交密钥、`.env`、桌面散落的未匹配 PDF 原名文件

---

## 2. 背景信息

| 项 | 说明 |
|----|------|
| 站点 | `https://shalom-lab.github.io/publish/` |
| 数据 | `data/publications.json`（数组） |
| 类型 | `src/types.ts` |
| PDF | `public/paper/{basename}__full.pdf` / `__first.pdf` |
| 命名 | `src/lib/pdfName.ts`；对照可用 `npx tsx scripts/list-pdf-names.mts` |
| 截首页 | `npm run pdf:first`（缺 `tsx` 时用 `npx tsx scripts/extract-first-page.mts`） |
| 字段/RIS/派生 | [`README.md`](README.md) |
| 本人识别 | 英文 `Shaolong Ren`；中文 `任少龙` |
| 默认 push | `.cursor/rules/auto-commit-push.mdc` |

**常见用户说法**：「把这篇弄上去」「加进去」、丢 Pubmed/DOI/期刊链接、丢桌面 PDF 路径。

**界面约定（改展示时）**：「当年 IF」用胶囊展示，颜色随数值连续映射——越高越偏叶月红（见 `src/lib/ifChip.ts`）。

---

## 3. 工作要求

- 严格遵守 README 数据规范与派生自检（`rank` / `authorTotal` / 一作共一 / 通讯作者取作者列表末位等）
- `date` 用 `YYYY-MM`，优先 online 月，其次 print
- `impactFactor` 填**发表当年** IF；中文刊可空。`cas` 如 `医学3区`；中文刊可空
- `correspondingAuthor` 一般只填一人（末位），不要写成 `A; B`
- 有 PDF 才写 `pdfFull`/`pdfFirst` 并落盘；无 PDF 可留路径占位或按现有条目习惯填写后说明缺文件
- 只改与本篇入库相关的文件；不要顺手重写无关 `__first.pdf`
- Windows PowerShell 下 commit message 可用 here-string，勿假设 bash HEREDOC 可用
- 交付级改动做完即 commit + push，勿再问「要不要提交」

---

## 4. 工作流程

### Step 1 — 识别入口与查重

从链接 / DOI / PDF 文件名或全文首页提取题目与 DOI。在 `data/publications.json` 查是否已有同 DOI / 同题；已存在则只补 PDF 或修正字段，不重复追加。

### Step 2 — 抓取元数据

解析 Pubmed / Crossref / 期刊页 / PDF 首页，填齐：`title`、`journal`、`volume`、`issue`、`pages`、`date`、`year`、`authors`、`firstAuthor`、`pubmed`、`online`。再查发表年 IF、中科院分区、收录。

### Step 3 — 算本人角色与派生字段

按作者列表计算 `rank`、`authorTotal`、`isFirstAuthor`、`coFirst`、`firstAuthorRank`、`isCorresponding`、`correspondingAuthor`（规则见 README）。生成稳定 `id`（建议 `pub_{年}_{期刊缩写}_{主题词}`）。

### Step 4 — 处理 PDF（若有）

用 `buildPdfPaths` 得到 basename；把全文复制为 `public/paper/...__full.pdf`，再生成 `__first.pdf`（可先复制一份再跑截页脚本）。JSON 中 `pdfFull` / `pdfFirst` 与文件名一致。

### Step 5 — 写 JSON 与 RIS

追加对象到 `data/publications.json`（缩进 2 空格）。生成 Zotero 可用 `ris`（可参考 `src/lib/ris.ts` / `generateRis`）。写入后做 README 中的派生自检。

### Step 6 — 提交推送

只 stage 本篇相关的 JSON 与 PDF；commit 说明「加哪篇 / 为何」；`git push origin HEAD`。可提示 Pages 部署后验证全文/首页链接。

### 入口接法

| 入口 | 步骤 |
|------|------|
| 仅 Pubmed / DOI / 期刊链接 | Step 1 → 2 → 3 → 5 → 6（无 PDF 则跳过 Step 4） |
| 仅 PDF（本地路径） | Step 1 → 2（从 PDF/DOI）→ 3 → 4 → 5 → 6 |
| 链接 + PDF | Step 1 → 2 → 3 → 4 → 5 → 6 |
| 已有条目、只补 PDF | Step 1 → 4 → 必要时改 JSON 路径 → 6 |
| 只改 IF 展示等前端 | 不走入库链；改 `src/` 后同样 commit + push |
