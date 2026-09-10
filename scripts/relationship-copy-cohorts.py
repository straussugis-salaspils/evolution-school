"""Read-only exact-cutover comparison; run via stdin inside the attribution API container.

Uses the live dashboard's counting rules unchanged. Only its date-to-UTC-boundary
helper is overridden inside this one-off process to admit a precise timestamp.
No production files, business data, or event delivery are changed.
"""
import asyncio
import json
from datetime import UTC, datetime
from unittest.mock import patch

from sqlalchemy import text

from relationships_bot.dashboard_stats import collect_group_first_dashboard_stats
from relationships_bot.db import make_engine, make_session_factory
from relationships_bot.settings import Settings


CUTOVER = datetime.fromisoformat("2026-09-10T14:29:26.387+00:00")
METRICS = {"landing", "cta", "group_joined", "test_started", "completed", "returned_to_channel"}


async def main():
    engine = make_engine(Settings().database_url)
    factory = make_session_factory(engine)
    observed_at = datetime.now(UTC)
    periods = (
        ("old_copy_full_days_06_09_Riga", datetime.fromisoformat("2026-09-05T21:00:00+00:00"), datetime.fromisoformat("2026-09-09T21:00:00+00:00")),
        ("old_copy_today_before_cutover", datetime.fromisoformat("2026-09-09T21:00:00+00:00"), CUTOVER),
        ("new_copy_since_cutover", CUTOVER, observed_at),
    )
    results = []
    try:
        async with factory() as session:
            await session.execute(text("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY"))
            for label, start, end in periods:
                with patch("relationships_bot.dashboard_stats.dashboard_date_bounds", return_value=(start, end)):
                    report = await collect_group_first_dashboard_stats(
                        session, date_from=start.date(), date_to=end.date(),
                        test_id="test_b_relationship_challenges",
                        question_ids=tuple(f"q{i}" for i in range(1, 8)),
                        result_screen_labels=(), timezone_name="Europe/Riga",
                    )
                selected = [row for row in report["by_landing_source"] if row["landing_id"] == "youtube_tired_function"]
                results.append({
                    "period": label, "from_utc_inclusive": start.isoformat(),
                    "to_utc_exclusive": end.isoformat(),
                    "sources": [{"source": row["source"], "counts": {step["key"]: step["count"] for step in row["funnel"] if step["key"] in METRICS}} for row in selected],
                })
            await session.rollback()
    finally:
        await engine.dispose()
    print(json.dumps({"observed_at_utc": observed_at.isoformat(), "cutover_utc": CUTOVER.isoformat(), "cohort_basis": "original landing visit created_at; downstream actions may arrive later", "periods": results}, ensure_ascii=False))


asyncio.run(main())
