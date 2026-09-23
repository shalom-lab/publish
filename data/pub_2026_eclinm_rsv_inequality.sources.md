# 论文信息核对记录

核对日期：2026-09-23。记录 ID：`pub_2026_eclinm_rsv_inequality`。

- 用户提供的[正式文章链接](https://www.sciencedirect.com/science/article/pii/S2589537026004724)，并确认文章已 online。
- 用户提供的 PDF `Shaolomg Rne.pdf`：14 页。第 1 页提供正式标题、8 位作者、共同第一作者脚注、通讯作者、卷号 100、文章号 104219 和 DOI `10.1016/j.eclinm.2026.104219`；第 12 页提供作者贡献。
- Shaolong Ren 与 Bingbing Cong 为共同第一作者；本人署名第 1/8 位，共一席位按项目约定填 `1/2`；通讯作者为 You Li。
- PDF 首页标注 `Published Online xxx`，页脚为 October 2026。正式网站抓取失败，浏览器读取超时，Crossref DOI 查询返回 404；因此 `date` 暂用可核实的卷期日期 `2026-10`，不是已核实的 online 月份。后续获取正式 online 日期后应更新此字段及 RIS 日期。
- PubMed 检索暂未找到正式记录，`pubmed` 留空；不以预印本替代正式论文。
- `impactFactor` 留空：2026 年度 JIF 尚未公布。[期刊指标来源](https://referencecitationanalysis.com/InCiteJournalInfo?id=171863)所列 12.8 是 **2025 JIF（2026 年发布）**，不作为 2026 年度 JIF 填入。
- `cas` 为医学1区，依据[科研通期刊页](https://www.ablesci.com/journal/detail?id=r82Zb5)的 **2025 年中科院分区**；SCI/SCIE 收录由上述期刊指标来源交叉核对。这是期刊收录情况，不表示新文章已完成数据库收录。
- 全文 PDF 保留用户原文件字节；首页 PDF 仅提取全文第 1 页，已核对页数、文本并渲染检查。现有 `pdf:first` 脚本要求首页文件预先存在且会重写所有旧首页，本次使用 pypdf 只提取新增论文首页。
