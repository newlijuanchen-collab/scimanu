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
    rate: string | {
      en: string
      zh: string
    }
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
  // 1. Nature Communications
  '101528555': {
    nlm_id: '101528555',
    official_name: 'Nature Communications',
    publisher: 'Nature Portfolio / Springer Nature',
    homepage_url: 'https://www.nature.com/ncomms/',
    submission_url: 'https://mts-ncomms.nature.com/',
    issn: { online: '2041-1723' },
    summary: {
      zh: '《Nature Communications》是自然科研 (Nature Portfolio) 旗下的综合性多学科顶级开放获取旗舰期刊。致力于快速发表生物科学、物理学、化学、地球与环境科学以及前沿材料领域的突破性研究进展，强调研究成果对广泛跨学科同行的重要推动意义。',
      en: 'Nature Communications is a premier open-access multidisciplinary journal published by Nature Portfolio. It delivers high-impact, rigorously peer-reviewed research advancing fundamental discoveries across the biological, chemical, physical, earth, and materials sciences.',
    },
    impact_factor: {
      value: '14.7',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Multidisciplinary Sciences',
    },
    citescore: '23.8',
    scimago: {
      sjr: '4.904',
      quartile: 'Q1',
      h_index: 634,
      url: 'https://www.scimagojr.com/journalsearch.php?q=19700201248&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~9 days (editorial triage)',
      source: 'Publisher website',
    },
    acceptance_rate: {
      rate: {
        zh: '~8%–12% (高度择优)',
        en: '~8%–12% (Highly selective)',
      },
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

  // 2. NPJ Digital Medicine
  '101731738': {
    nlm_id: '101731738',
    official_name: 'NPJ Digital Medicine',
    publisher: 'Nature Portfolio / Springer Nature',
    homepage_url: 'https://www.nature.com/npjdigitalmed/',
    submission_url: 'https://mts-npjdigitalmed.nature.com/',
    issn: { online: '2398-6352' },
    summary: {
      zh: '《NPJ Digital Medicine》是自然科研旗下的高水平同行评审开放获取期刊。重点关注医学人工智能、数字生物标志物、远程患者监测、可穿戴设备以及真实世界数据驱动的临床决策系统，推动数字技术在疾病预防、诊断和个性化治疗中的转化落地。',
      en: 'NPJ Digital Medicine is a leading peer-reviewed open-access journal published by Nature Portfolio. It is dedicated to transforming healthcare through digital health innovations, clinical artificial intelligence, wearable biosensors, decentralized clinical trials, and real-world medical data analytics.',
    },
    impact_factor: {
      value: '18.0',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Health Care Sciences & Services',
    },
    citescore: '19.1',
    scimago: {
      sjr: '4.215',
      quartile: 'Q1',
      h_index: 130,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100904094&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~10 days (editorial triage)',
      source: 'Publisher website',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用',
        en: 'Selective Peer Review',
      },
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

  // 3. Signal Transduction and Targeted Therapy
  '101676423': {
    nlm_id: '101676423',
    official_name: 'Signal Transduction and Targeted Therapy',
    publisher: 'Springer Nature',
    homepage_url: 'https://www.nature.com/sigtrans/',
    submission_url: 'https://mts-sigtrans.nature.com/',
    issn: { online: '2059-3635' },
    summary: {
      zh: '《Signal Transduction and Targeted Therapy》(STTT) 是由四川大学华西医院与 Springer Nature 合作创办的高影响力学术期刊。聚焦肿瘤、免疫性疾病、心血管疾病等重大人类疾病中的分子信号转导机制，报道前沿小分子抑制剂、抗体偶联药物、核酸药物及细胞靶向治疗的临床转化成果。',
      en: 'Signal Transduction and Targeted Therapy (STTT) is an authoritative open-access journal co-published with Springer Nature. The journal covers critical molecular signaling networks governing human diseases, highlighting targeted small molecules, immunotherapies, antibody-drug conjugates, and cellular therapeutics.',
    },
    impact_factor: {
      value: '40.8',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Cell Biology & Oncology',
    },
    citescore: '58.5',
    scimago: {
      sjr: '17.740',
      quartile: 'Q1',
      h_index: 224,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100862088&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~7–14 days (editorial screening)',
      source: 'Publisher insights',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用',
        en: 'Selective Peer Review',
      },
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

  // 4. Clinical and Molecular Hepatology
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
      zh: '《Clinical and Molecular Hepatology》(CMH) 是韩国肝脏研究学会 (KASL) 主办的国际同行评审开放获取旗舰期刊。期刊致力于推动肝胆系统疾病的基础与转化医学研究，重点收录病毒性肝炎、代谢相关脂肪性肝病 (MASLD/MASH)、肝纤维化与肝硬化门脉高压、终末期肝衰竭以及肝细胞癌等前沿诊疗领域的原创论著、系统综述与临床实践指南。',
      en: 'Clinical and Molecular Hepatology (CMH) is the official peer-reviewed open-access journal of the Korean Association for the Study of the Liver (KASL). The journal publishes high-impact original articles, reviews, and clinical practice guidelines covering viral hepatitis, metabolic dysfunction-associated steatotic liver disease (MASLD/MASH), cirrhosis, portal hypertension, and hepatocellular carcinoma therapeutics.',
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
      rate: {
        zh: '同行评议择优录用',
        en: 'Selective Peer Review',
      },
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

  // 5. Molecular Cancer
  '101147698': {
    nlm_id: '101147698',
    official_name: 'Molecular Cancer',
    publisher: 'BioMed Central / Springer Nature',
    homepage_url: 'https://molecular-cancer.biomedcentral.com/',
    submission_url: 'https://www.editorialmanager.com/mcba/',
    issn: { online: '1476-4598' },
    summary: {
      zh: '《Molecular Cancer》是 BioMed Central 旗下的国际顶级肿瘤分子生物学开源期刊。重点发表恶性肿瘤发生发展、肿瘤微环境重塑、免疫逃逸、表观遗传调控以及耐药机制等方面的机制性论著与高水平综述，致力于搭建基础肿瘤学通往精准临床治疗的桥梁。',
      en: 'Molecular Cancer is a leading open-access journal published by BioMed Central. It focuses on mechanistic discoveries in oncogenesis, tumor microenvironment plasticity, immune evasion, epigenetic alterations, and therapeutic resistance, bridging fundamental cancer biology with precision medicine.',
    },
    impact_factor: {
      value: '27.7',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Oncology',
    },
    citescore: '34.5',
    scimago: {
      sjr: '9.908',
      quartile: 'Q1',
      h_index: 242,
      url: 'https://www.scimagojr.com/journalsearch.php?q=19864&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~7 days (editorial screening)',
      source: 'BioMed Central metrics',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用',
        en: 'Selective Peer Review',
      },
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 5090,
      apc_details: {
        zh: '标准原创论著版面费: US$5,090',
        en: 'Standard APC for research articles: US$5,090',
      },
    },
  },

  // 6. Journal of Hematology & Oncology
  '101468937': {
    nlm_id: '101468937',
    official_name: 'Journal of Hematology & Oncology',
    publisher: 'BioMed Central / Springer Nature',
    homepage_url: 'https://jhoonline.biomedcentral.com/',
    submission_url: 'https://www.editorialmanager.com/jhon/',
    issn: { online: '1756-8722' },
    summary: {
      zh: '《Journal of Hematology & Oncology》(JHO) 是血液肿瘤与转化肿瘤学领域的权威开放获取期刊。收稿范围涵盖造血系统恶性肿瘤、CAR-T 细胞免疫疗法、造血干细胞移植、实体瘤免疫微环境以及分子靶向药物临床试验等前沿热点领域。',
      en: 'Journal of Hematology & Oncology (JHO) is a premier peer-reviewed open-access journal in hematologic malignancies and translational oncology. It publishes breakthrough findings in hematopoiesis, cellular therapies (such as CAR-T), stem cell transplantation, immune checkpoint blockade, and clinical trials.',
    },
    impact_factor: {
      value: '29.5',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Hematology & Oncology',
    },
    citescore: '38.6',
    scimago: {
      sjr: '11.824',
      quartile: 'Q1',
      h_index: 171,
      url: 'https://www.scimagojr.com/journalsearch.php?q=19700188323&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~14–21 days',
      source: 'BioMed Central metrics',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用',
        en: 'Selective Peer Review',
      },
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4990,
      apc_details: {
        zh: '标准原创论著版面费: US$4,990',
        en: 'Standard APC for research articles: US$4,990',
      },
    },
  },

  // 7. Molecular Neurodegeneration
  '101266600': {
    nlm_id: '101266600',
    official_name: 'Molecular Neurodegeneration',
    publisher: 'BioMed Central / Springer Nature',
    homepage_url: 'https://molecularneurodegeneration.biomedcentral.com/',
    submission_url: 'https://www.editorialmanager.com/mneu/',
    issn: { online: '1750-1326' },
    summary: {
      zh: '《Molecular Neurodegeneration》是神经退行性疾病研究领域的国际旗舰开放获取学术期刊。重点收录阿尔茨海默病、帕金森病、肌萎缩侧索硬化症 (ALS) 及朊病毒病等中枢神经系统疾病的突触病理、蛋白异常聚集、胶质细胞炎症机制及前沿神经保护治疗策略。',
      en: 'Molecular Neurodegeneration is the flagship open-access forum for neurodegenerative disease research. It covers molecular pathways underlying Alzheimer’s disease, Parkinson’s disease, amyotrophic lateral sclerosis (ALS), protein misfolding, neuroinflammation, and novel neuroprotective interventions.',
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
      rate: {
        zh: '同行评议择优录用',
        en: 'Selective Peer Review',
      },
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

  // 8. Redox Biology
  '101605639': {
    nlm_id: '101605639',
    official_name: 'Redox Biology',
    publisher: 'Elsevier',
    homepage_url: 'https://www.sciencedirect.com/journal/redox-biology',
    submission_url: 'https://www.editorialmanager.com/redox/',
    issn: { online: '2213-2317' },
    summary: {
      zh: '《Redox Biology》是国际自由基生物与医学学会 (SfRBM) 及欧洲自由基研究学会 (SFRR-E) 官方合作的开放获取权威期刊。聚焦活性氧/活性氮 (ROS/RNS)、氧化还原信号转导、铁死亡、线粒体代谢以及氧化还原失衡在心血管、肿瘤与衰老等病理过程中的机制研究。',
      en: 'Redox Biology is the official open-access journal of the Society for Free Radical Biology and Medicine (SfRBM) and SFRR-Europe. It advances research in reactive oxygen and nitrogen species, redox cell signaling, ferroptosis, mitochondrial bioenergetics, and metabolic disease pathophysiology.',
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
      rate: {
        zh: '~18% (出版商统计)',
        en: '~18% (Elsevier reported)',
      },
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

  // 9. Journal of Advanced Research
  '101546952': {
    nlm_id: '101546952',
    official_name: 'Journal of Advanced Research',
    publisher: 'Elsevier',
    homepage_url: 'https://www.sciencedirect.com/journal/journal-of-advanced-research',
    submission_url: 'https://www.editorialmanager.com/jare/',
    issn: { print: '2090-1232', online: '2090-1224' },
    summary: {
      zh: '《Journal of Advanced Research》(JAR) 是由开罗大学主办、Elsevier 出版发行的综合性跨学科开放获取期刊。主要刊登纳米技术、生物技术、药理学与毒理学、再生医学以及应用生命科学等交叉学科领域的具有前瞻性的原创科研论著与前沿评述。',
      en: 'Journal of Advanced Research (JAR) is a high-impact multidisciplinary peer-reviewed open-access journal published by Elsevier. It features cutting-edge contributions in nanotechnology, biotechnology, pharmacology, regenerative medicine, and applied biomedical engineering.',
    },
    impact_factor: {
      value: '11.4',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Multidisciplinary Sciences',
    },
    citescore: '18.7',
    scimago: {
      sjr: '3.148',
      quartile: 'Q1',
      h_index: 122,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100201633&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~12–14 days (editorial triage)',
      source: 'Elsevier Journal Insights',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用',
        en: 'Selective Peer Review',
      },
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4000,
      apc_details: {
        zh: '标准原创论著版面费: US$4,000',
        en: 'Standard APC for research articles: US$4,000',
      },
    },
  },

  // 10. The Innovation
  '101771342': {
    nlm_id: '101771342',
    official_name: 'The Innovation',
    publisher: 'Cell Press / The Innovation Press',
    homepage_url: 'https://www.cell.com/the-innovation/home',
    submission_url: 'https://www.editorialmanager.com/the-innovation/',
    issn: { online: '2666-6758' },
    summary: {
      zh: '《The Innovation》是由中国青年科学家与 Cell Press 合作创办的高起点综合性英文学术期刊。旨在展示自然科学、生命医学、物质科学以及工程前沿领域的颠覆性与原创性发现，致力于打造连接中国杰出科研成果与全球学术共同体的桥梁。',
      en: 'The Innovation is a flagship multidisciplinary open-access journal established by prominent young scholars in collaboration with Cell Press. It publishes transformative research and insightful perspectives across the biological, medical, chemical, physical, and technological sciences.',
    },
    impact_factor: {
      value: '33.2',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Multidisciplinary Sciences',
    },
    citescore: '35.8',
    scimago: {
      sjr: '5.057',
      quartile: 'Q1',
      h_index: 30,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21101037229&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~15–20 days',
      source: 'Cell Press guidelines',
    },
    acceptance_rate: {
      rate: {
        zh: '极高门槛择优录用',
        en: 'Highly selective peer review',
      },
      source: 'Editorial board policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 5000,
      apc_details: {
        zh: '标准原创研究版面费: US$5,000',
        en: 'Standard APC for research articles: US$5,000',
      },
    },
  },

  // 11. Cancer Communications
  '101723675': {
    nlm_id: '101723675',
    official_name: 'Cancer Communications',
    publisher: 'Wiley',
    homepage_url: 'https://onlinelibrary.wiley.com/journal/25233548',
    submission_url: 'https://mc.manuscriptcentral.com/cac2',
    issn: { online: '2523-3548' },
    summary: {
      zh: '《Cancer Communications》是中山大学肿瘤防治中心官方主办、Wiley 出版发行的国际肿瘤学学术期刊。重点发表消化系统肿瘤、鼻咽癌、肺癌等实体瘤的分子诊断、分子标志物筛查、新型靶向药物及放化疗综合治疗模式的临床转化成果。',
      en: 'Cancer Communications is the official peer-reviewed open-access journal of the Sun Yat-sen University Cancer Center, published by Wiley. It highlights translational discoveries in clinical oncology, cancer biomarkers, molecular diagnostics, and innovative multimodality cancer therapies.',
    },
    impact_factor: {
      value: '20.1',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Oncology',
    },
    citescore: '23.5',
    scimago: {
      sjr: '7.986',
      quartile: 'Q1',
      h_index: 94,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100862089&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~14–21 days',
      source: 'Wiley metrics',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用',
        en: 'Selective Peer Review',
      },
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3080,
      apc_details: {
        zh: '标准原创论著版面费: US$3,080',
        en: 'Standard APC for research articles: US$3,080',
      },
    },
  },

  // 12. International Journal of Oral Science
  '101504351': {
    nlm_id: '101504351',
    official_name: 'International Journal of Oral Science',
    publisher: 'Springer Nature',
    homepage_url: 'https://www.nature.com/ijos/',
    submission_url: 'https://mts-ijos.nature.com/',
    issn: { print: '1674-2818', online: '2049-3169' },
    summary: {
      zh: '《International Journal of Oral Science》(IJOS) 是由四川大学华西口腔医学院主办、Springer Nature 合作出版的国际口腔医学旗舰期刊。专注于牙颌面骨再生、口腔微生态、口腔颌面肿瘤分子病理以及新型生物相容性口腔材料的前沿基础与临床研究。',
      en: 'International Journal of Oral Science (IJOS) is the official open-access journal of West China School of Stomatology, published in partnership with Springer Nature. It features fundamental and clinical research in oral microbiology, craniofacial tissue engineering, oral oncology, and biomaterials.',
    },
    impact_factor: {
      value: '10.8',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Dentistry, Oral Surgery & Medicine',
    },
    citescore: '16.5',
    scimago: {
      sjr: '3.506',
      quartile: 'Q1',
      h_index: 83,
      url: 'https://www.scimagojr.com/journalsearch.php?q=19700188320&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~8 days (editorial triage)',
      source: 'Publisher website',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用',
        en: 'Selective Peer Review',
      },
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3890,
      apc_details: {
        zh: '标准原创论著版面费: US$3,890',
        en: 'Standard APC for research articles: US$3,890',
      },
    },
  },

  // 13. Bone Research
  '101608652': {
    nlm_id: '101608652',
    official_name: 'Bone Research',
    publisher: 'Springer Nature',
    homepage_url: 'https://www.nature.com/boneres/',
    submission_url: 'https://mts-boneres.nature.com/',
    issn: { online: '2095-4700' },
    summary: {
      zh: '《Bone Research》是由四川大学主办、Springer Nature 合作出版的骨科学与矿化组织研究领域的顶级学术期刊。深入报道成骨破骨细胞分化、软骨基质修复、骨质疏松与骨关节炎分子机制以及骨组织工程支架材料的国际前沿突破。',
      en: 'Bone Research is a premier open-access journal co-published with Springer Nature, delivering fundamental and clinical discoveries in bone biology, osteoclast/osteoblast signaling, cartilage regeneration, osteoporosis, osteoarthritis, and skeletal tissue engineering.',
    },
    impact_factor: {
      value: '14.5',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Cell Biology & Endocrinology',
    },
    citescore: '21.4',
    scimago: {
      sjr: '4.048',
      quartile: 'Q1',
      h_index: 76,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100257019&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~7–10 days (editorial triage)',
      source: 'Publisher website',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用',
        en: 'Selective Peer Review',
      },
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3405,
      apc_details: {
        zh: '标准原创论著版面费: US$3,405',
        en: 'Standard APC for research articles: US$3,405',
      },
    },
  },

  // 14. Cardiovascular Diabetology
  '101147637': {
    nlm_id: '101147637',
    official_name: 'Cardiovascular Diabetology',
    publisher: 'BioMed Central / Springer Nature',
    homepage_url: 'https://cardiab.biomedcentral.com/',
    submission_url: 'https://www.editorialmanager.com/cdia/',
    issn: { online: '1475-2840' },
    summary: {
      zh: '《Cardiovascular Diabetology》是 BioMed Central 旗下的国际专业学术期刊。专注于代谢紊乱与心血管并发症的交叉机制研究，包括胰岛素抵抗、糖尿病性心肌病、冠状动脉微血管功能障碍、动脉粥样硬化血栓形成以及新型降糖药物的心脏保护效应。',
      en: 'Cardiovascular Diabetology is a dedicated open-access journal published by BioMed Central. It explores the nexus of diabetes, metabolic syndrome, and cardiovascular disease, highlighting diabetic cardiomyopathy, vascular biology, insulin resistance, and cardioprotective pharmacology.',
    },
    impact_factor: {
      value: '8.5',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Cardiac & Cardiovascular Systems',
    },
    citescore: '16.2',
    scimago: {
      sjr: '4.447',
      quartile: 'Q1',
      h_index: 135,
      url: 'https://www.scimagojr.com/journalsearch.php?q=19865&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~16 days',
      source: 'BioMed Central metrics',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用',
        en: 'Selective Peer Review',
      },
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4290,
      apc_details: {
        zh: '标准原创论著版面费: US$4,290',
        en: 'Standard APC for research articles: US$4,290',
      },
    },
  },

  // 15. Experimental Hematology & Oncology
  '101590676': {
    nlm_id: '101590676',
    official_name: 'Experimental Hematology & Oncology',
    publisher: 'BioMed Central / Springer Nature',
    homepage_url: 'https://ehoonline.biomedcentral.com/',
    submission_url: 'https://www.editorialmanager.com/ehoj/',
    issn: { online: '2162-3619' },
    summary: {
      zh: '《Experimental Hematology & Oncology》(EHO) 是 BioMed Central 旗下的前沿开放获取学术期刊。主要报道恶性血液病与实体瘤的发病机制、靶向药物研发、耐药逆转策略、免疫检查点阻断治疗及造血干细胞移植等转化研究成果。',
      en: 'Experimental Hematology & Oncology (EHO) is an open-access journal published by BioMed Central. It presents preclinical and clinical studies on hematologic malignancies, solid tumors, targeted small-molecule inhibitors, immunotherapy, and stem cell biology.',
    },
    impact_factor: {
      value: '9.4',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Hematology & Oncology',
    },
    citescore: '16.4',
    scimago: {
      sjr: '4.126',
      quartile: 'Q1',
      h_index: 58,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100242250&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~18–25 days',
      source: 'BioMed Central metrics',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用',
        en: 'Selective Peer Review',
      },
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3290,
      apc_details: {
        zh: '标准原创论著版面费: US$3,290',
        en: 'Standard APC for research articles: US$3,290',
      },
    },
  },

  // 16. JACC: CardioOncology
  '101761697': {
    nlm_id: '101761697',
    official_name: 'JACC: CardioOncology',
    publisher: 'American College of Cardiology / Elsevier',
    homepage_url: 'https://www.jacc.org/journal/cardiooncology',
    submission_url: 'https://www.editorialmanager.com/jacco/',
    issn: { online: '2666-0873' },
    summary: {
      zh: '《JACC: CardioOncology》是美国心脏病学会 (ACC) 旗舰 JACC 家族旗下专注于肿瘤心脏病学的核心同行评审期刊。收录化疗药物心脏毒性监测、靶向及免疫治疗相关心肌炎、肿瘤患者心血管疾病合并症管理以及心脏影像学早期评估等前沿论著。',
      en: 'JACC: CardioOncology is an official open-access journal of the American College of Cardiology (ACC). It focuses on the cardiovascular care of cancer patients, cardiotoxicity monitoring, immune checkpoint inhibitor myocarditis, and survivorship cardiovascular health.',
    },
    impact_factor: {
      value: '8.5',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Cardiac & Cardiovascular Systems',
    },
    citescore: '13.5',
    scimago: {
      sjr: '3.768',
      quartile: 'Q1',
      h_index: 42,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100984857&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~14–20 days',
      source: 'Elsevier / ACC guidelines',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用',
        en: 'Selective Peer Review',
      },
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4200,
      apc_details: {
        zh: '标准原创论著版面费: US$4,200',
        en: 'Standard APC for research articles: US$4,200',
      },
    },
  },

  // 17. Experimental & Molecular Medicine
  '9607880': {
    nlm_id: '9607880',
    official_name: 'Experimental & Molecular Medicine',
    publisher: 'Springer Nature',
    homepage_url: 'https://www.nature.com/emm/',
    submission_url: 'https://mts-emm.nature.com/',
    issn: { print: '1226-3613', online: '2092-6413' },
    summary: {
      zh: '《Experimental & Molecular Medicine》(EMM) 是大韩生物化学与分子生物学会 (KSBMB) 官方会刊、Springer Nature 合作出版的亚太地区历史悠久的顶尖转化医学期刊。致力于报道分子遗传学、细胞死亡机制、感染与免疫、肿瘤代谢以及基因治疗等分子医学前沿成果。',
      en: 'Experimental & Molecular Medicine (EMM) is the official open-access journal of the Korean Society for Biochemistry and Molecular Biology (KSBMB), published with Springer Nature. It showcases foundational and translational studies in molecular genetics, cell death, immunology, and cancer metabolism.',
    },
    impact_factor: {
      value: '9.5',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Biochemistry & Molecular Biology',
    },
    citescore: '17.3',
    scimago: {
      sjr: '5.123',
      quartile: 'Q1',
      h_index: 154,
      url: 'https://www.scimagojr.com/journalsearch.php?q=19863&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~20–25 days',
      source: 'Publisher guidelines',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用',
        en: 'Selective Peer Review',
      },
      source: 'Publisher policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4490,
      apc_details: {
        zh: '标准原创论著版面费: US$4,490',
        en: 'Standard APC for research articles: US$4,490',
      },
    },
  },
