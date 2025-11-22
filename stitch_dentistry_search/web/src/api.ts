export type DentistrySummary = {
  id: string;
  name: string;
  city: string;
  distanceMinutes?: number;
  rating?: number;
};

export type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  price?: number;
  description?: string;
  active?: boolean;
};

export type StaffMember = {
  id: string;
  name: string;
  title: string;
  role?: string;
  specialties?: string[];
  services?: string[];
};

export type AccessInfo = {
  address: string;
  city: string;
  phone?: string;
  transit?: string;
  parking?: string;
};

export type PracticeProfile = {
  name: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  website?: string;
};

export type DentistryDetail = DentistrySummary & {
  description?: string;
  services: Service[];
  staff: StaffMember[];
  access: AccessInfo;
};

export type Provider = {
  id: string;
  name: string;
  title: string;
  specialties?: string[];
};

export type AvailabilitySlot = {
  start: string;
  end?: string;
  timezone?: string;
};

export type BookingRequest = {
  dentistryId: string;
  serviceId: string;
  providerId: string;
  slotStart: string;
  slotEnd?: string;
  patientName: string;
};

export type BookingResponse = {
  confirmationNumber: string;
  message: string;
};

export type BillingStatus = {
  plan: string;
  status: 'active' | 'past_due' | 'trialing' | 'canceled';
  renewalDate?: string;
  amountDueCents?: number;
  paymentMethod?: string;
};

const toJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
};

export const createApiClient = (baseUrl: string) => {
  const request = async <T>(path: string, init?: RequestInit) => {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url, init);
    return toJson<T>(response);
  };

  return {
    searchDentistries: (query: string, init?: RequestInit) =>
      request<DentistrySummary[]>(`/dentistries?query=${encodeURIComponent(query)}`, init),
    getDentistry: (id: string, init?: RequestInit) =>
      request<DentistryDetail>(`/dentistries/${id}`, init),
    getProviders: (dentistryId: string, serviceId: string, init?: RequestInit) =>
      request<Provider[]>(
        `/dentistries/${dentistryId}/providers?serviceId=${encodeURIComponent(serviceId)}`,
        init
      ),
    getAvailability: (providerId: string, serviceId: string, init?: RequestInit) =>
      request<AvailabilitySlot[]>(
        `/providers/${providerId}/availability?serviceId=${encodeURIComponent(serviceId)}`,
        init
      ),
    bookAppointment: (payload: BookingRequest, init?: RequestInit) =>
      request<BookingResponse>(`/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        ...init
      }),
    getPracticeProfile: (practiceId: string, init?: RequestInit) =>
      request<PracticeProfile>(`/practices/${practiceId}/profile`, init),
    updatePracticeProfile: (practiceId: string, payload: PracticeProfile, init?: RequestInit) =>
      request<PracticeProfile>(`/practices/${practiceId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        ...init
      }),
    getServices: (practiceId: string, init?: RequestInit) =>
      request<Service[]>(`/practices/${practiceId}/services`, init),
    createService: (practiceId: string, payload: Omit<Service, 'id'>, init?: RequestInit) =>
      request<Service>(`/practices/${practiceId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        ...init
      }),
    getStaffRoster: (practiceId: string, init?: RequestInit) =>
      request<StaffMember[]>(`/practices/${practiceId}/staff`, init),
    updateStaffMember: (
      practiceId: string,
      staffId: string,
      payload: Partial<StaffMember>,
      init?: RequestInit
    ) =>
      request<StaffMember>(`/practices/${practiceId}/staff/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        ...init
      }),
    getPracticeAvailability: (practiceId: string, init?: RequestInit) =>
      request<AvailabilitySlot[]>(`/practices/${practiceId}/availability`, init),
    addAvailabilitySlot: (practiceId: string, payload: AvailabilitySlot, init?: RequestInit) =>
      request<AvailabilitySlot>(`/practices/${practiceId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        ...init
      }),
    getBillingStatus: (practiceId: string, init?: RequestInit) =>
      request<BillingStatus>(`/practices/${practiceId}/billing`, init)
  };
};

export type ApiClient = ReturnType<typeof createApiClient>;
