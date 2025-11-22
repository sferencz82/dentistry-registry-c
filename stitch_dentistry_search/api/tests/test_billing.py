import pytest
from sqlmodel import Session, select

from stitch_dentistry_api.billing import (
    BillingEvent,
    BillingProvider,
    BillingStatus,
    SubscriptionDetails,
    get_billing_provider,
)
from stitch_dentistry_api.db import engine
from stitch_dentistry_api.main import app
from stitch_dentistry_api.models import Dentistry


class MockBillingProvider(BillingProvider):
    def __init__(self):
        self.created_events: list[SubscriptionDetails] = []

    def create_subscription(self, dentistry: Dentistry, customer_email: str) -> SubscriptionDetails:
        details = SubscriptionDetails(
            customer_id="cus_mock", subscription_id="sub_mock", status=BillingStatus.active
        )
        self.created_events.append(details)
        return details

    def cancel_subscription(self, subscription_id: str) -> BillingStatus:
        return BillingStatus.canceled

    def parse_webhook(self, payload: dict) -> BillingEvent:
        status = payload.get("status", BillingStatus.past_due)
        if isinstance(status, str):
            status = BillingStatus(status)
        return BillingEvent(
            subscription_id=payload.get("subscription_id", ""),
            customer_id=payload.get("customer_id"),
            status=status,
        )


@pytest.fixture()
def mock_billing_provider():
    provider = MockBillingProvider()
    app.dependency_overrides[get_billing_provider] = lambda: provider
    yield provider
    app.dependency_overrides.pop(get_billing_provider, None)


@pytest.fixture()
def dentistry_id():
    with Session(engine) as session:
        return session.exec(select(Dentistry.id)).first()


def test_subscription_creation_updates_profile(client, mock_billing_provider, dentistry_id):
    response = client.post(
        f"/billing/{dentistry_id}/subscribe", json={"customer_email": "owner@example.com"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == BillingStatus.active.value
    assert mock_billing_provider.created_events

    with Session(engine) as session:
        dentistry = session.get(Dentistry, dentistry_id)
        assert dentistry.billing_subscription_id == body["subscription_id"]
        assert dentistry.billing_status == BillingStatus.active


def test_webhook_updates_status(client, mock_billing_provider, dentistry_id):
    client.post(f"/billing/{dentistry_id}/subscribe", json={"customer_email": "owner@example.com"})

    response = client.post(
        "/billing/webhook",
        json={"subscription_id": "sub_mock", "status": BillingStatus.past_due.value},
    )
    assert response.status_code == 200

    with Session(engine) as session:
        dentistry = session.get(Dentistry, dentistry_id)
        assert dentistry.billing_status == BillingStatus.past_due


def test_chat_requires_premium_subscription(client, dentistry_id):
    with Session(engine) as session:
        dentistry = session.get(Dentistry, dentistry_id)
        dentistry.billing_status = BillingStatus.inactive
        session.add(dentistry)
        session.commit()

    response = client.post(
        "/chat/message", json={"message": "hello there", "dentistry_id": dentistry_id}
    )
    assert response.status_code == 402