// 18. PLOS ONE
  '101285081': {
    nlm_id: '101285081',
    official_name: 'PLOS ONE',
    publisher: 'Public Library of Science (PLOS)',
    homepage_url: 'https://journals.plos.org/plosone/',
    submission_url: 'https://www.editorialmanager.com/pone/',
    issn: { online: '1932-6203' },
    summary: {
      zh: '《PLOS ONE》是由公共科学图书馆出版的同行评审全开放获取综合性科学期刊。涵盖自然科学、工程技术、医学以及相关交叉领域，强调根据研究方法学严谨性与数据完整性进行评审，而非主观新颖性，促进全球科学交流的开放与普惠。',
      en: 'PLOS ONE is a peer-reviewed open-access multidisciplinary scientific journal published by the Public Library of Science. It accepts research across all scientific, engineering, and medical disciplines based on methodological rigor and scientific integrity rather than subjective assessments of perceived novelty.',
    },
    impact_factor: {
      value: '2.8',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Multidisciplinary Sciences',
    },
    citescore: '4.8',
    scimago: {
      sjr: '0.726',
      quartile: 'Q1',
      h_index: 500,
      url: 'https://www.scimagojr.com/journalsearch.php?q=10600153309&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~38 days',
      acceptance_to_publication: '~14 days',
      source: 'PLOS published turnaround metrics',
    },
    acceptance_rate: {
      rate: {
        zh: '约 48% (方法学规范同行评议)',
        en: '~48% (Rigorous peer review on methodology)',
      },
      source: 'Official PLOS Editorial Statistics',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 2290,
      apc_details: {
        zh: '原创论著文章处理费: US$2,290',
        en: 'Standard APC for research articles: US$2,290',
      },
    },
  },

  // 19. eClinicalMedicine
  '101733727': {
    nlm_id: '101733727',
    official_name: 'eClinicalMedicine',
    publisher: 'The Lancet / Elsevier',
    homepage_url: 'https://www.thelancet.com/journals/eclinm/home',
    submission_url: 'https://www.editorialmanager.com/eclinm/',
    issn: { online: '2589-5370' },
    summary: {
      zh: '《eClinicalMedicine》是柳叶刀发现科学（The Lancet Discovery Science）旗下的旗舰临床转化开放获取期刊。致力于快速发表具有深远公共卫生意义的原创临床试验、流行病学分析、循证医学评估和重大疾病防治前沿成果。',
      en: 'eClinicalMedicine is a premier open-access clinical journal part of The Lancet Discovery Science portfolio. It publishes high-impact clinical trials, observational studies, epidemiological investigations, and global health research that directly inform clinical practice and public healthcare policy.',
    },
    impact_factor: {
      value: '15.1',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Medicine, General & Internal',
    },
    citescore: '19.8',
    scimago: {
      sjr: '3.650',
      quartile: 'Q1',
      h_index: 150,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100889817&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~14 days',
      acceptance_to_publication: '~10 days',
      source: 'Lancet Discovery Science Editorial Insights',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用 (约 10%–12%)',
        en: 'Selective Peer Review (~10%–12%)',
      },
      source: 'Official Editorial Policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 5500,
      apc_details: {
        zh: '标准原创论著版面费: US$5,500',
        en: 'Standard APC for research articles: US$5,500',
      },
    },
  },

  // 20. Cell Death & Disease
  '101524092': {
    nlm_id: '101524092',
    official_name: 'Cell Death & Disease',
    publisher: 'Nature Portfolio / Springer Nature',
    homepage_url: 'https://www.nature.com/cddis/',
    submission_url: 'https://mts-cddis.nature.com/',
    issn: { online: '2041-4889' },
    summary: {
      zh: '《Cell Death & Disease》是自然科研旗下专注于细胞命运决定的权威转化期刊。涵盖细胞凋亡、自噬、坏死性凋亡的分子机理，以及这些程序性细胞死亡通路在肿瘤学、免疫性疾病和神经退行性病变中的转化研究。',
      en: 'Cell Death & Disease is a high-profile peer-reviewed open-access journal in the Nature Portfolio. It is dedicated to translational cell biology, molecular oncology, mechanisms of programmed cell death (apoptosis, autophagy, necroptosis), and target-based therapies.',
    },
    impact_factor: {
      value: '8.1',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Cell Biology',
    },
    citescore: '14.2',
    scimago: {
      sjr: '3.291',
      quartile: 'Q1',
      h_index: 235,
      url: 'https://www.scimagojr.com/journalsearch.php?q=19700201249&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~26 days',
      acceptance_to_publication: '~12 days',
      source: 'Nature Portfolio published metrics',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用 (约 18%)',
        en: 'Selective Peer Review (~18%)',
      },
      source: 'Official Editorial Policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4290,
      apc_details: {
        zh: '原创论著文章处理费: US$4,290',
        en: 'Standard APC for research articles: US$4,290',
      },
    },
  },

  // 21. Advanced Science
  '101664569': {
    nlm_id: '101664569',
    official_name: 'Advanced Science',
    publisher: 'Wiley',
    homepage_url: 'https://onlinelibrary.wiley.com/journal/21983844',
    submission_url: 'https://www.editorialmanager.com/advsci/',
    issn: { online: '2198-3844' },
    summary: {
      zh: '《Advanced Science》是 Wiley 出版社旗下的跨学科顶级开放获取综合期刊。聚焦于材料科学、物理、化学、生物医药和工程前沿领域最具创新性的原始论著，致力于推动重大交叉学科科学突破的高速传播。',
      en: 'Advanced Science is an interdisciplinary premium open-access journal from Wiley covering fundamental and applied research across materials science, physics, chemistry, medical and life sciences, and advanced engineering technologies.',
    },
    impact_factor: {
      value: '14.3',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Materials Science, Multidisciplinary',
    },
    citescore: '20.4',
    scimago: {
      sjr: '3.460',
      quartile: 'Q1',
      h_index: 165,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100432325&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~28 days',
      acceptance_to_publication: '~15 days',
      source: 'Wiley Journal Insights',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用 (约 15%)',
        en: 'Selective Peer Review (~15%)',
      },
      source: 'Official Editorial Policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 5400,
      apc_details: {
        zh: '原创论著版面费: US$5,400',
        en: 'Standard APC for research articles: US$5,400',
      },
    },
  },

  // 22. Theranostics
  '101552395': {
    nlm_id: '101552395',
    official_name: 'Theranostics',
    publisher: 'Ivyspring International Publisher',
    homepage_url: 'https://www.thno.org/',
    submission_url: 'https://www.thno.org/ms/submit',
    issn: { online: '1838-7640' },
    summary: {
      zh: '《Theranostics》是诊疗一体化领域的代表性国际学术期刊。重点发表结合早期体外/体内分子诊断与靶向特异性治疗的创新医学方案，涵盖纳米医学、分子探针、基因编辑治疗以及前沿精准医疗临床前研究。',
      en: 'Theranostics is a leading peer-reviewed journal focused on bridging in vitro/in vivo molecular diagnostics with targeted therapies. It features innovations in nanomedicine, molecular imaging probes, smart drug delivery, and translational clinical science.',
    },
    impact_factor: {
      value: '12.4',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Medicine, Research & Experimental',
    },
    citescore: '19.5',
    scimago: {
      sjr: '2.380',
      quartile: 'Q1',
      h_index: 199,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100202868&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~25 days',
      acceptance_to_publication: '~12 days',
      source: 'Ivyspring editorial records',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用 (约 18%)',
        en: 'Selective Peer Review (~18%)',
      },
      source: 'Official Editorial Policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4500,
      apc_details: {
        zh: '标准原创论著版面费: US$4,500',
        en: 'Standard APC for research articles: US$4,500',
      },
    },
  },

  // 23. Microbiome
  '101615147': {
    nlm_id: '101615147',
    official_name: 'Microbiome',
    publisher: 'BioMed Central / Springer Nature',
    homepage_url: 'https://microbiomejournal.biomedcentral.com/',
    submission_url: 'https://www.editorialmanager.com/mibo/',
    issn: { online: '2049-2618' },
    summary: {
      zh: '《Microbiome》是国际微生物组学领域的顶级权威期刊。专注于刊登关于环境、农业、动物及人类复杂微生物群落的结构构成、宿主免疫互作、宏基因组功能调控及其在健康与疾病病理中的核心作用。',
      en: 'Microbiome is a leading peer-reviewed open-access journal publishing high-impact investigations into microbial communities in environmental, agricultural, and host ecosystems. It explores metagenomics, host-microbiome interactions, and functional ecology.',
    },
    impact_factor: {
      value: '13.8',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Microbiology',
    },
    citescore: '23.5',
    scimago: {
      sjr: '4.166',
      quartile: 'Q1',
      h_index: 186,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100282715&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~30 days',
      acceptance_to_publication: '~14 days',
      source: 'BMC Springer Nature metrics',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用 (约 15%)',
        en: 'Selective Peer Review (~15%)',
      },
      source: 'Official Editorial Policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4090,
      apc_details: {
        zh: '原创研究论著文章处理费: US$4,090',
        en: 'Standard APC for research articles: US$4,090',
      },
    },
  },

  // 24. Journal of Nanobiotechnology
  '101152208': {
    nlm_id: '101152208',
    official_name: 'Journal of Nanobiotechnology',
    publisher: 'BioMed Central / Springer Nature',
    homepage_url: 'https://jnanobiotechnology.biomedcentral.com/',
    submission_url: 'https://www.editorialmanager.com/jnan/',
    issn: { online: '1477-3155' },
    summary: {
      zh: '《Journal of Nanobiotechnology》是纳米科学与生物医学交叉领域的知名开放获取期刊。致力于报道纳米载体药物递送、生物传感器、分子成像探针以及微纳器件在临床疾病预防、诊断与精准治疗中的关键突破。',
      en: 'Journal of Nanobiotechnology is a high-profile open-access journal bridging nanotechnology and biological systems. It covers biomedical nanodevices, smart targeted drug delivery, biosensors, and molecular nanomaterials for diagnostic and therapeutic applications.',
    },
    impact_factor: {
      value: '10.6',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Biotechnology & Applied Microbiology',
    },
    citescore: '18.2',
    scimago: {
      sjr: '2.517',
      quartile: 'Q1',
      h_index: 125,
      url: 'https://www.scimagojr.com/journalsearch.php?q=25752&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~24 days',
      acceptance_to_publication: '~12 days',
      source: 'BMC publishing statistics',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用 (约 20%)',
        en: 'Selective Peer Review (~20%)',
      },
      source: 'Official Editorial Policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3690,
      apc_details: {
        zh: '原创论文版面费: US$3,690',
        en: 'Standard APC for research articles: US$3,690',
      },
    },
  },

  // 25. Cell Reports Medicine
  '101766894': {
    nlm_id: '101766894',
    official_name: 'Cell Reports Medicine',
    publisher: 'Cell Press / Elsevier',
    homepage_url: 'https://www.cell.com/cell-reports-medicine/home',
    submission_url: 'https://www.editorialmanager.com/cell-reports-medicine/',
    issn: { online: '2666-3791' },
    summary: {
      zh: '《Cell Reports Medicine》是 Cell Press 旗下享有盛誉的全开放获取临床与转化医学期刊。主要刊载改善人类健康和医疗实践的重大前沿研究，包括早期临床试验、人类免疫学机制、基因组精准医疗以及传染病防控策略。',
      en: 'Cell Reports Medicine is a premium open-access clinical journal from Cell Press. It focuses on translational and clinical discoveries that advance human health, including early-phase trials, translational genomics, immunology, and infectious disease interventions.',
    },
    impact_factor: {
      value: '11.7',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Medicine, Research & Experimental',
    },
    citescore: '15.6',
    scimago: {
      sjr: '4.932',
      quartile: 'Q1',
      h_index: 105,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21101037229&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~21 days',
      acceptance_to_publication: '~14 days',
      source: 'Cell Press published metrics',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用 (约 12%)',
        en: 'Selective Peer Review (~12%)',
      },
      source: 'Official Editorial Policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 5750,
      apc_details: {
        zh: '标准原创论著文章处理费: US$5,750',
        en: 'Standard APC for research articles: US$5,750',
      },
    },
  },

  // 26. Blood Cancer Journal
  '101568469': {
    nlm_id: '101568469',
    official_name: 'Blood Cancer Journal',
    publisher: 'Nature Portfolio / Springer Nature',
    homepage_url: 'https://www.nature.com/bcj/',
    submission_url: 'https://mts-bcj.nature.com/',
    issn: { online: '2044-5385' },
    summary: {
      zh: '《Blood Cancer Journal》是自然科研旗下《白血病》（Leukemia）的姊妹开放获取期刊。专注于血液系统恶性肿瘤领域的基础与临床研究，涵盖急慢性白血病、淋巴瘤、骨髓瘤的靶向分子药物、造血干细胞移植和 CAR-T 细胞免疫疗法。',
      en: 'Blood Cancer Journal is an open-access sister journal to Leukemia in the Nature Portfolio. It delivers premier clinical and translational research across hematologic malignancies, focusing on targeted therapeutics, stem cell transplantation, and cellular immunotherapies.',
    },
    impact_factor: {
      value: '12.8',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Hematology & Oncology',
    },
    citescore: '21.0',
    scimago: {
      sjr: '4.307',
      quartile: 'Q1',
      h_index: 94,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100201736&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~18 days',
      acceptance_to_publication: '~10 days',
      source: 'Nature Portfolio metrics',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用 (约 18%)',
        en: 'Selective Peer Review (~18%)',
      },
      source: 'Official Editorial Policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 4390,
      apc_details: {
        zh: '原创论文文章处理费: US$4,390',
        en: 'Standard APC for research articles: US$4,390',
      },
    },
  },

  // 27. Acta Pharmaceutica Sinica B
  '101600560': {
    nlm_id: '101600560',
    official_name: 'Acta Pharmaceutica Sinica B',
    publisher: 'Elsevier / Chinese Pharmaceutical Association',
    homepage_url: 'https://www.sciencedirect.com/journal/acta-pharmaceutica-sinica-b',
    submission_url: 'https://www.editorialmanager.com/apsb/',
    issn: { print: '2211-3835', online: '2211-3843' },
    summary: {
      zh: '《Acta Pharmaceutica Sinica B》（药学学报英文版，APSB）是中国药学会与中国医学科学院药物研究所共同主办的高端英文药学学术期刊。主要报道药理学、药剂学、药物化学、天然产物及分子靶向治疗领域的创新理论与新药研发前沿。',
      en: 'Acta Pharmaceutica Sinica B (APSB) is an international peer-reviewed journal hosted by the Chinese Pharmaceutical Association and published by Elsevier. It covers pharmacology, pharmaceutics, medicinal chemistry, natural medicines, and precision pharmacotherapy.',
    },
    impact_factor: {
      value: '14.7',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Pharmacology & Pharmacy',
    },
    citescore: '24.1',
    scimago: {
      sjr: '3.439',
      quartile: 'Q1',
      h_index: 123,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100222033&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~21 days',
      acceptance_to_publication: '~10 days',
      source: 'APSB Editorial Office',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用 (约 15%)',
        en: 'Selective Peer Review (~15%)',
      },
      source: 'Official Editorial Policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 2850,
      apc_details: {
        zh: '原创论著文章处理费: US$2,850',
        en: 'Standard APC for research articles: US$2,850',
      },
    },
  },

  // 28. Journal of Biomedical Science
  '9421567': {
    nlm_id: '9421567',
    official_name: 'Journal of Biomedical Science',
    publisher: 'BioMed Central / Springer Nature',
    homepage_url: 'https://jbiomedsci.biomedcentral.com/',
    submission_url: 'https://www.editorialmanager.com/jbms/',
    issn: { print: '1021-7770', online: '1423-0127' },
    summary: {
      zh: '《Journal of Biomedical Science》是一本享誉国际的同行评审开放获取生物医学期刊。聚焦于基础与转化医学领域的创新突破，涵盖疾病的分子机理、细胞生理、免疫病理机制以及新型药物靶点的临床前评估。',
      en: 'Journal of Biomedical Science is a high-ranking peer-reviewed open-access journal published by BioMed Central. It features fundamental and translational biomedical investigations into human disease pathogenesis, molecular cell biology, and experimental therapeutics.',
    },
    impact_factor: {
      value: '11.0',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Medicine, Research & Experimental',
    },
    citescore: '16.8',
    scimago: {
      sjr: '3.601',
      quartile: 'Q1',
      h_index: 120,
      url: 'https://www.scimagojr.com/journalsearch.php?q=19985&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~25 days',
      acceptance_to_publication: '~12 days',
      source: 'BMC publishing metrics',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用 (约 20%)',
        en: 'Selective Peer Review (~20%)',
      },
      source: 'Official Editorial Policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3090,
      apc_details: {
        zh: '原创论著版面费: US$3,090',
        en: 'Standard APC for research articles: US$3,090',
      },
    },
  },

  // 29. Journal of Experimental & Clinical Cancer Research
  '8308647': {
    nlm_id: '8308647',
    official_name: 'Journal of Experimental & Clinical Cancer Research',
    publisher: 'BioMed Central / Springer Nature',
    homepage_url: 'https://jeccr.biomedcentral.com/',
    submission_url: 'https://www.editorialmanager.com/jecc/',
    issn: { online: '1756-9966' },
    summary: {
      zh: '《Journal of Experimental & Clinical Cancer Research》（JECCR）是一本专注于连接癌症基础实验与临床治疗的高水平肿瘤学期刊。着重发表肿瘤微环境重塑、靶向耐药机制、免疫检查点调控以及新型联合治疗策略的重大突破。',
      en: 'Journal of Experimental & Clinical Cancer Research is a leading oncology journal bridging fundamental discoveries and clinical practice. It focuses on tumor microenvironment dynamics, drug resistance mechanisms, cancer immunology, and innovative therapeutic regimens.',
    },
    impact_factor: {
      value: '11.4',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Oncology',
    },
    citescore: '17.5',
    scimago: {
      sjr: '3.320',
      quartile: 'Q1',
      h_index: 136,
      url: 'https://www.scimagojr.com/journalsearch.php?q=12975&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~25 days',
      acceptance_to_publication: '~12 days',
      source: 'BMC published statistics',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用 (约 18%)',
        en: 'Selective Peer Review (~18%)',
      },
      source: 'Official Editorial Policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3790,
      apc_details: {
        zh: '原创论著文章处理费: US$3,790',
        en: 'Standard APC for research articles: US$3,790',
      },
    },
  },

  // 30. MedComm
  '101769925': {
    nlm_id: '101769925',
    official_name: 'MedComm',
    publisher: 'Wiley',
    homepage_url: 'https://onlinelibrary.wiley.com/journal/26882663',
    submission_url: 'https://mc.manuscriptcentral.com/medcomm',
    issn: { online: '2688-2663' },
    summary: {
      zh: '《MedComm》是由四川大学华西医院与 Wiley 出版集团联合创办的高质量同行评审生物医学期刊。全面报道临床医学、分子生物学、新型生物药物及健康科学前沿成果，促进全球生物医药基础与临床转化的融合创新。',
      en: 'MedComm is a peer-reviewed open-access biomedical journal co-published with Wiley. It covers experimental and clinical medicine, novel therapeutics, disease molecular mechanisms, and translational clinical science.',
    },
    impact_factor: {
      value: '10.7',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Medicine, Research & Experimental',
    },
    citescore: '13.5',
    scimago: {
      sjr: '2.930',
      quartile: 'Q1',
      h_index: 72,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21101072935&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~20 days',
      acceptance_to_publication: '~12 days',
      source: 'Wiley Journal Metrics',
    },
    acceptance_rate: {
      rate: {
        zh: '同行评议择优录用 (约 22%)',
        en: 'Selective Peer Review (~22%)',
      },
      source: 'Official Editorial Policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3300,
      apc_details: {
        zh: '标准原创论著版面费: US$3,300',
        en: 'Standard APC for research articles: US$3,300',
      },
    },
  },

  // 31. Frontiers in Immunology
  '101560960': {
    nlm_id: '101560960',
    official_name: 'Frontiers in Immunology',
    publisher: 'Frontiers Media SA',
    homepage_url: 'https://www.frontiersin.org/journals/immunology',
    submission_url: 'https://www.frontiersin.org/submission',
    issn: { online: '1664-3224' },
    summary: {
      zh: '《Frontiers in Immunology》是全球免疫学领域发文量和学术影响力领先的同行评审开放获取期刊。全面涵盖天然免疫、获得性免疫、自身免疫疾病、抗感染免疫以及肿瘤免疫治疗的最新基础与临床研究。',
      en: 'Frontiers in Immunology is a leading open-access journal covering the entire spectrum of immunology. It publishes peer-reviewed research on innate and adaptive immunity, immune tolerance, autoimmune diseases, and translational cancer immunotherapies.',
    },
    impact_factor: {
      value: '5.2',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Immunology',
    },
    citescore: '8.9',
    scimago: {
      sjr: '1.964',
      quartile: 'Q1',
      h_index: 294,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100201248&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~35 days',
      acceptance_to_publication: '~14 days',
      source: 'Frontiers official journal metrics',
    },
    acceptance_rate: {
      rate: {
        zh: '约 45% (同行评议交互式审稿)',
        en: '~45% (Interactive peer review)',
      },
      source: 'Official Editorial Policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3295,
      apc_details: {
        zh: 'A类原创论著版面费: US$3,295',
        en: 'Type A research article APC: US$3,295',
      },
    },
  },

  // 32. Frontiers in Oncology
  '101568867': {
    nlm_id: '101568867',
    official_name: 'Frontiers in Oncology',
    publisher: 'Frontiers Media SA',
    homepage_url: 'https://www.frontiersin.org/journals/oncology',
    submission_url: 'https://www.frontiersin.org/submission',
    issn: { online: '2234-943X' },
    summary: {
      zh: '《Frontiers in Oncology》是肿瘤学领域广泛传播的高水平同行评审开放获取期刊。致力于报道肿瘤病理分子机理、临床肿瘤综合诊疗、外科与放疗方案优化，以及肿瘤精准预防与流行病学调查。',
      en: 'Frontiers in Oncology is a high-visibility peer-reviewed open-access journal spanning cancer research and clinical oncology. It publishes discoveries in cancer genetics, tumor therapies, surgical/radiation oncology, and cancer prevention strategies.',
    },
    impact_factor: {
      value: '3.5',
      source: 'Clarivate JCR',
      quartile: 'Q2 · Oncology',
    },
    citescore: '5.8',
    scimago: {
      sjr: '1.020',
      quartile: 'Q2',
      h_index: 173,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100223789&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~32 days',
      acceptance_to_publication: '~14 days',
      source: 'Frontiers official journal metrics',
    },
    acceptance_rate: {
      rate: {
        zh: '约 48% (同行评议交互式审稿)',
        en: '~48% (Interactive peer review)',
      },
      source: 'Official Editorial Policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3295,
      apc_details: {
        zh: 'A类原创论著版面费: US$3,295',
        en: 'Type A research article APC: US$3,295',
      },
    },
  },

  // 33. Frontiers in Pharmacology
  '101548923': {
    nlm_id: '101548923',
    official_name: 'Frontiers in Pharmacology',
    publisher: 'Frontiers Media SA',
    homepage_url: 'https://www.frontiersin.org/journals/pharmacology',
    submission_url: 'https://www.frontiersin.org/submission',
    issn: { online: '1663-9812' },
    summary: {
      zh: '《Frontiers in Pharmacology》是药理学领域享有广泛学术声誉的同行评审开放获取期刊。涵盖药物靶点发现、分子药理学、临床药物治疗学、药物毒理机制以及基于天然产物的现代药物研发成果。',
      en: 'Frontiers in Pharmacology is a premier open-access journal covering pharmacological mechanisms and drug development. It explores drug target identification, molecular pharmacology, translational therapeutics, toxicology, and natural medicine formulations.',
    },
    impact_factor: {
      value: '4.4',
      source: 'Clarivate JCR',
      quartile: 'Q1 · Pharmacology & Pharmacy',
    },
    citescore: '7.8',
    scimago: {
      sjr: '1.250',
      quartile: 'Q1',
      h_index: 203,
      url: 'https://www.scimagojr.com/journalsearch.php?q=21100201249&tip=sid&exact=no',
    },
    publisher_reported_speed: {
      first_decision: '~30 days',
      acceptance_to_publication: '~14 days',
      source: 'Frontiers official journal metrics',
    },
    acceptance_rate: {
      rate: {
        zh: '约 46% (同行评议交互式审稿)',
        en: '~46% (Interactive peer review)',
      },
      source: 'Official Editorial Policy',
    },
    publishing_model: {
      type: 'Gold Open Access',
      apc_usd: 3295,
      apc_details: {
        zh: 'A类原创论著版面费: US$3,295',
        en: 'Type A research article APC: US$3,295',
      },
    },
  },

}

export function getOfficialJournalMetrics(nlmId?: string): OfficialJournalMetrics | null {
  if (!nlmId) return null
  return OFFICIAL_JOURNAL_METRICS[nlmId] || null
}
