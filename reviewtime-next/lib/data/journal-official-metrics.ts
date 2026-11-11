export interface OfficialJournalMetrics {
  nlm_id: string
  official_name: string
  publisher: string
  homepage_url: string
  submission_url?: string
  issn?: {
    print?: string
    online?: string
  }
  summary?: {
    en: string
    zh: string
  }
  impact_factor: {
    value: string
    source: string
    quartile: string
  }
  citescore: string
  scimago?: {
    sjr: string
    quartile: string
    h_index: number
    scopus_source_id?: string
    url?: string
  }
  publisher_reported_speed: {
    first_decision: string
    acceptance_to_publication?: string
    source: string
  }
  acceptance_rate: {
    rate: string
    source: string
  }
  publishing_model: {
    type: string
    apc_usd: number | null
    apc_details?: {
      en: string
      zh: string
    }
  }
}

export const OFFICIAL_JOURNAL_METRICS: Record<string, OfficialJournalMetrics> = {
  '101528555': {
    nlm_id: '101528555',
    official_name: 'Nature Communications',
    publisher: 'Nature Portfolio / Springer Nature',
    homepage_url: 'https://www.nature.com/ncomms/',
    submission_url: 'https://mts-ncomms.nature.com/',
    summary: {
      zh: '《Nature Communications》是自然科研旗下跨学科顶级开放获取旗舰，覆盖生物、物理、化学与地球科学等前沿领域。位列 JCR 综合性期刊 Q1（IF 14.7，CiteScore 23.8）。编辑部初筛通常在 9 天左右反馈初审意见；根据 PubMed 实测文献，收稿至最终接收中位数约为 227 天。',
      en: 'Nature Communications is a leading open-access multidisciplinary journal by Nature Portfolio, publishing high-quality research across natural sciences (JCR Q1, IF 14.7, CiteScore 23.8). Initial editorial triage averages ~9 days, with an empirical median PubMed timeline from submission to acceptance of 227 days (~32.4 weeks).',
    },
    impact_factor: {
      value: '14.7',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Multidisciplinary Sciences',
    },
    citescore: '23.8',
    scimago: {
      sjr: '4.882',
      quartile: 'Q1',
      h_index: 472,
      url: 'https://www.scimagojr.com/journalsearch.php?q=19700201248&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~9 days (editorial triage)',
      source: 'Publisher website',
    },
    acceptance_rate: {
      rate: '~8%–12% (Highly selective)',
      source: 'Independent bibliometric estimate',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 6990,
      apc_details: {
        zh: '标准原创论著与综述版面费: US$6,990',
        en: 'Standard APC for research articles: US$6,990',
      },
    },
  },
  '101731738': {
    nlm_id: '101731738',
    official_name: 'NPJ Digital Medicine',
    publisher: 'Nature Portfolio / Springer Nature',
    homepage_url: 'https://www.nature.com/npjdigitalmed/',
    submission_url: 'https://mts-npjdigitalmed.nature.com/',
    summary: {
      zh: '《NPJ Digital Medicine》是自然科研与致力于数字健康的学者合作出版的领军开放获取期刊（JCR 卫生保健服务类 Q1，IF 18.0，CiteScore 19.1）。聚焦医学人工智能、移动健康与临床转化；编辑部初筛中位约 10 天，PubMed 实测从收稿至接收中位数约 149 天。',
      en: 'NPJ Digital Medicine is a premier open-access journal from Nature Portfolio covering healthcare AI, mobile health, and clinical digital innovations (JCR Q1, IF 18.0, CiteScore 19.1). Initial editorial screening takes ~10 days, with an empirical median PubMed review timeline of 149 days (~21.3 weeks).',
    },
    impact_factor: {
      value: '18.0',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Health Care Sciences & Services',
    },
    citescore: '19.1',
    scimago: {
      sjr: '3.670',
      quartile: 'Q1',
      h_index: 86,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100904094&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~10 days (editorial triage)',
      source: 'Publisher website',
    },
    acceptance_rate: {
      rate: '同行评议择优录用 (Selective Peer Review)',
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4090,
      apc_details: {
        zh: '标准原创研究版面费: US$4,090',
        en: 'Standard APC for research articles: US$4,090',
      },
    },
  },
  '101676423': {
    nlm_id: '101676423',
    official_name: 'Signal Transduction and Targeted Therapy',
    publisher: 'Springer Nature',
    homepage_url: 'https://www.nature.com/sigtrans/',
    submission_url: 'https://mts-sigtrans.nature.com/',
    summary: {
      zh: '《Signal Transduction and Targeted Therapy》(STTT) 是由华西医院与 Springer Nature 合作出版的高影响力开源期刊（JCR 细胞生物学与肿瘤学 Q1，IF 40.8，CiteScore 58.5）。聚焦重大疾病信号转导与靶向治疗新策略；初筛反馈约 7–14 天，PubMed 实测收稿至接收中位数约 108 天。',
      en: 'Signal Transduction and Targeted Therapy (STTT) is a flagship open-access journal published with Springer Nature (JCR Q1, IF 40.8, CiteScore 58.5), leading discoveries in cell signaling and targeted therapies. Editorial triage spans ~7–14 days, with an empirical median PubMed turnaround of 108 days (~15.4 weeks).',
    },
    impact_factor: {
      value: '40.8',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Cell Biology & Oncology',
    },
    citescore: '58.5',
    scimago: {
      sjr: '7.850',
      quartile: 'Q1',
      h_index: 128,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100862088&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~7–14 days (editorial screening)',
      source: 'Publisher insights',
    },
    acceptance_rate: {
      rate: '同行评议择优录用 (Selective Peer Review)',
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3790,
      apc_details: {
        zh: '标准原创研究版面费: US$3,790',
        en: 'Standard APC for research articles: US$3,790',
      },
    },
  },
  '101546952': {
    nlm_id: '101546952',
    official_name: 'Journal of Advanced Research',
    publisher: 'Elsevier',
    homepage_url: 'https://www.sciencedirect.com/journal/journal-of-advanced-research',
    submission_url: 'https://www.editorialmanager.com/jare/',
    impact_factor: {
      value: '11.4',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Multidisciplinary Sciences',
    },
    citescore: '15.2',
    publisher_reported_speed: {
      first_decision: '~12–14 days (editorial triage)',
      source: 'Elsevier Journal Insights',
    },
    acceptance_rate: {
      rate: 'Not publicly disclosed',
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4000,
    },
  },
  '101605639': {
    nlm_id: '101605639',
    official_name: 'Redox Biology',
    publisher: 'Elsevier',
    homepage_url: 'https://www.sciencedirect.com/journal/redox-biology',
    submission_url: 'https://www.editorialmanager.com/redox/',
    summary: {
      zh: '《Redox Biology》是自由基生物学与氧化还原医学领域的国际旗舰开源期刊（JCR 生物化学与分子生物学 Q1，IF 10.7，CiteScore 18.2）。聚焦氧化还原稳态、活性氧与细胞代谢机制；官方初审反馈约 17–21 天，PubMed 实测收稿至接收中位数约 92 天。',
      en: 'Redox Biology is the flagship open-access journal for redox biology and free radical research (JCR Q1, IF 10.7, CiteScore 18.2). Covering redox regulation, reactive oxygen species, and cellular pathophysiology, editorial review delivers initial decisions in ~17–21 days, with an empirical median PubMed timeline of 92 days (~13.1 weeks).',
    },
    impact_factor: {
      value: '10.7',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Biochemistry & Molecular Biology',
    },
    citescore: '18.2',
    scimago: {
      sjr: '2.520',
      quartile: 'Q1',
      h_index: 135,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100262174&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~17–21 days',
      source: 'Elsevier Journal Insights',
    },
    acceptance_rate: {
      rate: '~18% (Elsevier reported)',
      source: 'Publisher reported',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4310,
      apc_details: {
        zh: '标准原创论著版面费: US$4,310',
        en: 'Standard APC for research articles: US$4,310',
      },
    },
  },
  '9607880': {
    nlm_id: '9607880',
    official_name: 'Experimental & Molecular Medicine',
    publisher: 'Springer Nature',
    homepage_url: 'https://www.nature.com/emm/',
    submission_url: 'https://mts-emm.nature.com/',
    impact_factor: {
      value: '9.5',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Biochemistry & Molecular Biology',
    },
    citescore: '17.3',
    publisher_reported_speed: {
      first_decision: '~20–25 days',
      source: 'Publisher guidelines',
    },
    acceptance_rate: {
      rate: 'Not publicly disclosed',
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4490,
    },
  },
  '101147637': {
    nlm_id: '101147637',
    official_name: 'Cardiovascular Diabetology',
    publisher: 'BioMed Central / Springer Nature',
    homepage_url: 'https://cardiab.biomedcentral.com/',
    submission_url: 'https://www.editorialmanager.com/cdia/',
    impact_factor: {
      value: '8.5',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Cardiac & Cardiovascular Systems',
    },
    citescore: '16.2',
    publisher_reported_speed: {
      first_decision: '~16 days',
      source: 'BioMed Central metrics',
    },
    acceptance_rate: {
      rate: 'Not publicly disclosed',
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4290,
    },
  },
  '101147698': {
    nlm_id: '101147698',
    official_name: 'Molecular Cancer',
    publisher: 'BioMed Central / Springer Nature',
    homepage_url: 'https://molecular-cancer.biomedcentral.com/',
    submission_url: 'https://www.editorialmanager.com/mcba/',
    impact_factor: {
      value: '27.7',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Oncology',
    },
    citescore: '34.5',
    publisher_reported_speed: {
      first_decision: '~7 days (editorial screening)',
      source: 'BioMed Central metrics',
    },
    acceptance_rate: {
      rate: 'Not publicly disclosed',
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 5090,
    },
  },
  '101586730': {
    nlm_id: '101586730',
    official_name: 'Clinical and Molecular Hepatology',
    publisher: 'Korean Association for the Study of the Liver (KASL)',
    homepage_url: 'https://www.e-cmh.org/',
    submission_url: 'https://submit.e-cmh.org/',
    issn: {
      print: '2287-2728',
      online: '2287-285X',
    },
    summary: {
      zh: '《Clinical and Molecular Hepatology》(CMH) 是韩国肝脏研究学会 (KASL) 官方旗舰期刊，专注于消化病学与肝胆疾病前沿临床及转化研究。期刊位列 JCR Q1（最新影响因子 IF 21.7，CiteScore 28.1，SJR 4.937，H-Index 74）。编辑部提供极速初审流程（官方初审仅 7 天，录用后 4 天快速在线发表）；根据 PubMed 实测 82 篇文献统计，从收稿至完整接收的中位数仅约 26 天（约 3.7 周）。',
      en: 'Clinical and Molecular Hepatology (CMH) is the official open-access journal of the Korean Association for the Study of the Liver (KASL), leading clinical and translational liver research. Ranked JCR Q1 (IF 21.7, CiteScore 28.1, SJR 4.937, H-Index 74), the journal features rapid editorial processing (7-day first decision, 4 days to online publication post-acceptance), alongside an empirical median PubMed peer-review duration of 26 days (~3.7 weeks, n = 82).',
    },
    impact_factor: {
      value: '21.7',
      source: 'Clarivate JCR / Journal Insights',
      quartile: 'JCR Q1 · Gastroenterology & Hepatology',
    },
    citescore: '28.1',
    scimago: {
      sjr: '4.937',
      quartile: 'Q1',
      h_index: 74,
      scopus_source_id: '21100224437',
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100224437&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '7 days',
      acceptance_to_publication: '4 days',
      source: 'Official Journal Metrics (e-cmh.org)',
    },
    acceptance_rate: {
      rate: '同行评议择优录用 (Selective Peer Review)',
      source: 'KASL society peer review',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 2000,
      apc_details: {
        zh: '原创论著 / 自由投稿综述: US$2,000 (KRW 3,000,000，2026年2月1日起执行)',
        en: 'Original Articles & Unsolicited Reviews: US$2,000 (KRW 3,000,000, effective Feb 1, 2026)',
      },
    },
  },
  '101590676': {
    nlm_id: '101590676',
    official_name: 'Experimental Hematology & Oncology',
    publisher: 'BioMed Central / Springer Nature',
    homepage_url: 'https://ehoonline.biomedcentral.com/',
    submission_url: 'https://www.editorialmanager.com/ehoj/',
    impact_factor: {
      value: '9.4',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Hematology & Oncology',
    },
    citescore: '16.4',
    publisher_reported_speed: {
      first_decision: '~18–25 days',
      source: 'BioMed Central metrics',
    },
    acceptance_rate: {
      rate: 'Not publicly disclosed',
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3290,
    },
  },
  '101468937': {
    nlm_id: '101468937',
    official_name: 'Journal of Hematology & Oncology',
    publisher: 'BioMed Central / Springer Nature',
    homepage_url: 'https://jhoonline.biomedcentral.com/',
    submission_url: 'https://www.editorialmanager.com/jhon/',
    impact_factor: {
      value: '29.5',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Hematology & Oncology',
    },
    citescore: '40.1',
    publisher_reported_speed: {
      first_decision: '~14–21 days',
      source: 'BioMed Central metrics',
    },
    acceptance_rate: {
      rate: 'Not publicly disclosed',
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4990,
    },
  },
  '101608652': {
    nlm_id: '101608652',
    official_name: 'Bone Research',
    publisher: 'Springer Nature',
    homepage_url: 'https://www.nature.com/boneres/',
    submission_url: 'https://mts-boneres.nature.com/',
    impact_factor: {
      value: '14.5',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Endocrinology & Cell Biology',
    },
    citescore: '24.9',
    publisher_reported_speed: {
      first_decision: '~7–10 days (editorial triage)',
      source: 'Publisher metrics',
    },
    acceptance_rate: {
      rate: 'Not publicly disclosed',
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3405,
    },
  },
  '101771342': {
    nlm_id: '101771342',
    official_name: 'The Innovation',
    publisher: 'Elsevier / Cell Press partner',
    homepage_url: 'https://www.cell.com/the-innovation/home',
    submission_url: 'https://www.editorialmanager.com/the-innovation/',
    impact_factor: {
      value: '33.2',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Multidisciplinary Sciences',
    },
    citescore: '13.9',
    publisher_reported_speed: {
      first_decision: '~15–20 days',
      source: 'Journal editorial statement',
    },
    acceptance_rate: {
      rate: 'Not publicly disclosed',
      source: 'Editorial policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 5000,
    },
  },
  '101266600': {
    nlm_id: '101266600',
    official_name: 'Molecular Neurodegeneration',
    publisher: 'BioMed Central / Springer Nature',
    homepage_url: 'https://molecularneurodegeneration.biomedcentral.com/',
    submission_url: 'https://www.editorialmanager.com/mneu/',
    summary: {
      zh: '《Molecular Neurodegeneration》是阿尔茨海默病与神经退行性疾病领域的国际顶级开源期刊（JCR 神经科学 Q1，IF 14.9，CiteScore 22.2）。聚焦神经元退行性病变分子机制与新靶点；编辑部初审约 14–21 天，PubMed 实测收稿至接收中位数约 168 天。',
      en: 'Molecular Neurodegeneration is a premier open-access journal in Alzheimer’s and neurodegenerative diseases (JCR Q1, IF 14.9, CiteScore 22.2). Covering molecular neuropathology and targeted therapeutic strategies, initial editorial decisions take ~14–21 days, with an empirical median PubMed review timeline of 168 days (~24.0 weeks).',
    },
    impact_factor: {
      value: '14.9',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Neurosciences',
    },
    citescore: '22.2',
    scimago: {
      sjr: '4.650',
      quartile: 'Q1',
      h_index: 115,
      url: 'https://www.scimagojr.com/journalsearch.php?q=7200153320&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~14–21 days',
      source: 'BioMed Central metrics',
    },
    acceptance_rate: {
      rate: '同行评议择优录用 (Selective Peer Review)',
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3090,
      apc_details: {
        zh: '标准原创论著版面费: US$3,090',
        en: 'Standard APC for research articles: US$3,090',
      },
    },
  },
  '101723675': {
    nlm_id: '101723675',
    official_name: 'Cancer Communications',
    publisher: 'Wiley',
    homepage_url: 'https://onlinelibrary.wiley.com/journal/25233548',
    submission_url: 'https://mc.manuscriptcentral.com/cac2',
    impact_factor: {
      value: '20.1',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Oncology',
    },
    citescore: '14.5',
    publisher_reported_speed: {
      first_decision: '~14–21 days',
      source: 'Wiley editorial report',
    },
    acceptance_rate: {
      rate: '~25%–30% (Estimated)',
      source: 'Independent bibliometric estimate',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3080,
    },
  },
  '101504351': {
    nlm_id: '101504351',
    official_name: 'International Journal of Oral Science',
    publisher: 'Springer Nature',
    homepage_url: 'https://www.nature.com/ijos/',
    submission_url: 'https://mts-ijos.nature.com/',
    impact_factor: {
      value: '10.8',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Dentistry & Oral Sciences',
    },
    citescore: '20.0',
    publisher_reported_speed: {
      first_decision: '~8 days (editorial triage)',
      source: 'Publisher metrics',
    },
    acceptance_rate: {
      rate: 'Not publicly disclosed',
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3890,
    },
  },
  '101761697': {
    nlm_id: '101761697',
    official_name: 'JACC: CardioOncology',
    publisher: 'Elsevier / ACC',
    homepage_url: 'https://www.sciencedirect.com/journal/jacc-cardiooncology',
    submission_url: 'https://www.editorialmanager.com/jaccco/',
    impact_factor: {
      value: '8.5',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Cardiac & Cardiovascular Systems',
    },
    citescore: '8.3',
    publisher_reported_speed: {
      first_decision: '~14–20 days',
      source: 'Elsevier / JACC metrics',
    },
    acceptance_rate: {
      rate: 'Not publicly disclosed',
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4200,
    },
  },
}

export function getOfficialJournalMetrics(nlmId?: string): OfficialJournalMetrics | null {
  if (!nlmId) return null
  return OFFICIAL_JOURNAL_METRICS[nlmId] ?? null
}
