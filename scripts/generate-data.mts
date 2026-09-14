import { writeFileSync } from 'node:fs'
import { buildPdfPaths } from '../src/lib/pdfName.ts'
import { generateRis } from '../src/lib/ris.ts'
import type { Publication } from '../src/types.ts'

/**
 * 当年影响因子：SCI 保留用户原表 / 发表当年 JCR；中文刊不强求 IF。
 * 中科院分区：SCI 大类区；卷期来自 PubMed / 期刊官网。
 */
const raw: Omit<Publication, 'pdfFull' | 'pdfFirst' | 'ris'>[] = [
  {
    id: 'pub_2023_vaccine_rsv',
    date: '2023/11',
    year: '2023',
    title:
      'Modeling the optimal seasonal monoclonal antibody administration strategy for respiratory syncytial virus (RSV) prevention based on age-season specific hospitalization rate of RSV in Suzhou,China, 2016–2022',
    journal: 'Vaccine',
    volume: '42',
    issue: '2',
    pages: '352-361',
    impactFactor: '4.5',
    cas: '医学3区',
    indexing: 'SCI收录',
    firstAuthor: 'Shaolong Ren',
    authors:
      'Shaolong Ren, Qinghui Chen, Youyi Zhang, Liping Yi, Chen Qian, Yingfeng Lu, Jiaming Shen, Xiaofei Liu, Miao Jiang, Biying Wang, Jian Song, Xuejun Shao, Tao Zhang, Jianmei Tian, Genming Zhao',
    correspondingAuthor: 'Tao Zhang; Genming Zhao',
    coFirst: false,
    rank: 1,
    totalAuthors: 15,
    myContribution: '',
    citations: '',
    pubmed: 'https://pubmed.ncbi.nlm.nih.gov/38057209/',
  },
  {
    id: 'pub_2022_iorv_hosp',
    date: '2022/1',
    year: '2022',
    title:
      'Hospitalization rate of respiratory syncytial virus-associated acute lower respiratory infection among young children in Suzhou, China, 2010–2014',
    journal: 'Influenza and Other Respiratory Viruses',
    volume: '16',
    issue: '4',
    pages: '789-799',
    impactFactor: '5.6',
    cas: '医学3区',
    indexing: 'SCI收录',
    firstAuthor: 'Shaolong Ren',
    authors:
      'Shaolong Ren, Ting Shi, Wei Shan, Si Shen, Qinghui Chen, Wanqing Zhang, Zirui Dai, Jian Xue, Tao Zhang, Jianmei Tian, Genming Zhao',
    correspondingAuthor: 'Tao Zhang; Genming Zhao',
    coFirst: false,
    rank: 1,
    totalAuthors: 11,
    myContribution: '',
    citations: '',
    pubmed: 'https://pubmed.ncbi.nlm.nih.gov/34989118/',
  },
  {
    id: 'pub_2021_cjdc_rsv',
    date: '2021/11',
    year: '2021',
    title: '苏州市5岁以下儿童呼吸道合胞病毒感染的临床特征和影响因素',
    journal: '中华疾病控制杂志',
    volume: '25',
    issue: '11',
    pages: '1336-1340',
    impactFactor: '',
    cas: '',
    indexing: 'CSCD核心;北大核心;统计源',
    firstAuthor: '任少龙',
    authors: '任少龙，邵雪君，石婷，单玮，陈庆会，薛建，田健美，张涛，赵根明',
    correspondingAuthor: '张涛;赵根明',
    coFirst: false,
    rank: 1,
    totalAuthors: 9,
    myContribution: '',
    citations: '',
    pubmed: 'https://doi.org/10.16462/j.cnki.zhjbkz.2021.11.018',
  },
  {
    id: 'pub_2022_pidj_rota',
    date: '2022/5',
    year: '2022',
    title:
      'Rotavirus Infection in Children <5 Years of Age in Suzhou, China, 2013–2019: Disease Burden, Genotype Distribution and Seasonality',
    journal: 'The Pediatric Infectious Disease Journal',
    volume: '41',
    issue: '5',
    pages: '375-380',
    impactFactor: '3.6',
    cas: '医学4区',
    indexing: 'SCI收录',
    firstAuthor: 'Si Shen',
    authors:
      'Si Shen, Shaolong Ren, Liling Chen, Jian Xue, Xuejun Shao, Tao Zhang, Genming Zhao',
    correspondingAuthor: 'Tao Zhang; Genming Zhao',
    coFirst: false,
    rank: 2,
    totalAuthors: 7,
    myContribution: '',
    citations: '',
    pubmed: 'https://pubmed.ncbi.nlm.nih.gov/35067641/',
  },
  {
    id: 'pub_2024_iorv_covid',
    date: '2024/3',
    year: '2024',
    title:
      'Impact of COVID-19 nonpharmaceutical interventions on respiratory syncytial virus infections in hospitalized children',
    journal: 'Influenza and Other Respiratory Viruses',
    volume: '18',
    issue: '4',
    pages: 'e13291',
    impactFactor: '4.2',
    cas: '医学3区',
    indexing: 'SCI收录',
    firstAuthor: 'Yingfeng Lu',
    authors:
      'Yingfeng Lu, Shaolong Ren, Xuejun Shao, Jianmei Tian, Feifei Hu, Fang Yao, Tao Zhang, Genming Zhao',
    correspondingAuthor: 'Tao Zhang; Genming Zhao',
    coFirst: false,
    rank: 2,
    totalAuthors: 8,
    myContribution: '',
    citations: '',
    pubmed: 'https://pubmed.ncbi.nlm.nih.gov/38653953/',
  },
  {
    id: 'pub_2025_geohealth',
    date: '2025/5',
    year: '2025',
    title:
      'Association of Ambient Temperature and Relative Humidity With Respiratory Syncytial Virus Infections Among Hospitalized Children in Suzhou, Eastern China: A Time-Series Analysis',
    journal: 'GeoHealth',
    volume: '9',
    issue: '5',
    pages: 'e2025GH001353',
    impactFactor: '3.8',
    cas: '医学3区',
    indexing: 'SCI收录',
    firstAuthor: 'Yingfeng Lu',
    authors:
      'Yingfeng Lu, Qinghui Chen, Shaolong Ren, Youyi Zhang, Liping Yi, Chen Qian, Jiaming Shen, Xiaofei Liu, Miao Jiang, Biying Wang, Jian Song, Xuejun Shao, Tao Zhang, Jianmei Tian, Genming Zhao',
    correspondingAuthor: 'Tao Zhang; Genming Zhao',
    coFirst: false,
    rank: 3,
    totalAuthors: 15,
    myContribution: '',
    citations: '',
    pubmed: 'https://pubmed.ncbi.nlm.nih.gov/40400772/',
  },
  {
    id: 'pub_2022_shpm_review',
    date: '2022/11',
    year: '2022',
    title: '儿童呼吸道合胞病毒感染研究及防治新进展',
    journal: '上海预防医学',
    volume: '34',
    issue: '11',
    pages: '1158-1164',
    impactFactor: '',
    cas: '',
    indexing: '科技期刊',
    firstAuthor: '任少龙',
    authors: '任少龙，赵根明',
    correspondingAuthor: '赵根明',
    coFirst: false,
    rank: 1,
    totalAuthors: 2,
    myContribution: '',
    citations: '',
    pubmed: 'https://doi.org/10.19428/j.cnki.sjpm.2022.21871',
  },
  {
    id: 'pub_gemini_protocol',
    date: '2026/3',
    year: '2026',
    title:
      'Understanding real-world effectiveness of nirsevimab and the characteristics of breakthrough RSV infections: a study protocol of individual-participant-level data meta-analysis (the GEMINI study)',
    journal: 'BMJ Open Respiratory Research',
    volume: '13',
    issue: '1',
    pages: 'e003850',
    impactFactor: '3.4',
    cas: '医学3区',
    indexing: 'SCI收录',
    firstAuthor: 'Shaolong Ren',
    authors: 'Shaolong Ren, Han Zhang, Shuyu Deng, Harish Nair, You Li',
    correspondingAuthor: 'You Li',
    coFirst: false,
    rank: 1,
    totalAuthors: 5,
    myContribution: '',
    citations: '',
    pubmed: 'https://doi.org/10.1136/bmjresp-2025-003850',
  },
]

const pubs: Publication[] = raw.map((p) => {
  const paths = buildPdfPaths(p)
  const full: Publication = { ...p, ...paths, ris: '' }
  full.ris = generateRis(full)
  return full
})

writeFileSync('data/publications.json', JSON.stringify(pubs, null, 2) + '\n', 'utf8')
console.log('Wrote', pubs.length, 'publications → data/publications.json')
for (const p of pubs) {
  console.log(
    `- ${p.date} ${p.journal} ${p.volume}(${p.issue}):${p.pages} | IF ${p.impactFactor || '-'} | ${p.cas || '-'}`,
  )
}
