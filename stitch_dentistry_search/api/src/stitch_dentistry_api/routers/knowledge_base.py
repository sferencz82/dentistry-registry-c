from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..billing import ensure_premium_access
from ..db import get_session
from ..models import (
    Dentistry,
    KnowledgeBaseEntry,
    KnowledgeBaseEntryCreate,
    KnowledgeBaseEntryRead,
    KnowledgeBaseEntryUpdate,
)

router = APIRouter(prefix="/admin/knowledge-base", tags=["knowledge_base"])


def _get_entry_or_404(session: Session, entry_id: int) -> KnowledgeBaseEntry:
    entry = session.get(KnowledgeBaseEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    return entry


@router.get("/", response_model=list[KnowledgeBaseEntryRead])
def list_entries(dentistry_id: int | None = None, session: Session = Depends(get_session)):
    query = select(KnowledgeBaseEntry)
    if dentistry_id:
        query = query.where(KnowledgeBaseEntry.dentistry_id == dentistry_id)
    return session.exec(query).all()


@router.post("/", response_model=KnowledgeBaseEntryRead, status_code=status.HTTP_201_CREATED)
def create_entry(payload: KnowledgeBaseEntryCreate, session: Session = Depends(get_session)):
    dentistry = session.get(Dentistry, payload.dentistry_id)
    ensure_premium_access(dentistry)
    entry = KnowledgeBaseEntry(**payload.model_dump())
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


@router.put("/{entry_id}", response_model=KnowledgeBaseEntryRead)
@router.patch("/{entry_id}", response_model=KnowledgeBaseEntryRead)
def update_entry(
    entry_id: int, payload: KnowledgeBaseEntryUpdate, session: Session = Depends(get_session)
):
    entry = _get_entry_or_404(session, entry_id)
    dentistry = session.get(Dentistry, entry.dentistry_id)
    ensure_premium_access(dentistry)
    entry_data = payload.model_dump(exclude_unset=True)
    for field, value in entry_data.items():
        setattr(entry, field, value)
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(entry_id: int, session: Session = Depends(get_session)):
    entry = _get_entry_or_404(session, entry_id)
    dentistry = session.get(Dentistry, entry.dentistry_id)
    ensure_premium_access(dentistry)
    session.delete(entry)
    session.commit()
    return None
