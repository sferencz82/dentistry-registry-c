from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session, SQLModel, select

from ..billing import BillingEvent, BillingProvider, get_billing_provider, update_dentistry_billing
from ..db import get_session
from ..models import BillingStatus, Dentistry

router = APIRouter(prefix="/billing", tags=["billing"])


class SubscriptionRequest(SQLModel):
    customer_email: str


class SubscriptionResponse(SQLModel):
    dentistry_id: int
    subscription_id: str
    customer_id: str
    status: BillingStatus
    management_url: str | None = None


class CancelResponse(SQLModel):
    dentistry_id: int
    status: BillingStatus


class BillingStatusResponse(SQLModel):
    dentistry_id: int
    billing_status: BillingStatus
    subscription_id: str | None = None


class WebhookAcknowledge(SQLModel):
    received: bool


def _get_dentistry_or_404(session: Session, dentistry_id: int) -> Dentistry:
    dentistry = session.get(Dentistry, dentistry_id)
    if not dentistry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dentistry not found")
    return dentistry


@router.post("/{dentistry_id}/subscribe", response_model=SubscriptionResponse)
def create_subscription(
    dentistry_id: int,
    payload: SubscriptionRequest,
    session: Session = Depends(get_session),
    provider: BillingProvider = Depends(get_billing_provider),
):
    dentistry = _get_dentistry_or_404(session, dentistry_id)
    details = provider.create_subscription(dentistry, payload.customer_email)
    update_dentistry_billing(dentistry, details=details)
    session.add(dentistry)
    session.commit()
    session.refresh(dentistry)
    return SubscriptionResponse(
        dentistry_id=dentistry.id,
        subscription_id=dentistry.billing_subscription_id,
        customer_id=dentistry.billing_customer_id,
        status=dentistry.billing_status,
        management_url=details.management_url,
    )


@router.post("/{dentistry_id}/cancel", response_model=CancelResponse)
def cancel_subscription(
    dentistry_id: int,
    session: Session = Depends(get_session),
    provider: BillingProvider = Depends(get_billing_provider),
):
    dentistry = _get_dentistry_or_404(session, dentistry_id)
    if not dentistry.billing_subscription_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active subscription found")
    status_update = provider.cancel_subscription(dentistry.billing_subscription_id)
    update_dentistry_billing(dentistry, status_update=status_update)
    session.add(dentistry)
    session.commit()
    return CancelResponse(dentistry_id=dentistry.id, status=dentistry.billing_status)


@router.get("/{dentistry_id}/status", response_model=BillingStatusResponse)
def get_billing_status(dentistry_id: int, session: Session = Depends(get_session)):
    dentistry = _get_dentistry_or_404(session, dentistry_id)
    return BillingStatusResponse(
        dentistry_id=dentistry.id,
        billing_status=dentistry.billing_status,
        subscription_id=dentistry.billing_subscription_id,
    )


@router.post("/webhook", response_model=WebhookAcknowledge)
async def handle_webhook(
    request: Request,
    session: Session = Depends(get_session),
    provider: BillingProvider = Depends(get_billing_provider),
):
    payload = await request.json()
    event: BillingEvent = provider.parse_webhook(payload)
    dentistry = session.exec(
        select(Dentistry).where(Dentistry.billing_subscription_id == event.subscription_id)
    ).first()
    if not dentistry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not recognized")

    update_dentistry_billing(dentistry, status_update=event.status)
    session.add(dentistry)
    session.commit()
    return WebhookAcknowledge(received=True)
