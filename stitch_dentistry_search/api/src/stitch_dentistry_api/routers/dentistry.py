from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..db import get_session
from ..models import Dentistry, DentistryCreate, DentistryRead, DentistryUpdate


router = APIRouter(prefix="/dentistries", tags=["dentistries"])


@router.get("/", response_model=list[DentistryRead])
def list_dentistries(session: Session = Depends(get_session)):
    return session.exec(select(Dentistry)).all()


@router.post("/", response_model=DentistryRead, status_code=status.HTTP_201_CREATED)
def create_dentistry(payload: DentistryCreate, session: Session = Depends(get_session)):
    dentistry = Dentistry(**payload.model_dump())
    session.add(dentistry)
    session.commit()
    session.refresh(dentistry)
    return dentistry


@router.get("/{dentistry_id}", response_model=DentistryRead)
def get_dentistry(dentistry_id: int, session: Session = Depends(get_session)):
    dentistry = session.get(Dentistry, dentistry_id)
    if not dentistry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dentistry not found")
    return dentistry


@router.put("/{dentistry_id}", response_model=DentistryRead)
def update_dentistry(dentistry_id: int, payload: DentistryUpdate, session: Session = Depends(get_session)):
    dentistry = session.get(Dentistry, dentistry_id)
    if not dentistry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dentistry not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(dentistry, key, value)

    session.add(dentistry)
    session.commit()
    session.refresh(dentistry)
    return dentistry


@router.delete("/{dentistry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dentistry(dentistry_id: int, session: Session = Depends(get_session)):
    dentistry = session.get(Dentistry, dentistry_id)
    if not dentistry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dentistry not found")
    session.delete(dentistry)
    session.commit()
