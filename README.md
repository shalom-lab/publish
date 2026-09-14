# 发表论文管理（React + Vite + GitHub Pages）

细粒度管理个人论文发表记录。页面默认锁定，**无 BYOK Token 不加载、不展示任何论文信息**。

## 隐私模型

- 论文 JSON 存放在仓库 [`data/publications.json`](data/publications.json)，**不**放入 `public/`，因此不会随 Pages 静态资源公开托管。
- 浏览器只从 `localStorage['gh-token-publish']` 读取 Token（也可在解锁页粘贴）。
- 有 Token 后，经 GitHub Contents API 拉取/写回 `data/publications.json`。

> 若仓库为 **public**，他人仍可能通过 GitHub 网页或 raw 链接看到该文件。若要真正保密，请将仓库设为 **private**，或使用 fine-grained PAT 仅本人可访问。

预先注入示例：

```js
localStorage.setItem('gh-token-publish', 'ghp_xxx')
location.reload()
```

## 本地开发

```bash
npm install
npm run dev
```

打开 `http://localhost:5173/publish/`。无 Token 时仅显示解锁页。

## 部署 GitHub Pages

1. 推送到 GitHub 仓库 `publish`
2. Settings → Pages → Source 选 **GitHub Actions**
3. 站点：`https://shalom-lab.github.io/publish/`

## BYOK

| 项 | 说明 |
|----|------|
| Token 键 | `localStorage.gh-token-publish` |
| Owner/Repo | 默认 `shalom-lab/publish`，可在设置中改（另存 `publish_github_meta`） |
| 数据路径 | `data/publications.json` |
| 权限 | Contents: Read and write |

解锁后可「保存到 GitHub」。退出请到右上角设置里「清除 Token」（会同时清空页面数据）。

## PDF（Pages 静态预览）

「全文 / 首页」是普通链接，指向站点上的静态文件，例如：

`https://shalom-lab.github.io/publish/paper/xxx__full.pdf`

浏览器会用内置 PDF 阅读器预览（与 BYOK 无关）。文件必须放在 **`public/paper/`** 并推送到仓库，才会进入 Pages 构建产物。

命名：

```text
{第一作者}_{发表年份}_{杂志名}_{标题截断}__full.pdf
{第一作者}_{发表年份}_{杂志名}_{标题截断}__first.pdf
```

对照文件名：

```bash
npx tsx scripts/list-pdf-names.mts
```

仓库根目录已有 `.nojekyll`（随 `public/` 发布），避免 Jekyll 过滤路径。

## 脚本

```bash
npx tsx scripts/generate-data.mts
npx tsx scripts/list-pdf-names.mts
```
