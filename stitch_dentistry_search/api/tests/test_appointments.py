def test_appointment_booking_and_availability(client):
    availability = client.get("/appointments/availability", params={"dentistry_id": 1}).json()
    assert availability, "Expected seeded availability slots"

    slot = availability[0]
    payload = {
        "dentistry_id": slot["dentistry_id"],
        "service_id": 1,
        "staff_id": slot["staff_id"],
        "slot_id": slot["id"],
        "patient": {
            "full_name": "Test Patient",
            "email": "test@example.com",
            "phone": "555-000-1111",
        },
    }

    response = client.post("/appointments", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["booking"]["slot_id"] == slot["id"]
    assert body["patient_contact"]["email"] == payload["patient"]["email"]
    assert "map_link" in body and body["map_link"]
    assert body["price_estimate"] > 0

    refreshed = client.get("/appointments/availability", params={"dentistry_id": 1}).json()
    refreshed_ids = {item["id"] for item in refreshed}
    assert slot["id"] not in refreshed_ids, "Booked slot should be unavailable"


def test_booking_payload_and_notifications(monkeypatch, client):
    from stitch_dentistry_api.notifications import MockNotificationSender, NotificationDispatcher
    from stitch_dentistry_api.routers import appointments

    sent_log: list[tuple[str, str, str | None, str]] = []
    sender = MockNotificationSender(sent=sent_log)

    monkeypatch.setattr(
        appointments,
        "NotificationDispatcher",
        lambda: NotificationDispatcher(sender=sender),
    )

    slot = client.get("/appointments/availability", params={"dentistry_id": 1}).json()[0]
    payload = {
        "dentistry_id": slot["dentistry_id"],
        "service_id": 1,
        "staff_id": slot["staff_id"],
        "slot_id": slot["id"],
        "patient": {
            "full_name": "Notified Patient",
            "email": "notify@example.com",
            "phone": "",
        },
        "contact_details": {"email": "notify@example.com", "phone": "+15550009999"},
        "delivery_preference": "both",
    }

    response = client.post("/appointments", json=payload)
    assert response.status_code == 200
    body = response.json()

    assert "access_instructions" in body and body["access_instructions"]
    assert body["location"]
    assert body["price_estimate"] == 120.0
    assert "maps" in body["map_link"].lower()

    assert len(sent_log) == 4
    notification_channels = {entry[0] for entry in sent_log}
    assert notification_channels == {"email", "sms"}
    assert any("New appointment for" in entry[3] for entry in sent_log if entry[0] == "email")


def test_booking_rejects_missing_contact_for_preference(client):
    slot = client.get("/appointments/availability", params={"dentistry_id": 1}).json()[0]
    payload = {
        "dentistry_id": slot["dentistry_id"],
        "service_id": 1,
        "staff_id": slot["staff_id"],
        "slot_id": slot["id"],
        "patient": {
            "full_name": "SMS Preferred",
            "email": "sms@example.com",
            "phone": "",
        },
        "delivery_preference": "sms",
    }

    response = client.post("/appointments", json=payload)
    assert response.status_code == 400
    assert "Phone number required" in response.json()["detail"]
def test_closest_availability_endpoint(client):
    payload = {"dentistry_id": 1, "staff_id": 1, "service_id": 1}
    response = client.get("/appointments/closest", params=payload)
    assert response.status_code == 200

    closest = response.json()
    assert closest["dentistry_id"] == payload["dentistry_id"]
    assert closest["staff_id"] == payload["staff_id"]
    assert closest["is_booked"] is False
