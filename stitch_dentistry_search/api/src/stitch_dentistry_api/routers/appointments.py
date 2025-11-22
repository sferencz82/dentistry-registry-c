from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from urllib.parse import quote_plus

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..db import get_session
from ..models import (
    AvailabilityRead,
    AvailabilitySlot,
    Booking,
    BookingConfirmation,
    BookingCreate,
    BookingRead,
    ContactDetails,
    DeliveryPreference,
    Dentistry,
    Patient,
    PatientCreate,
    Service,
    Staff,
)
from ..notifications import NotificationDispatcher


router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.get("/availability", response_model=list[AvailabilityRead])
def appointment_availability(
    dentistry_id: int,
    staff_id: int | None = None,
    service_id: int | None = None,
    for_date: date | None = None,
    session: Session = Depends(get_session),
):
    query = select(AvailabilitySlot).where(AvailabilitySlot.dentistry_id == dentistry_id)
    query = query.where(AvailabilitySlot.is_booked.is_(False))

    if staff_id:
        query = query.where(AvailabilitySlot.staff_id == staff_id)

    if for_date:
        day_start = datetime.combine(for_date, datetime.min.time(), tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        query = query.where(AvailabilitySlot.start_time >= day_start, AvailabilitySlot.start_time < day_end)

    if service_id:
        service = session.get(Service, service_id)
        if not service:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
        if service.dentistry_id != dentistry_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service not offered by the dentistry")

    return session.exec(query).all()


@router.get("/closest", response_model=AvailabilityRead)
def closest_available_appointment(
    dentistry_id: int,
    staff_id: int,
    service_id: int,
    target_time: datetime | None = None,
    session: Session = Depends(get_session),
):
    dentistry = session.get(Dentistry, dentistry_id)
    if not dentistry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dentistry not found")

    service = session.get(Service, service_id)
    if not service or service.dentistry_id != dentistry.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Service must belong to the dentistry"
        )

    staff_member = session.get(Staff, staff_id)
    if not staff_member or staff_member.dentistry_id != dentistry.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Staff not found")

    reference_time = target_time or datetime.now(timezone.utc)
    if reference_time.tzinfo is None:
        reference_time = reference_time.replace(tzinfo=timezone.utc)

    query = (
        select(AvailabilitySlot)
        .where(
            AvailabilitySlot.dentistry_id == dentistry.id,
            AvailabilitySlot.staff_id == staff_member.id,
            AvailabilitySlot.is_booked.is_(False),
        )
        .order_by(AvailabilitySlot.start_time)
    )
    slots = session.exec(query).all()
    if not slots:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No availability found")

    def _distance(slot: AvailabilitySlot) -> float:
        return abs((slot.start_time - reference_time).total_seconds())

    closest = min(slots, key=_distance)
    slot_duration = closest.end_time - closest.start_time
    if slot_duration < timedelta(minutes=service.duration_minutes):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Closest availability cannot fit the requested service",
        )

    return closest


def _get_patient(session: Session, patient_id: int | None, patient_payload: PatientCreate | None) -> Patient:
    if patient_id:
        patient = session.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
        return patient

    if not patient_payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient information is required")

    patient = Patient(**patient_payload.model_dump())
    session.add(patient)
    session.commit()
    session.refresh(patient)
    return patient


def _resolve_contact_details(patient: Patient, contact_details: ContactDetails | None) -> ContactDetails:
    details = contact_details or ContactDetails()
    details.email = details.email or patient.email
    details.phone = details.phone or patient.phone
    return details


def _validate_delivery_preference(contact_details: ContactDetails, preference: DeliveryPreference) -> None:
    if preference in {DeliveryPreference.email, DeliveryPreference.both} and not contact_details.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email contact required for the selected delivery preference",
        )

    if preference in {DeliveryPreference.sms, DeliveryPreference.both} and not contact_details.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number required for the selected delivery preference",
        )


def _build_map_link(address: str) -> str:
    return f"https://www.google.com/maps/search/?api=1&query={quote_plus(address)}"


@router.post("/", response_model=BookingConfirmation)
def book_appointment(payload: BookingCreate, session: Session = Depends(get_session)):
    dentistry = session.get(Dentistry, payload.dentistry_id)
    if not dentistry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dentistry not found")

    service = session.get(Service, payload.service_id)
    if not service or service.dentistry_id != dentistry.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service must belong to the dentistry")

    staff_member = session.get(Staff, payload.staff_id)
    if not staff_member or staff_member.dentistry_id != dentistry.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Staff must belong to the dentistry")

    slot = session.get(AvailabilitySlot, payload.slot_id)
    if not slot or slot.staff_id != staff_member.id or slot.dentistry_id != dentistry.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slot must belong to the staff member and dentistry")
    if slot.is_booked:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slot already booked")

    patient = _get_patient(session, payload.patient_id, payload.patient)

    contact_details = _resolve_contact_details(patient, payload.contact_details)
    _validate_delivery_preference(contact_details, payload.delivery_preference)

    booking = Booking(
        dentistry_id=dentistry.id,
        service_id=service.id,
        staff_id=staff_member.id,
        patient_id=patient.id,
        slot_id=slot.id,
        appointment_start=slot.start_time,
        appointment_end=slot.end_time,
    )
    slot.is_booked = True

    session.add(booking)
    session.add(slot)
    session.commit()
    session.refresh(booking)

    booking_read = BookingRead.model_validate(booking)
    access_instructions = (
        dentistry.description or "Please arrive 10 minutes early and check in at the reception desk."
    )
    map_link = _build_map_link(dentistry.address)
    patient_message = (
        f"Booked {service.name} with {staff_member.name} at {booking.appointment_start.isoformat()} "
        f"at {dentistry.name}. Location: {dentistry.address}. Map: {map_link}. Access: {access_instructions}. "
        f"Estimated price: ${service.price:.2f}."
    )
    dentistry_message = (
        f"New appointment for {patient.full_name} ({contact_details.email}, {contact_details.phone}) "
        f"for {service.name} at {booking.appointment_start.isoformat()} with {staff_member.name}."
    )

    dispatcher = NotificationDispatcher()
    dispatcher.notify_patient(
        contact=contact_details,
        preference=payload.delivery_preference,
        subject="Appointment confirmation",
        message=patient_message,
    )
    dispatcher.notify_dentistry(dentistry.email, dentistry.phone, dentistry_message)

    return BookingConfirmation(
        booking=booking_read,
        patient_message=patient_message,
        dentistry_message=dentistry_message,
        patient_contact=contact_details,
        location=dentistry.address,
        map_link=map_link,
        access_instructions=access_instructions,
        price_estimate=service.price,
    )
