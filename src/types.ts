export interface Publication {
  id: string
  date: string
  year: string
  title: string
  journal: string
  volume: string
  issue: string
  pages: string
  impactFactor: string
  cas: string
  indexing: string
  firstAuthor: string
  authors: string
  /** 本人是否为第一作者（含共一） */
  isFirstAuthor: boolean
  /** 是否共同第一作者 */
  coFirst: boolean
  /** 一作席位，如 1/1 独一、1/2 两人共一 */
  firstAuthorRank: string
  /** 本人是否为通讯作者 */
  isCorresponding: boolean
  correspondingAuthor: string
  rank: number | null
  /** 作者总数 */
  authorTotal: number | null
  myContribution: string
  citations: string
  pubmed: string
  online: string
  pdfFull: string
  pdfFirst: string
  ris: string
}

export type PublicationKey = keyof Publication

export interface ColumnDef {
  key: PublicationKey
  label: string
  defaultVisible?: boolean
  sortable?: boolean
}

export interface GithubSettings {
  owner: string
  repo: string
  token: string
  branch: string
}

export const DATA_PATH = 'data/publications.json'
