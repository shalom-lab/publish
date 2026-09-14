# PDF 目录

把全文 / 首页 PDF 放在本目录，命名与 `data/publications.json` 里的 `pdfFull` / `pdfFirst` 一致（可用 `npx tsx scripts/list-pdf-names.mts` 对照）。

推送到 GitHub 后，Pages 上可直接打开：

`/publish/paper/你的文件名.pdf`

浏览器会内嵌预览，不依赖 Token。
