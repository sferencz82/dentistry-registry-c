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
    assert "patient_message" in body

    refreshed = client.get("/appointments/availability", params={"dentistry_id": 1}).json()
    refreshed_ids = {item["id"] for item in refreshed}
    assert slot["id"] not in refreshed_ids, "Booked slot should be unavailable"
