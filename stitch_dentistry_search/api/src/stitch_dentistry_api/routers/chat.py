from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, SQLModel, select

from ..db import get_session
from ..models import (
    AvailabilitySlot,
    BookingConfirmation,
    BookingCreate,
    ContactDetails,
    KnowledgeBaseEntry,
    PatientCreate,
    Service,
    Staff,
)
from . import appointments

router = APIRouter(prefix="/chat", tags=["chat"])


@dataclass
class ChatBookingState:
    dentistry_id: int
    service_id: int | None = None
    staff_id: int | None = None
    slot_id: int | None = None
    patient_name: str | None = None
    patient_email: str | None = None
    patient_phone: str | None = None


@dataclass
class ChatSessionState:
    stage: str = "idle"
    booking: ChatBookingState | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


chat_sessions: dict[str, ChatSessionState] = {}


class ChatMessageRequest(SQLModel):
    message: str
    dentistry_id: int
    conversation_id: str | None = None


class ChatMessageResponse(SQLModel):
    conversation_id: str
    reply: str
    faq_answered: bool = False
    awaiting: str | None = None
    booking_confirmation: BookingConfirmation | None = None


WORD_REGEX = re.compile(r"(\w+)")


def _find_best_faq(session: Session, dentistry_id: int, message: str) -> KnowledgeBaseEntry | None:
    entries = session.exec(
        select(KnowledgeBaseEntry).where(KnowledgeBaseEntry.dentistry_id == dentistry_id)
    ).all()
    if not entries:
        return None

    message_words = set(word.lower() for word in WORD_REGEX.findall(message))
    best_entry: KnowledgeBaseEntry | None = None
    best_score = 0
    for entry in entries:
        question_words = set(word.lower() for word in WORD_REGEX.findall(entry.question))
        score = len(message_words & question_words)
        if entry.question.lower() in message.lower():
            score += len(question_words)
        if score > best_score:
            best_score = score
            best_entry = entry

    if best_score == 0:
        return None

    return best_entry


def _parse_int_from_message(message: str) -> int | None:
    match = re.search(r"(\d+)", message)
    return int(match.group(1)) if match else None


def _parse_contact_details(message: str) -> tuple[str | None, str | None, str | None]:
    lowered = message.lower()
    name = email = phone = None
    for part in re.split(r"[,;]\s*", message):
        if "name" in part.lower():
            name = part.split("=", maxsplit=1)[-1].strip()
        if "email" in part.lower():
            email = part.split("=", maxsplit=1)[-1].strip()
        if "phone" in part.lower():
            phone = part.split("=", maxsplit=1)[-1].strip()
    if not any([name, email, phone]) and "@" in lowered:
        email = message.strip()
    return name or None, email or None, phone or None


def _start_booking(conversation_id: str, dentistry_id: int) -> ChatMessageResponse:
    chat_sessions[conversation_id] = ChatSessionState(
        stage="awaiting_service",
        booking=ChatBookingState(dentistry_id=dentistry_id),
    )
    return ChatMessageResponse(
        conversation_id=conversation_id,
        reply="Sure, let's book an appointment. Which service ID would you like?",
        faq_answered=False,
        awaiting="service_id",
    )


def _ask_for_staff(conversation_id: str) -> ChatMessageResponse:
    chat_sessions[conversation_id].stage = "awaiting_staff"
    return ChatMessageResponse(
        conversation_id=conversation_id,
        reply="Got it. Which staff ID do you prefer?",
        faq_answered=False,
        awaiting="staff_id",
    )


def _ask_for_slot(conversation_id: str) -> ChatMessageResponse:
    chat_sessions[conversation_id].stage = "awaiting_slot"
    return ChatMessageResponse(
        conversation_id=conversation_id,
        reply="Please provide the availability slot ID you'd like to book.",
        faq_answered=False,
        awaiting="slot_id",
    )


