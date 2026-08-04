"""Source tests — the feed must be stateless enough to survive serverless.

Consecutive polls routinely land on different instances there. If a source kept its
replay position in memory, the mission clock would jump between requests and the replay
would be unfollowable. These tests pin the property that makes the deployment viable.
"""
import time

import pytest

from app.config import get_settings
from app.sources.scenario import ScenarioSource


@pytest.fixture
def source():
    settings = get_settings()
    return ScenarioSource(settings.data_path, settings.time_scale)


async def test_no_replay_start_serves_the_complete_scenario(source):
    """A bare request with no `since` should show the whole picture, not an empty one."""
    snap = await source.snapshot()
    assert snap.feed_complete
    assert len(snap.reports) == snap.raw_total


async def test_replay_position_follows_the_caller_supplied_clock(source):
    """Position in the feed comes from `since`, not from anything held on the instance."""
    now = time.time()

    at_start = await source.snapshot(since=now)
    later = await source.snapshot(since=now - 20)  # 20s of wall clock into the replay

    assert len(at_start.reports) < len(later.reports)
    assert at_start.elapsed < later.elapsed


async def test_separate_instances_agree_on_the_same_replay(source):
    """The scenario a viewer sees must not depend on which process answered.

    This is the serverless case in miniature: two independently-constructed sources,
    handed the same replay start, must return the identical picture.
    """
    settings = get_settings()
    other = ScenarioSource(settings.data_path, settings.time_scale)

    started_at = time.time() - 15
    a = await source.snapshot(since=started_at)
    b = await other.snapshot(since=started_at)

    assert [r.id for r in a.reports] == [r.id for r in b.reports]
    assert a.elapsed == pytest.approx(b.elapsed, abs=0.5)


async def test_snapshot_does_not_mutate_the_source(source):
    """Calling snapshot must leave nothing behind that changes the next answer."""
    started_at = time.time() - 10
    first = await source.snapshot(since=started_at)
    second = await source.snapshot(since=started_at)

    assert [r.id for r in first.reports] == [r.id for r in second.reports]
    assert first.elapsed == pytest.approx(second.elapsed, abs=0.5)


async def test_elapsed_never_runs_past_the_scenario(source):
    """A replay left running for an hour should sit at the end, not off it."""
    snap = await source.snapshot(since=time.time() - 3600)
    assert snap.elapsed == source.duration
    assert snap.feed_complete


async def test_a_future_start_time_is_clamped_not_negative(source):
    """Clock skew between a client and the server must not produce a negative clock."""
    snap = await source.snapshot(since=time.time() + 60)
    assert snap.elapsed == 0
    assert snap.reports == [] or all(r.t == 0 for r in snap.reports)
