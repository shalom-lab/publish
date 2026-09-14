# 发表论文管理（React + Vite + GitHub Pages）

细粒度管理个人论文发表记录。页面默认锁定，**无 BYOK Token 不加载、不展示任何论文信息**。

站点：`https://shalom-lab.github.io/publish/`  
数据文件：[`data/publications.json`](data/publications.json)（数组，一条论文一个对象）

---

## 数据规范（新增 / 改稿时必须遵守）

> **给 AI**：用户若只丢一个文章链接（Pubmed / DOI / 期刊页），请先抓取元数据，再按本节生成**完整一条** `Publication` JSON，写入 `data/publications.json`；若有 PDF，按命名放入 `public/paper/`，并用 `npm run pdf:first` 从全文截取首页。不要发明未在本节出现的字段名。

类型定义见 [`src/types.ts`](src/types.ts)；表头中文见 [`src/lib/columns.ts`](src/lib/columns.ts)。

### 字段一览

| JSON key | 中文 | 类型 | 规则 |
|----------|------|------|------|
| `id` | ID | string | 稳定唯一。建议 `pub_{年}_{期刊缩写}_{主题词}`，如 `pub_2023_vaccine_rsv` |
| `date` | A-B（发表年月） | string | **`YYYY-MM`**，如 `2023-11`。优先 online / print 发表月 |
| `year` | 年份 | string | 四位年，如 `2023`，须与 `date` 一致 |
| `title` | 题目 | string | 论文正式标题，与原文一致 |
| `journal` | 刊物 | string | 期刊全名（英文刊用英文官方名） |
| `volume` | 卷 | string | 无则 `""` |
| `issue` | 期 | string | 无则 `""` |
| `pages` | 页码 | string | 如 `352-361` 或电子刊号 `e003850` |
| `impactFactor` | 当年 IF | string | **发表当年**影响因子；中文刊可 `""` |
| `cas` | 中科院分区 | string | 如 `医学3区`；中文刊可 `""` |
| `indexing` | 收录 | string | 如 `SCI收录` 或 `CSCD核心;北大核心;统计源` |
| `firstAuthor` | 第一作者 | string | 论文署名第一人（英文姓名保持原文拼写） |
| `authors` | 全部作者 | string | **按署名顺序**完整列表。英文：`, ` 分隔；中文：可用 `，` |
| `isFirstAuthor` | 是否第一作者 | boolean | 本人（Shaolong Ren / 任少龙）是否为一作（含共一） |
| `coFirst` | 是否共一 | boolean | 本人是否为共同第一作者 |
| `firstAuthorRank` | 一作排名 | string | 独一作 `1/1`；两人共一且本人为一作之一 `1/2`；本人非一作则 `""` |
| `isCorresponding` | 是否通讯作者 | boolean | 本人是否为通讯作者 |
| `correspondingAuthor` | 通讯作者 | string | **一般只填一人，取作者列表最后一位**；多人通讯时也优先末位，不要写成 `A; B` |
| `rank` | 本人排名 | number \| null | 本人在作者列表中的位次，从 **1** 起 |
| `authorTotal` | 作者总数 | number \| null | 作者人数；表格「本人排名」展示为 `{rank}/{authorTotal}` |
| `myContribution` | 本人贡献 | string | 可空 |
| `citations` | 引用 | string | 可空 |
| `pubmed` | Pubmed | string | 仅 `https://pubmed.ncbi.nlm.nih.gov/{pmid}/`；无则 `""`。**禁止**把 DOI 写进本字段 |
| `online` | 在线链接 | string | 优先 `https://doi.org/...`，否则期刊官网全文页 |
| `pdfFull` | 全文 PDF | string | 相对路径，见下方命名；文件在 `public/paper/` |
| `pdfFirst` | 首页 PDF | string | 同上；内容为**全文第 1 页**，不是整篇拷贝 |
| `ris` | RIS | string | Zotero 可用；可用站点「重新生成 RIS」或按现有条目格式生成 |

### 派生与一致性（写完后自检）

1. `authorTotal` = `authors` 拆分后的人数。  
2. `rank` = 本人在 `authors` 中的序号（英文名 `Shaolong Ren`，中文名 `任少龙`）。  
3. `isFirstAuthor` ⇔ `rank === 1` 或本人在共一名单内。  
4. `firstAuthorRank`：一作且非共一 → `1/1`；共一 → `1/N`（N 为共一人数）；非一作 → `""`。  
5. `correspondingAuthor`：默认 = `authors` **最后一人**；不要写分号多人。  
6. `pubmed` 与 `online` 分开；DOI 只放 `online`。  
7. 旧字段名 `totalAuthors` 已废弃，只用 `authorTotal`。

