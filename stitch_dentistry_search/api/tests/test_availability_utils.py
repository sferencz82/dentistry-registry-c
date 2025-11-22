from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from stitch_dentistry_api.availability import (
    BusyWindow,
    find_closest_available_appointment,
    generate_availability,
)


def test_generate_availability_respects_buffers_and_overlaps():
    tz = "UTC"
    start = datetime(2024, 5, 1, tzinfo=ZoneInfo(tz))
    end = start + timedelta(days=1)

    working_hours = {2: (time(9), time(12))}  # Wednesday
    busy = [
        BusyWindow(
            start=datetime(2024, 5, 1, 9, 30, tzinfo=ZoneInfo(tz)),
            end=datetime(2024, 5, 1, 10, 0, tzinfo=ZoneInfo(tz)),
        )
    ]

    slots = generate_availability(
        window_start=start,
        window_end=end,
        service_duration=timedelta(minutes=30),
        working_hours=working_hours,
        provider_calendars=busy,
        buffer_after=timedelta(minutes=15),
        slot_interval=timedelta(minutes=30),
        timezone_name=tz,
    )

    slot_starts = [slot[0].time() for slot in slots]
    assert time(9, 0) not in slot_starts, "Buffer should block slot touching busy interval"
    assert time(10, 0) in slot_starts and time(10, 30) in slot_starts


def test_generate_availability_handles_dst_forward_gap():
    tz = "America/New_York"
    start = datetime(2024, 3, 10, 0, 0, tzinfo=ZoneInfo(tz))
    end = start + timedelta(days=1)

    working_hours = {6: (time(1), time(5))}  # Sunday

    slots = generate_availability(
        window_start=start,
        window_end=end,
        service_duration=timedelta(hours=1),
        working_hours=working_hours,
        slot_interval=timedelta(hours=1),
        timezone_name=tz,
    )

    slot_hours = [slot[0].hour for slot in slots]
    assert slot_hours == [1, 3, 4]


def test_multi_role_provider_conflicts_are_blocked():
    tz = "UTC"
    start = datetime(2024, 6, 3, tzinfo=ZoneInfo(tz))
    end = start + timedelta(days=1)

    working_hours = {0: (time(9), time(17))}  # Monday
    primary_calendar = BusyWindow(
        start=datetime(2024, 6, 3, 10, tzinfo=ZoneInfo(tz)),
        end=datetime(2024, 6, 3, 11, tzinfo=ZoneInfo(tz)),
    )
    secondary_calendar = BusyWindow(
        start=datetime(2024, 6, 3, 12, tzinfo=ZoneInfo(tz)),
        end=datetime(2024, 6, 3, 13, tzinfo=ZoneInfo(tz)),
    )

    slots = generate_availability(
        window_start=start,
        window_end=end,
        service_duration=timedelta(hours=1),
        working_hours=working_hours,
        provider_calendars=[primary_calendar, secondary_calendar],
        slot_interval=timedelta(hours=1),
        timezone_name=tz,
    )

    blocked_hours = {10, 12}
    assert not {slot[0].hour for slot in slots} & blocked_hours

    closest = find_closest_available_appointment(slots, datetime(2024, 6, 3, 9, tzinfo=ZoneInfo(tz)))
    assert closest is not None
    assert closest[0].hour == 9


def test_availability_respects_blackouts_and_returns_closest():
    tz = "UTC"
    start = datetime(2024, 7, 1, tzinfo=ZoneInfo(tz))
    end = start + timedelta(days=3)

    working_hours = {weekday: (time(8), time(10)) for weekday in range(0, 5)}
    blackout = {date(2024, 7, 2)}

    slots = generate_availability(
        window_start=start,
        window_end=end,
        service_duration=timedelta(minutes=45),
        working_hours=working_hours,
        blackout_dates=blackout,
        slot_interval=timedelta(minutes=45),
        timezone_name=tz,
    )

    dates = {slot[0].date() for slot in slots}
    assert date(2024, 7, 2) not in dates

    target = datetime(2024, 7, 1, 9, 30, tzinfo=ZoneInfo(tz))
    closest = find_closest_available_appointment(slots, target, timezone_name=tz)
    assert closest is not None
    assert closest[0].date() == date(2024, 7, 1)
