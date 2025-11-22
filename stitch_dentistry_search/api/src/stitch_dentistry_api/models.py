from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlmodel import Field, Relationship, SQLModel


class SchemaMigration(SQLModel, table=True):
    version: str = Field(primary_key=True)
    applied_at: datetime = Field(default_factory=datetime.utcnow)


class BillingStatus(str, Enum):
    inactive = "inactive"
    trialing = "trialing"
    active = "active"
    past_due = "past_due"
    canceled = "canceled"


class DentistryBase(SQLModel):
    name: str
    description: str | None = None
    address: str
    phone: str
    email: str


class Dentistry(DentistryBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    billing_status: BillingStatus = Field(default=BillingStatus.inactive)
    billing_customer_id: str | None = None
    billing_subscription_id: str | None = None
    billing_provider: str | None = Field(default="stripe")
    services: list[Service] = Relationship(back_populates="dentistry")  # type: ignore[name-defined]
    staff_members: list[Staff] = Relationship(back_populates="dentistry")  # type: ignore[name-defined]


class DentistryCreate(DentistryBase):
    pass


class DentistryRead(DentistryBase):
    id: int
    billing_status: BillingStatus
    billing_customer_id: str | None = None
    billing_subscription_id: str | None = None
    billing_provider: str | None = None


class DentistryUpdate(SQLModel):
    name: str | None = None
    description: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    billing_status: BillingStatus | None = None
    billing_customer_id: str | None = None
    billing_subscription_id: str | None = None
    billing_provider: str | None = None


class ServiceBase(SQLModel):
    dentistry_id: int = Field(foreign_key="dentistry.id")
    name: str
    description: str | None = None
    duration_minutes: int
    price: float


class Service(ServiceBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    dentistry: Dentistry | None = Relationship(back_populates="services")


class ServiceCreate(ServiceBase):
    pass


class ServiceRead(ServiceBase):
    id: int


class ServiceUpdate(SQLModel):
    name: str | None = None
    description: str | None = None
    duration_minutes: int | None = None
    price: float | None = None


class StaffRole(str, Enum):
    dentist = "dentist"
    hygienist = "hygienist"
    specialist = "specialist"


class StaffBase(SQLModel):
    dentistry_id: int = Field(foreign_key="dentistry.id")
    name: str
    role: StaffRole
    email: str
    phone: str


class Staff(StaffBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    dentistry: Dentistry | None = Relationship(back_populates="staff_members")
    availability: list[AvailabilitySlot] = Relationship(back_populates="staff")  # type: ignore[name-defined]


class StaffCreate(StaffBase):
    pass


class StaffRead(StaffBase):
    id: int


class StaffUpdate(SQLModel):
    name: str | None = None
    role: StaffRole | None = None
    email: str | None = None
    phone: str | None = None


class AvailabilityBase(SQLModel):
    staff_id: int = Field(foreign_key="staff.id")
    dentistry_id: int = Field(foreign_key="dentistry.id")
    start_time: datetime
    end_time: datetime


class AvailabilitySlot(AvailabilityBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    is_booked: bool = Field(default=False)
    staff: Staff | None = Relationship(back_populates="availability")


class AvailabilityCreate(AvailabilityBase):
    pass


class AvailabilityRead(AvailabilityBase):
    id: int
    is_booked: bool


class PatientBase(SQLModel):
    full_name: str
    email: str
    phone: str


class Patient(PatientBase, table=True):
    id: int | None = Field(default=None, primary_key=True)


class PatientCreate(PatientBase):
    pass


class PatientRead(PatientBase):
    id: int


class ContactDetails(SQLModel):
    email: str | None = None
    phone: str | None = None


class DeliveryPreference(str, Enum):
    email = "email"
    sms = "sms"
    both = "both"


class BookingBase(SQLModel):
    dentistry_id: int = Field(foreign_key="dentistry.id")
    service_id: int = Field(foreign_key="service.id")
    staff_id: int = Field(foreign_key="staff.id")
    patient_id: int = Field(foreign_key="patient.id")
    slot_id: int = Field(foreign_key="availabilityslot.id")
    appointment_start: datetime
    appointment_end: datetime


class Booking(BookingBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class BookingCreate(SQLModel):
    dentistry_id: int
    service_id: int
    staff_id: int
    slot_id: int
    patient_id: int | None = None
    patient: PatientCreate | None = None
    contact_details: ContactDetails | None = None
    delivery_preference: DeliveryPreference = DeliveryPreference.email


class BookingRead(BookingBase):
    id: int
    created_at: datetime


class BookingConfirmation(SQLModel):
    booking: BookingRead
    patient_message: str
    dentistry_message: str
    patient_contact: ContactDetails
    location: str
    map_link: str
    access_instructions: str
    price_estimate: float


class KnowledgeBaseEntryBase(SQLModel):
    dentistry_id: int = Field(foreign_key="dentistry.id")
    question: str
    answer: str
    category: str | None = None


class KnowledgeBaseEntry(KnowledgeBaseEntryBase, table=True):
    id: int | None = Field(default=None, primary_key=True)


class KnowledgeBaseEntryCreate(KnowledgeBaseEntryBase):
    pass


class KnowledgeBaseEntryRead(KnowledgeBaseEntryBase):
    id: int


class KnowledgeBaseEntryUpdate(SQLModel):
    question: str | None = None
    answer: str | None = None
    category: str | None = None