### PDF 命名与存放

路径写在 JSON 里为 `paper/{basename}__full.pdf` / `paper/{basename}__first.pdf`，物理文件在：

```text
public/paper/{basename}__full.pdf
public/paper/{basename}__first.pdf
```

`basename` 生成规则（与 [`src/lib/pdfName.ts`](src/lib/pdfName.ts) 一致）：

```text
{第一作者空格改下划线}_{年}_{杂志sanitize最长20}_{标题sanitize最长40}
```

- `sanitize`：非字母数字汉字 → `_`，压缩连续 `_`。  
- 对照应有文件名：`npx tsx scripts/list-pdf-names.mts`  
- 只有全文时：先放入 `__full.pdf`，再执行 `npm run pdf:first` **截取第 1 页**生成 `__first.pdf`。  
- Pages 预览 URL：`https://shalom-lab.github.io/publish/paper/{文件名}`（与 BYOK 无关）。

### AI 接到「文章链接」时的推荐流程

1. 解析 Pubmed / DOI / 期刊页，填 `title`、`journal`、`volume`、`issue`、`pages`、`date`、`year`、`authors`、`firstAuthor`、`pubmed`、`online`。  
2. 算 `rank`、`authorTotal`、作者角色字段（见上）。  
3. 查发表年 IF、中科院分区、收录（中文刊 IF/分区可空）。  
4. 生成 `id`、`pdfFull`/`pdfFirst` 路径；有 PDF 则改名放入 `public/paper/` 并跑 `npm run pdf:first`。  
5. 生成或更新 `ris`，把对象 **追加** 进 `data/publications.json`（保持数组、缩进 2 空格）。  
6. `git commit` & `push`，等 Pages 部署后再点「全文 / 首页」验证。

### 最小示例

```json
{
  "id": "pub_2026_bmj_gemini",
  "date": "2026-03",
  "year": "2026",
  "title": "Understanding real-world effectiveness of nirsevimab …",
  "journal": "BMJ Open Respiratory Research",
  "volume": "13",
  "issue": "1",
  "pages": "e003850",
  "impactFactor": "3.4",
  "cas": "医学3区",
  "indexing": "SCI收录",
  "firstAuthor": "Shaolong Ren",
  "authors": "Shaolong Ren, Han Zhang, Shuyu Deng, Harish Nair, You Li",
  "isFirstAuthor": true,
  "coFirst": false,
  "firstAuthorRank": "1/1",
  "isCorresponding": false,
  "correspondingAuthor": "You Li",
  "rank": 1,
  "authorTotal": 5,
  "myContribution": "",
  "citations": "",
  "pubmed": "",
  "online": "https://doi.org/10.1136/bmjresp-2025-003850",
  "pdfFull": "paper/Shaolong_Ren_2026_BMJ_Open_Respiratory_Understanding_real_world_effectiveness_o__full.pdf",
  "pdfFirst": "paper/Shaolong_Ren_2026_BMJ_Open_Respiratory_Understanding_real_world_effectiveness_o__first.pdf",
  "ris": "…"
}
```

---

## 隐私与 BYOK

- JSON 只放在 `data/`，**不**进 `public/`，避免随 Pages 裸奔。  
- Token：`localStorage['gh-token-publish']`；设置页可改 owner/repo/分支并「清除 Token」。  
- 仓库若为 public，他人仍可能通过 GitHub 网页看到 `data/publications.json`。

```js
localStorage.setItem('gh-token-publish', 'ghp_xxx')
location.reload()
```

| 项 | 说明 |
|----|------|
| Owner/Repo | 默认 `shalom-lab/publish` |
| 数据路径 | `data/publications.json` |
| 权限 | Contents: Read and write |

## 本地开发 / 部署

```bash
npm install
npm run dev          # http://localhost:5173/publish/
npm run build
npm run pdf:first    # 从 __full.pdf 截取 __first.pdf
npx tsx scripts/list-pdf-names.mts
```

Pages：仓库 Settings → Pages → Source 选 **GitHub Actions**。`public/.nojekyll` 已就绪。
