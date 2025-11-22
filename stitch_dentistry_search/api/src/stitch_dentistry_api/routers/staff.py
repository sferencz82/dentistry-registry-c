from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..db import get_session
from ..models import (
    AvailabilityCreate,
    AvailabilityRead,
    AvailabilitySlot,
    Dentistry,
    Staff,
    StaffCreate,
    StaffRead,
    StaffUpdate,
)


router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("/", response_model=list[StaffRead])
def list_staff(dentistry_id: int | None = None, session: Session = Depends(get_session)):
    query = select(Staff)
    if dentistry_id:
        query = query.where(Staff.dentistry_id == dentistry_id)
    return session.exec(query).all()


@router.post("/", response_model=StaffRead, status_code=status.HTTP_201_CREATED)
def create_staff(payload: StaffCreate, session: Session = Depends(get_session)):
    dentistry = session.get(Dentistry, payload.dentistry_id)
    if not dentistry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dentistry not found")

    staff_member = Staff(**payload.model_dump())
    session.add(staff_member)
    session.commit()
    session.refresh(staff_member)
    return staff_member


@router.get("/{staff_id}", response_model=StaffRead)
def get_staff(staff_id: int, session: Session = Depends(get_session)):
    staff_member = session.get(Staff, staff_id)
    if not staff_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")
    return staff_member


@router.put("/{staff_id}", response_model=StaffRead)
def update_staff(staff_id: int, payload: StaffUpdate, session: Session = Depends(get_session)):
    staff_member = session.get(Staff, staff_id)
    if not staff_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(staff_member, key, value)

    session.add(staff_member)
    session.commit()
    session.refresh(staff_member)
    return staff_member


@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_staff(staff_id: int, session: Session = Depends(get_session)):
    staff_member = session.get(Staff, staff_id)
    if not staff_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")
    session.delete(staff_member)
    session.commit()


@router.post("/{staff_id}/availability", response_model=AvailabilityRead, status_code=status.HTTP_201_CREATED)
def add_availability(staff_id: int, payload: AvailabilityCreate, session: Session = Depends(get_session)):
    staff_member = session.get(Staff, staff_id)
    if not staff_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")

    if payload.staff_id != staff_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mismatched staff identifier")

    slot = AvailabilitySlot(**payload.model_dump())
    session.add(slot)
    session.commit()
    session.refresh(slot)
    return slot


@router.get("/{staff_id}/availability", response_model=list[AvailabilityRead])
def list_availability(staff_id: int, session: Session = Depends(get_session)):
    staff_member = session.get(Staff, staff_id)
    if not staff_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")

    return session.exec(select(AvailabilitySlot).where(AvailabilitySlot.staff_id == staff_id)).all()
