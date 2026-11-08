import unittest

import pandas as pd

from reviewtime.build_statistics_snapshot import build_scope, prepare, summary


def article(**overrides):
    return {"source_key": "mdpi", "journal_id": "journal-a", "journal_title": "Journal A",
            "doi": "", "received_date": "2026-01-01", "accepted_date": "2026-02-01",
            "article_type": "Research Article", "online_date": "2026-02-02", **overrides}


class StatisticsTests(unittest.TestCase):
    def test_missing_revision_is_unknown_and_same_day_online_is_zero(self):
        frame, _ = prepare(pd.DataFrame([article(online_date="2026-02-01")]), "2026-07-25")
        self.assertEqual(frame.acceptance.iloc[0], 31)
        self.assertTrue(pd.isna(frame.first_revision.iloc[0]))
        self.assertTrue(pd.isna(frame.last_revision.iloc[0]))
        self.assertEqual(frame.publication.iloc[0], 0)

    def test_revision_dates_are_bounded_sorted_and_deduplicated(self):
        frame, _ = prepare(pd.DataFrame([article(revised_dates="2025-12-01; 2026-01-20; 2026-01-10; 2026-03-01",
                                               revised_first_date="2026-01-10")]), "2026-07-25")
        self.assertEqual(frame.first_revision.iloc[0], 9)
        self.assertEqual(frame.last_revision.iloc[0], 12)

    def test_missing_received_does_not_remove_publication_evidence(self):
        frame, _ = prepare(pd.DataFrame([article(received_date="")]), "2026-07-25")
        self.assertTrue(pd.isna(frame.acceptance.iloc[0]))
        self.assertEqual(frame.publication.iloc[0], 1)

    def test_issue_date_does_not_substitute_for_online_date(self):
        frame, _ = prepare(pd.DataFrame([article(online_date="", published_date="2026-02-03")]), "2026-07-25")
        self.assertTrue(pd.isna(frame.publication.iloc[0]))

    def test_future_negative_and_extreme_intervals(self):
        frame, audit = prepare(pd.DataFrame([
            article(accepted_date="2026-07-26"), article(received_date="2026-07-26"),
            article(received_date="2026-02-02"), article(received_date="2010-01-01"),
            article(online_date="2026-01-30"), article(online_date="2026-08-01"),
            article(online_date="2030-01-01"),
        ]), "2026-07-25")
        self.assertEqual(audit["future_timeline_rows"], 2)
        self.assertEqual(len(frame), 5)
        self.assertEqual(frame.acceptance.notna().sum(), 3)
        self.assertEqual(frame.publication.notna().sum(), 2)

    def test_cutoff_is_inclusive_and_doi_is_case_insensitive(self):
        frame, audit = prepare(pd.DataFrame([
            article(doi="https://doi.org/10.1234/ABC", accepted_date="2026-07-25T23:59:00Z"),
            article(doi="10.1234/abc"),
        ]), "2026-07-25")
        self.assertEqual(len(frame), 1)
        self.assertEqual(audit["duplicate_doi_rows"], 1)

    def test_pooled_quantiles_and_small_sample_suppression(self):
        self.assertIsNone(summary(pd.Series([1, 2, 3, 4]))["median"])
        result = summary(pd.Series([1, 2, 3, 4, 100]))
        self.assertEqual(result["median"], 3)
        self.assertEqual(result["p90"], 61.6)
        self.assertIsNone(summary(pd.Series([], dtype=float))["median"])

    def test_window_uses_acceptance_and_preserves_calendar_gaps(self):
        raw = pd.DataFrame([
            article(accepted_date="2025-07-25"),
            *[article(accepted_date="2025-07-26") for _ in range(5)],
            article(accepted_date="2026-01-01", article_type="Article"),
        ])
        frame, _ = prepare(raw, "2026-07-25")
        scope = build_scope(frame, "2026-07-25", "12m", "all", "research", {})
        self.assertEqual(scope["cohort_rows"], 5)
        self.assertEqual(scope["start"], "2025-07-26")
        self.assertEqual(len(scope["monthly"]), 13)
        self.assertEqual(scope["monthly"][-1]["month"], "2026-07")
        self.assertIsNone(scope["monthly"][-1]["stages"]["acceptance"]["median"])

    def test_source_and_article_type_filters_and_independent_denominators(self):
        raw = pd.DataFrame([
            *[article(revised_dates="2026-01-20") for _ in range(5)],
            article(received_date=""), article(source_key="nature"),
            article(article_type="Editorial"), article(article_type="Article"),
        ])
        frame, _ = prepare(raw, "2026-07-25")
        scope = build_scope(frame, "2026-07-25", "24m", "mdpi", "research", {})
        self.assertEqual(scope["cohort_rows"], 6)
        self.assertEqual(scope["stages"]["acceptance"]["count"], 5)
        self.assertEqual(scope["stages"]["first_revision"]["count"], 5)
        self.assertEqual(scope["stages"]["publication"]["count"], 6)
        self.assertEqual(len(scope["journals"]), 1)

    def test_journal_without_received_dates_keeps_publication_statistics(self):
        raw = pd.DataFrame([article(received_date="") for _ in range(5)])
        frame, _ = prepare(raw, "2026-07-25")
        scope = build_scope(frame, "2026-07-25", "24m", "all", "research", {})
        self.assertEqual(len(scope["journals"]), 1)
        stages = scope["journals"][0]["stages"]
        self.assertEqual(stages["acceptance"]["count"], 0)
        self.assertIsNone(stages["acceptance"]["median"])
        self.assertEqual(stages["publication"]["count"], 5)
        self.assertEqual(stages["publication"]["median"], 1)


if __name__ == "__main__":
    unittest.main()
