from fastapi.testclient import TestClient


def test_chat_answers_faq(client: TestClient):
    response = client.post(
        "/chat/message",
        json={"message": "What are your weekend hours?", "dentistry_id": 1},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["faq_answered"] is True
    assert "9am to 2pm" in payload["reply"]


def test_chat_booking_flow(client: TestClient):
    start = client.post(
        "/chat/message", json={"message": "I want to book an appointment", "dentistry_id": 1}
    )
    assert start.status_code == 200
    conversation_id = start.json()["conversation_id"]

    service_step = client.post(
        "/chat/message",
        json={"message": "Service 1", "dentistry_id": 1, "conversation_id": conversation_id},
    )
    assert service_step.status_code == 200

    staff_step = client.post(
        "/chat/message",
        json={"message": "Staff 1", "dentistry_id": 1, "conversation_id": conversation_id},
    )
    assert staff_step.status_code == 200

    availability = client.get("/appointments/availability", params={"dentistry_id": 1, "staff_id": 1})
    slot_id = availability.json()[0]["id"]

    slot_step = client.post(
        "/chat/message",
        json={"message": f"Slot {slot_id}", "dentistry_id": 1, "conversation_id": conversation_id},
    )
    assert slot_step.status_code == 200

    contact_step = client.post(
        "/chat/message",
        json={
            "message": "name=Test User, email=test@example.com, phone=555-1111",
            "dentistry_id": 1,
            "conversation_id": conversation_id,
        },
    )
    assert contact_step.status_code == 200
    confirmation = contact_step.json()
    assert confirmation["booking_confirmation"] is not None
    assert confirmation["booking_confirmation"]["booking"]["slot_id"] == slot_id
