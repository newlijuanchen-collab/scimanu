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
      rate: '同行评议择优录用 (Selective Peer Review)',
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
      rate: '同行评议择优录用 (Selective Peer Review)',
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
      rate: '同行评议择优录用 (Selective Peer Review)',
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
      rate: '极高学术门槛择优录用 (Highly selective)',
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
      rate: '同行评议择优录用 (Selective Peer Review)',
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
      rate: '同行评议择优录用 (Selective Peer Review)',
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
      rate: '同行评议择优录用 (Selective Peer Review)',
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
      rate: '同行评议择优录用 (Selective Peer Review)',
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
      rate: '同行评议择优录用 (Selective Peer Review)',
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
      rate: '同行评议择优录用 (Selective Peer Review)',
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
      rate: '同行评议择优录用 (Selective Peer Review)',
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
}

export function getOfficialJournalMetrics(nlmId?: string): OfficialJournalMetrics | null {
  if (!nlmId) return null
  return OFFICIAL_JOURNAL_METRICS[nlmId] || null
}
