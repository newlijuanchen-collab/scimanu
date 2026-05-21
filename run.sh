python -m reviewtime.cli fetch-crossref --journals data/journals_issn.jsonl --output out/crossref_works.json --from-pub-date 2024-01-01 --until-pub-date 2026-04-30 --rows-per-journal 20
python -m reviewtime.cli analyze --input data/sample_articles.jsonl --output-dir out --as-of 2026-05-01 --window-months 24
python -m reviewtime.cli build-db --journals data/journals_issn.jsonl --output-articles out/articles_db.jsonl --output-leaderboard out/leaderboard_by_journal.json --from-pub-date 2024-01-01 --until-pub-date 2024-03-31 --retmax-per-journal 5 2>&1; Get-ChildItem out


python -m reviewtime.cli build-db --journals data/journals_issn.jsonl --output-articles out/articles_master.jsonl --output-sqlite out/articles_master.db --output-report out/ingestion_report.json --output-schema out/schema_articles_master.json --output-leaderboard out/leaderboard_by_journal.json --from-pub-date 2024-01-01 --until-pub-date 2024-03-31 --retmax-per-journal 5 2>&1; Get-Content out/leaderboard_by_journal.json; Get-Content out/ingestion_report.json



python -m reviewtime.cli prepare-input --input-csv data/journals_seed.csv --output-jsonl out/journals_normalized.jsonl --output-report out/input_validation_report.json



python -m reviewtime.cli build-db --journals out/journals_normalized.jsonl --from-pub-date 2024-05-01 --until-pub-date 2026-05-05 --retmax-per-journal 50 --skip-mdpi-page-fallback --output-articles out/articles_master.jsonl --output-sqlite out/articles_master.db --output-report out/ingestion_report.json --output-schema out/schema_articles_master.json --output-leaderboard out/leaderboard_by_journal.json --output-missing-journals out/mdpi_no_pubmed.csv 2>&1


1


 python reviewtime/export_web_data.py --input out/articles_master.xlsx --output web/data.xlsx --journals-seed data/journals_seed.csv




__下一步（你的操作）__：\
打开 `out/mdpi_no_pubmed.csv`，里面列出了 305 本 PubMed 无法覆盖的 MDPI 期刊（含 ISSN 和刊名）。对你关心的刊，从 MDPI 网站复制文章文本，粘贴到 `data/manual_patches/` 下的任意 `.txt` 文件（每篇空行分隔），然后运行：

```bash
python -m reviewtime.cli ingest-manual \
  --input-dir data/manual_patches \
  --output-articles out/articles_master.jsonl \
  --output-sqlite out/articles_master.db
```
