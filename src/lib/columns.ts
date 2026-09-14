import type { ColumnDef } from '../types'

export const COLUMNS: ColumnDef[] = [
  { key: 'date', label: '发表年月', defaultVisible: true },
  { key: 'year', label: '发表年份', defaultVisible: true },
  { key: 'title', label: '论文题目', defaultVisible: true },
  { key: 'journal', label: '刊物名称', defaultVisible: true },
  { key: 'impactFactor', label: '当年影响因子', defaultVisible: true },
  { key: 'cas', label: '中科院分区', defaultVisible: true },
  { key: 'indexing', label: '收录情况', defaultVisible: true },
  { key: 'firstAuthor', label: '第一作者', defaultVisible: true },
  { key: 'authors', label: '全部作者', defaultVisible: true },
  { key: 'correspondingAuthor', label: '通讯作者', defaultVisible: true },
  { key: 'coFirst', label: '是否共一', defaultVisible: true },
  { key: 'rank', label: '本人排名', defaultVisible: true },
  { key: 'totalAuthors', label: '总人数', defaultVisible: true },
  { key: 'myContribution', label: '本人主要贡献', defaultVisible: true },
  { key: 'citations', label: '引用次数', defaultVisible: false },
  { key: 'pubmed', label: 'Pubmed', defaultVisible: true },
  { key: 'pdfFull', label: '全文PDF', defaultVisible: true },
  { key: 'pdfFirst', label: '首页PDF', defaultVisible: true },
  { key: 'ris', label: 'RIS', defaultVisible: false },
  { key: 'id', label: 'ID', defaultVisible: false },
]
