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
  correspondingAuthor: string
  coFirst: boolean
  rank: number | null
  totalAuthors: number | null
  myContribution: string
  citations: string
  pubmed: string
  pdfFull: string
  pdfFirst: string
  ris: string
}

export type PublicationKey = keyof Publication

export interface ColumnDef {
  key: PublicationKey
  label: string
  /** default visible */
  defaultVisible?: boolean
  /** allow header click sort */
  sortable?: boolean
}

export interface GithubSettings {
  owner: string
  repo: string
  token: string
  branch: string
}

export const DATA_PATH = 'data/publications.json'
