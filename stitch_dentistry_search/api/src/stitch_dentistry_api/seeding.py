from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from .models import (
    AvailabilitySlot,
    Dentistry,
    Patient,
    Service,
    Staff,
    StaffRole,
)


def seed_data(session: Session) -> None:
    if session.exec(select(Dentistry)).first():
        return

    bright_smiles = Dentistry(
        name="Bright Smiles Dental",
        description="Comprehensive family dentistry with weekend hours.",
        address="123 Main Street, Springfield",
        phone="555-123-4567",
        email="hello@brightsmiles.test",
    )
    session.add(bright_smiles)
    session.commit()
    session.refresh(bright_smiles)

    cleaning = Service(
        dentistry_id=bright_smiles.id,
        name="Teeth Cleaning",
        description="Standard cleaning and hygiene consult.",
        duration_minutes=45,
        price=120.0,
    )
    exam = Service(
        dentistry_id=bright_smiles.id,
        name="Comprehensive Exam",
        description="Full oral health exam with x-rays.",
        duration_minutes=60,
        price=185.0,
    )
    session.add(cleaning)
    session.add(exam)
    session.commit()

    dr_john = Staff(
        dentistry_id=bright_smiles.id,
        name="Dr. John Miller",
        role=StaffRole.dentist,
        email="john@brightsmiles.test",
        phone="555-201-1000",
    )
    hygienist = Staff(
        dentistry_id=bright_smiles.id,
        name="Alicia Sanders",
        role=StaffRole.hygienist,
        email="alicia@brightsmiles.test",
        phone="555-202-2000",
    )
    session.add(dr_john)
    session.add(hygienist)
    session.commit()
    session.refresh(dr_john)
    session.refresh(hygienist)

    now = datetime.now(timezone.utc)
    slots = []
    for idx in range(3):
        start = now + timedelta(days=1, hours=idx)
        slots.append(
            AvailabilitySlot(
                staff_id=dr_john.id,
                dentistry_id=bright_smiles.id,
                start_time=start,
                end_time=start + timedelta(minutes=60),
            )
        )
    for idx in range(2):
        start = now + timedelta(days=2, hours=idx + 2)
        slots.append(
            AvailabilitySlot(
                staff_id=hygienist.id,
                dentistry_id=bright_smiles.id,
                start_time=start,
                end_time=start + timedelta(minutes=45),
            )
        )

    session.add_all(slots)
    session.commit()

    sample_patient = Patient(full_name="Mara Simpson", email="mara@example.com", phone="555-888-9999")
    session.add(sample_patient)
    session.commit()
