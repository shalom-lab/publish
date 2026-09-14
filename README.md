# 发表论文管理（React + Vite + GitHub Pages）

细粒度管理个人论文发表记录：表格展示、单元格一键复制、BYOK 在线 CRUD、Excel / PDF / RIS 导出。

## 本地开发

```bash
npm install
npm run dev
```

访问控制台提示的本地地址（默认 `http://localhost:5173/publish/`）。

## 部署 GitHub Pages

1. 将本仓库推送到 GitHub，仓库名建议为 `publish`
2. 仓库 Settings → Pages → Source 选择 **GitHub Actions**
3. 推送到 `main` 后，工作流会构建并发布
4. 站点地址：`https://<你的用户名>.github.io/publish/`

> `vite.config.ts` 中 `base` 为 `/publish/`。若改用用户主页仓库（`username.github.io`），请把 `base` 改为 `/`。

## BYOK 写回数据

页面「BYOK 设置」填写：

- Owner：GitHub 用户名
- 仓库：`publish`
- 分支：`main`
- Token：Personal Access Token（需 Contents 写权限）

保存后点「保存到 GitHub」，会更新仓库中的 `public/data/publications.json`。Token 仅存在当前标签页的 `sessionStorage`。

## PDF 命名规范

将 PDF 放入 `public/paper/`，命名：

```text
{第一作者}_{发表年份}_{杂志名}_{标题截断}__full.pdf
{第一作者}_{发表年份}_{杂志名}_{标题截断}__first.pdf
```

编辑表单中可点「按规则生成 PDF 文件名」。JSON 中 `pdfFull` / `pdfFirst` 需与实际文件名一致。

## 字段说明

发表年月、年份、题目、刊物、当年影响因子、中科院分区、收录、第一作者、全部作者、通讯作者、是否共一、本人排名、总人数、本人主要贡献、引用、Pubmed、全文/首页 PDF、RIS。

## 脚本

```bash
# 按脚本重新生成初始 publications.json（会覆盖现有数据）
npx tsx scripts/generate-data.mts

# 列出每条文献应对应的 PDF 文件名（放入 public/paper/）
npx tsx scripts/list-pdf-names.mts
```
