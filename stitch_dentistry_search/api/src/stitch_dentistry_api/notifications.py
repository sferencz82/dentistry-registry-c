from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from .models import ContactDetails, DeliveryPreference


class NotificationSender(Protocol):
    def send_email(self, to_address: str, subject: str, body: str) -> None:
        ...

    def send_sms(self, to_number: str, message: str) -> None:
        ...


@dataclass
class MockNotificationSender:
    sent: list[tuple[str, str, str | None, str]] | None = None

    def __post_init__(self) -> None:
        if self.sent is None:
            self.sent = []

    def send_email(self, to_address: str, subject: str, body: str) -> None:  # type: ignore[override]
        assert self.sent is not None
        self.sent.append(("email", to_address, subject, body))

    def send_sms(self, to_number: str, message: str) -> None:  # type: ignore[override]
        assert self.sent is not None
        self.sent.append(("sms", to_number, None, message))


class NotificationDispatcher:
    """Simple dispatcher to fan out confirmations to patients and dentistries."""

    def __init__(self, sender: NotificationSender | None = None) -> None:
        self.sender = sender or MockNotificationSender()

    def notify_patient(
        self,
        contact: ContactDetails,
        preference: DeliveryPreference,
        subject: str,
        message: str,
    ) -> None:
        if preference in {DeliveryPreference.email, DeliveryPreference.both} and contact.email:
            self.sender.send_email(contact.email, subject, message)

        if preference in {DeliveryPreference.sms, DeliveryPreference.both} and contact.phone:
            self.sender.send_sms(contact.phone, message)

    def notify_dentistry(self, dentistry_email: str | None, dentistry_phone: str | None, message: str) -> None:
        if dentistry_email:
            self.sender.send_email(dentistry_email, "New appointment booked", message)
        if dentistry_phone:
            self.sender.send_sms(dentistry_phone, message)
