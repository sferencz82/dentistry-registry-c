from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..db import get_session
from ..models import (
    AvailabilityRead,
    AvailabilitySlot,
    Booking,
    BookingConfirmation,
    BookingCreate,
    BookingRead,
    Dentistry,
    Patient,
    PatientCreate,
    Service,
    Staff,
)


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
    return BookingConfirmation(
        booking=booking_read,
        patient_message=(
            f"Booked {service.name} with {staff_member.name} at {booking.appointment_start.isoformat()}"
        ),
        dentistry_message=(
            f"New appointment for {patient.full_name} for {service.name} at {booking.appointment_start.isoformat()}"
        ),
    )