def _ask_for_contact(conversation_id: str) -> ChatMessageResponse:
    chat_sessions[conversation_id].stage = "awaiting_contact"
    return ChatMessageResponse(
        conversation_id=conversation_id,
        reply="Share your name, email, and phone as name=..., email=..., phone=...",
        faq_answered=False,
        awaiting="contact",
    )


def _complete_booking(
    conversation_id: str, state: ChatBookingState, session: Session
) -> ChatMessageResponse:
    contact = ContactDetails(email=state.patient_email, phone=state.patient_phone)
    payload = BookingCreate(
        dentistry_id=state.dentistry_id,
        service_id=state.service_id,
        staff_id=state.staff_id,
        slot_id=state.slot_id,
        patient=PatientCreate(
            full_name=state.patient_name or "Chat Patient",
            email=state.patient_email or "unknown@example.com",
            phone=state.patient_phone or "",
        ),
        contact_details=contact,
    )
    confirmation: BookingConfirmation = appointments.book_appointment(payload, session=session)
    chat_sessions.pop(conversation_id, None)
    return ChatMessageResponse(
        conversation_id=conversation_id,
        reply="Your booking is confirmed!",
        faq_answered=False,
        awaiting=None,
        booking_confirmation=confirmation,
    )


@router.post("/message", response_model=ChatMessageResponse)
def chat_message(payload: ChatMessageRequest, session: Session = Depends(get_session)):
    conversation_id = payload.conversation_id or str(uuid4())
    state = chat_sessions.get(conversation_id, ChatSessionState())

    if "book" in payload.message.lower() and state.stage == "idle":
        return _start_booking(conversation_id, payload.dentistry_id)

    if state.stage.startswith("awaiting") and not state.booking:
        state.booking = ChatBookingState(dentistry_id=payload.dentistry_id)

    if state.stage == "awaiting_service":
        service_id = _parse_int_from_message(payload.message)
        if not service_id:
            return _start_booking(conversation_id, payload.dentistry_id)
        service = session.get(Service, service_id)
        if not service or service.dentistry_id != state.booking.dentistry_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid service")
        state.booking.service_id = service_id
        chat_sessions[conversation_id] = state
        return _ask_for_staff(conversation_id)

    if state.stage == "awaiting_staff":
        staff_id = _parse_int_from_message(payload.message)
        if not staff_id:
            return _ask_for_staff(conversation_id)
        staff_member = session.get(Staff, staff_id)
        if not staff_member or staff_member.dentistry_id != state.booking.dentistry_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid staff member")
        state.booking.staff_id = staff_id
        chat_sessions[conversation_id] = state
        return _ask_for_slot(conversation_id)

    if state.stage == "awaiting_slot":
        slot_id = _parse_int_from_message(payload.message)
        if not slot_id:
            return _ask_for_slot(conversation_id)
        slot = session.get(AvailabilitySlot, slot_id)
        if not slot or slot.dentistry_id != state.booking.dentistry_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid slot")
        state.booking.slot_id = slot_id
        chat_sessions[conversation_id] = state
        return _ask_for_contact(conversation_id)

    if state.stage == "awaiting_contact":
        name, email, phone = _parse_contact_details(payload.message)
        state.booking.patient_name = name
        state.booking.patient_email = email
        state.booking.patient_phone = phone
        chat_sessions[conversation_id] = state
        if not all([state.booking.service_id, state.booking.staff_id, state.booking.slot_id]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking context incomplete")
        return _complete_booking(conversation_id, state.booking, session)

    faq = _find_best_faq(session, payload.dentistry_id, payload.message)
    if faq:
        return ChatMessageResponse(
            conversation_id=conversation_id,
            reply=faq.answer,
            faq_answered=True,
            awaiting=None,
        )

    return ChatMessageResponse(
        conversation_id=conversation_id,
        reply="I can help with FAQs or booking appointments. Mention 'book' to get started.",
        faq_answered=False,
        awaiting=None,
    )
