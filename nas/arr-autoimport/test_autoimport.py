"""Pure-logic tests for arr-autoimport (run: python3 -m unittest -v)."""
import unittest

import autoimport as ai


def q(download_id, state="importBlocked", status="completed", **extra):
    rec = {"downloadId": download_id, "trackedDownloadState": state, "status": status,
           "title": "Some.Release", "statusMessages": [{"title": "x", "messages": ["m"]}]}
    rec.update(extra)
    return rec


class BlockedDownloads(unittest.TestCase):
    def test_dedups_season_pack_records(self):
        recs = [q("A", seriesId=58), q("A", seriesId=58), q("B", seriesId=3)]
        got = ai.blocked_downloads(recs, "seriesId")
        self.assertEqual(sorted(got), [("A", 58), ("B", 3)])

    def test_skips_other_states_and_unfinished(self):
        recs = [q("A", state="importPending", seriesId=1),
                q("B", status="downloading", seriesId=1),
                q("C", state="importBlocked", seriesId=1)]
        self.assertEqual(ai.blocked_downloads(recs, "seriesId"), [("C", 1)])

    def test_skips_unknown_title(self):
        # Radarr "Unknown Movie" rows carry no movieId — a human has to decide those.
        recs = [q("A"), q("B", movieId=0), q("C", movieId=7)]
        self.assertEqual(ai.blocked_downloads(recs, "movieId"), [("C", 7)])


class PlanSeries(unittest.TestCase):
    def f(self, **kw):
        base = {"path": "/data/torrents/series/x/Noll stjarnor S01E04.mkv", "size": 1,
                "series": {"id": 58}, "episodes": [{"id": 5508}], "rejections": [],
                "quality": {"quality": {"id": 3}}, "languages": [{"id": 14}],
                "releaseGroup": "P2P", "downloadId": "A", "indexerFlags": 0,
                "releaseType": "seasonPack"}
        base.update(kw)
        return base

    def test_clean_files_are_imported(self):
        ok, skipped = ai.plan("series", [self.f(), self.f(episodes=[{"id": 5509}])], 58)
        self.assertEqual(len(ok), 2)
        self.assertEqual(skipped, [])
        self.assertEqual(ok[0]["episodeIds"], [5508])
        self.assertEqual(ok[0]["seriesId"], 58)
        self.assertEqual(ok[0]["downloadId"], "A")
        self.assertEqual(ok[0]["releaseType"], "seasonPack")

    def test_wrong_series_is_skipped(self):
        ok, skipped = ai.plan("series", [self.f(series={"id": 99})], 58)
        self.assertEqual(ok, [])
        self.assertIn("series 99", skipped[0])

    def test_rejected_or_unmapped_is_skipped(self):
        files = [self.f(rejections=[{"reason": "sample"}]), self.f(episodes=[]), self.f(series=None)]
        ok, skipped = ai.plan("series", files, 58)
        self.assertEqual(ok, [])
        self.assertEqual(len(skipped), 3)

    def test_partial_pack_imports_clean_subset(self):
        files = [self.f(), self.f(path="/x/sample.mkv", rejections=[{"reason": "sample"}])]
        ok, skipped = ai.plan("series", files, 58)
        self.assertEqual(len(ok), 1)
        self.assertEqual(len(skipped), 1)


class PlanMovie(unittest.TestCase):
    def test_movie_payload(self):
        f = {"path": "/data/torrents/movies/x/x.mkv", "movie": {"id": 12}, "rejections": [],
             "quality": {"quality": {"id": 19}}, "languages": [{"id": 1}], "releaseGroup": "G",
             "downloadId": "B", "indexerFlags": 0}
        ok, skipped = ai.plan("movie", [f], 12)
        self.assertEqual(skipped, [])
        self.assertEqual(ok[0]["movieId"], 12)
        self.assertNotIn("episodeIds", ok[0])

    def test_unknown_movie_skipped(self):
        f = {"path": "/x.mkv", "movie": None, "rejections": [{"reason": "Unknown Movie"}]}
        ok, skipped = ai.plan("movie", [f], 12)
        self.assertEqual(ok, [])
        self.assertEqual(len(skipped), 1)


class Keys(unittest.TestCase):
    def test_api_key_from_config_xml(self):
        xml = "<Config>\n  <ApiKey>abc123</ApiKey>\n  <Port>8989</Port>\n</Config>"
        self.assertEqual(ai.api_key_from_xml(xml), "abc123")

    def test_missing_key(self):
        self.assertIsNone(ai.api_key_from_xml("<Config></Config>"))


class Backoff(unittest.TestCase):
    def test_retry_window(self):
        seen = {}
        self.assertTrue(ai.due(seen, "A", now=1000, retry_after=600))
        seen["A"] = 1000
        self.assertFalse(ai.due(seen, "A", now=1300, retry_after=600))
        self.assertTrue(ai.due(seen, "A", now=1700, retry_after=600))


if __name__ == "__main__":
    unittest.main()
