from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from typing import Iterable, Mapping, Sequence
from zoneinfo import ZoneInfo


@dataclass(frozen=True)
class BusyWindow:
    """Represents a blocked interval on a provider's calendar."""

    start: datetime
    end: datetime

    def as_timezone(self, tzinfo: ZoneInfo) -> "BusyWindow":
        """Return the busy window converted to a specific timezone."""

        return BusyWindow(
            start=_ensure_timezone(self.start, tzinfo),
            end=_ensure_timezone(self.end, tzinfo),
        )


def _ensure_timezone(moment: datetime, tzinfo: ZoneInfo) -> datetime:
    """Ensure a datetime is timezone-aware and in the requested zone."""

    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    return moment.astimezone(tzinfo)


def _has_conflict(
    slot_start: datetime,
    slot_end: datetime,
    busy_windows: Sequence[BusyWindow],
    buffer_before: timedelta,
    buffer_after: timedelta,
) -> bool:
    """Return True when the slot intersects any busy window when buffers are applied."""

    padded_start = slot_start - buffer_before
    padded_end = slot_end + buffer_after
    for window in busy_windows:
        if padded_start < window.end and padded_end > window.start:
            return True
    return False


def generate_availability(
    *,
    window_start: datetime,
    window_end: datetime,
    service_duration: timedelta,
    working_hours: Mapping[int, tuple[time, time]],
    provider_calendars: Iterable[BusyWindow] | None = None,
    blackout_dates: Iterable[date] | None = None,
    buffer_before: timedelta | None = None,
    buffer_after: timedelta | None = None,
    slot_interval: timedelta | None = None,
    timezone_name: str = "UTC",
) -> list[tuple[datetime, datetime]]:
    """Generate available appointment windows.

    The generator respects busy calendar entries, blackout dates, provider working hours,
    service duration, and configurable buffers. All calculations occur in the specified
    timezone to correctly handle daylight savings transitions.
    """

    tzinfo = ZoneInfo(timezone_name)
    buffer_before = buffer_before or timedelta(0)
    buffer_after = buffer_after or timedelta(0)
    slot_interval = slot_interval or timedelta(minutes=15)
    blackout_set = set(blackout_dates or [])

    busy_windows = [
        window.as_timezone(tzinfo) if isinstance(window, BusyWindow) else window
        for window in (provider_calendars or [])
    ]

    current = _ensure_timezone(window_start, tzinfo)
    end_at = _ensure_timezone(window_end, tzinfo)

    availability: list[tuple[datetime, datetime]] = []

    while current < end_at:
        day_hours = working_hours.get(current.weekday())
        if not day_hours:
            current = datetime.combine(current.date() + timedelta(days=1), time(0), tzinfo)
            continue

        day_start = datetime.combine(current.date(), day_hours[0], tzinfo)
        day_end = datetime.combine(current.date(), day_hours[1], tzinfo)
        slot_start = max(current, day_start)

        while slot_start + service_duration <= day_end and slot_start < end_at:
            if slot_start.date() not in blackout_set:
                slot_end = slot_start + service_duration
                if not _has_conflict(slot_start, slot_end, busy_windows, buffer_before, buffer_after):
                    availability.append((slot_start, slot_end))

            slot_start += slot_interval

        current = datetime.combine(current.date() + timedelta(days=1), time(0), tzinfo)

    return availability


def find_closest_available_appointment(
    slots: Iterable[tuple[datetime, datetime]],
    target_time: datetime,
    timezone_name: str = "UTC",
) -> tuple[datetime, datetime] | None:
    """Find the slot whose start is closest to ``target_time`` in the given timezone."""

    tzinfo = ZoneInfo(timezone_name)
    normalized_target = _ensure_timezone(target_time, tzinfo)
    closest: tuple[datetime, datetime] | None = None
    smallest_distance: float | None = None

    for start, end in slots:
        localized_start = _ensure_timezone(start, tzinfo)
        localized_end = _ensure_timezone(end, tzinfo)
        distance = abs((localized_start - normalized_target).total_seconds())
        if smallest_distance is None or distance < smallest_distance:
            closest = (localized_start, localized_end)
            smallest_distance = distance

    return closest
