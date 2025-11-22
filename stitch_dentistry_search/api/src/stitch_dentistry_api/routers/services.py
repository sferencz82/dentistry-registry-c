from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..db import get_session
from ..models import Dentistry, Service, ServiceCreate, ServiceRead, ServiceUpdate


router = APIRouter(prefix="/services", tags=["services"])


@router.get("/", response_model=list[ServiceRead])
def list_services(dentistry_id: int | None = None, session: Session = Depends(get_session)):
    query = select(Service)
    if dentistry_id:
        query = query.where(Service.dentistry_id == dentistry_id)
    return session.exec(query).all()


@router.post("/", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
def create_service(payload: ServiceCreate, session: Session = Depends(get_session)):
    dentistry = session.get(Dentistry, payload.dentistry_id)
    if not dentistry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dentistry not found")

    service = Service(**payload.model_dump())
    session.add(service)
    session.commit()
    session.refresh(service)
    return service


@router.get("/{service_id}", response_model=ServiceRead)
def get_service(service_id: int, session: Session = Depends(get_session)):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service


@router.put("/{service_id}", response_model=ServiceRead)
def update_service(service_id: int, payload: ServiceUpdate, session: Session = Depends(get_session)):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(service, key, value)

    session.add(service)
    session.commit()
    session.refresh(service)
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: int, session: Session = Depends(get_session)):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    session.delete(service)
    session.commit()
