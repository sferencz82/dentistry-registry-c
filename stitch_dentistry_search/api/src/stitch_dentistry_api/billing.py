from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from functools import lru_cache
from uuid import uuid4

from fastapi import HTTPException, status

from .config import get_settings
from .models import BillingStatus, Dentistry


class BillingProviderName(str, Enum):
    stripe = "stripe"


@dataclass
class SubscriptionDetails:
    customer_id: str
    subscription_id: str
    status: BillingStatus
    management_url: str | None = None


@dataclass
class BillingEvent:
    subscription_id: str
    status: BillingStatus
    customer_id: str | None = None


class BillingProvider(ABC):
    """Abstract provider that hides third-party billing specifics."""

    @abstractmethod
    def create_subscription(self, dentistry: Dentistry, customer_email: str) -> SubscriptionDetails:
        raise NotImplementedError

    @abstractmethod
    def cancel_subscription(self, subscription_id: str) -> BillingStatus:
        raise NotImplementedError

    @abstractmethod
    def parse_webhook(self, payload: dict) -> BillingEvent:
        raise NotImplementedError


class StripeBillingProvider(BillingProvider):
    """Lightweight Stripe facade with safe defaults for tests."""

    def __init__(self, api_key: str | None, price_id: str | None):
        self.api_key = api_key
        self.price_id = price_id

    def _assert_configured(self) -> None:
        if not self.api_key or not self.price_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Stripe billing is not configured.",
            )

    def create_subscription(self, dentistry: Dentistry, customer_email: str) -> SubscriptionDetails:
        self._assert_configured()
        customer_id = dentistry.billing_customer_id or f"cus_{uuid4().hex[:12]}"
        subscription_id = f"sub_{uuid4().hex[:12]}"
        management_url = f"https://dashboard.stripe.com/subscriptions/{subscription_id}"
        return SubscriptionDetails(
            customer_id=customer_id,
            subscription_id=subscription_id,
            status=BillingStatus.trialing,
            management_url=management_url,
        )

    def cancel_subscription(self, subscription_id: str) -> BillingStatus:
        self._assert_configured()
        return BillingStatus.canceled

    def parse_webhook(self, payload: dict) -> BillingEvent:
        data_object = (payload.get("data") or {}).get("object", {})
        status_value = data_object.get("status") or payload.get("status") or BillingStatus.inactive
        subscription_id = data_object.get("id") or payload.get("subscription_id")
        customer_id = data_object.get("customer") or payload.get("customer_id")

        try:
            mapped_status = BillingStatus(status_value)
        except ValueError:
            mapped_status = BillingStatus.inactive

        if not subscription_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing subscription id")

        return BillingEvent(subscription_id=subscription_id, status=mapped_status, customer_id=customer_id)


PREMIUM_STATUSES: set[BillingStatus] = {BillingStatus.active, BillingStatus.trialing}


def ensure_premium_access(dentistry: Dentistry | None) -> Dentistry:
    if not dentistry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dentistry not found")
    if dentistry.billing_status not in PREMIUM_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Premium subscription required for this feature.",
        )
    return dentistry


@lru_cache

def get_billing_provider() -> BillingProvider:
    settings = get_settings()
    if settings.billing_provider == BillingProviderName.stripe:
        return StripeBillingProvider(settings.stripe_api_key, settings.stripe_price_id)
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unsupported billing provider")


def update_dentistry_billing(
    dentistry: Dentistry, details: SubscriptionDetails | None = None, status_update: BillingStatus | None = None
) -> Dentistry:
    if details:
        dentistry.billing_customer_id = details.customer_id
        dentistry.billing_subscription_id = details.subscription_id
        dentistry.billing_status = details.status
        dentistry.billing_provider = BillingProviderName.stripe
    if status_update:
        dentistry.billing_status = status_update
    return dentistry
