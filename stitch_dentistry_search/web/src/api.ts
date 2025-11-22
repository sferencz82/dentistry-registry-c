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
};

export type StaffMember = {
  id: string;
  name: string;
  title: string;
  services: string[];
};

export type AccessInfo = {
  address: string;
  city: string;
  phone?: string;
  transit?: string;
  parking?: string;
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
      })
  };
};

export type ApiClient = ReturnType<typeof createApiClient>;
