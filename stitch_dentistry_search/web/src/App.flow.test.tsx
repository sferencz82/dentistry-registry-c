import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { AvailabilitySlot, BillingStatus, PracticeProfile, Service, StaffMember } from './api';

const mockFetchResponse = (data: unknown): Promise<Response> =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as unknown as Response);

describe('Practice admin data flows', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('loads practice data and handles optimistic updates for services and availability', async () => {
    const profile: PracticeProfile = {
      name: 'Central Dental',
      address: '11 Main St',
      city: 'Seattle',
      state: 'WA',
      postalCode: '98101',
      phone: '555-1212',
      email: 'hello@central.test'
    };

    const services: Service[] = [{ id: 'svc-1', name: 'Cleaning', durationMinutes: 45, price: 120 }];

    const staff: StaffMember[] = [
      { id: 'staff-1', name: 'Dr. Nova', title: 'DDS', role: 'Dentist', specialties: ['Implants'] },
      { id: 'staff-2', name: 'Hygienist Hale', title: 'RDH', role: 'Hygienist' }
    ];

    const availability: AvailabilitySlot[] = [
      { start: '2024-05-25T10:00:00Z', end: '2024-05-25T10:45:00Z' }
    ];

    const billing: BillingStatus = {
      plan: 'Pro',
      status: 'active',
      renewalDate: '2024-06-01',
      amountDueCents: 12000,
      paymentMethod: 'Visa •1234'
    };

    const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock;

    fetchMock
      .mockImplementationOnce(() => mockFetchResponse(profile))
      .mockImplementationOnce(() => mockFetchResponse(services))
      .mockImplementationOnce(() => mockFetchResponse(staff))
      .mockImplementationOnce(() => mockFetchResponse(availability))
      .mockImplementationOnce(() => mockFetchResponse(billing))
      .mockImplementationOnce(() => mockFetchResponse({ ...profile, name: 'Central Dental Collective' }))
      .mockImplementationOnce(() =>
        mockFetchResponse({ id: 'svc-2', name: 'Whitening', durationMinutes: 60, price: 250 })
      )
      .mockImplementationOnce(() =>
        mockFetchResponse({ ...staff[0], role: 'Lead Dentist', specialties: ['Implants', 'Invisalign'] })
      )
      .mockImplementationOnce(() =>
        mockFetchResponse({ start: '2024-06-01T10:00:00Z', end: '2024-06-01T11:00:00Z' })
      );

    render(<App />);

    expect(await screen.findByDisplayValue('Central Dental')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Practice name'), {
      target: { value: 'Central Dental Collective' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Save profile/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/practices/demo-practice/profile'),
        expect.objectContaining({ method: 'PUT' })
      )
    );
    expect(await screen.findByText(/Profile saved/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Service name'), { target: { value: 'Whitening' } });
    fireEvent.change(screen.getByLabelText('Duration'), { target: { value: '60' } });
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '250' } });
    fireEvent.click(screen.getByRole('button', { name: /Add service/i }));

    expect(await screen.findByText('Whitening')).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/practices/demo-practice/services'),
        expect.objectContaining({ method: 'POST' })
      )
    );

    fireEvent.change(screen.getByLabelText('Select staff'), { target: { value: 'staff-1' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'Lead Dentist' } });
    fireEvent.change(screen.getByLabelText('Specialties'), { target: { value: 'Implants, Invisalign' } });
    fireEvent.click(screen.getByRole('button', { name: /Update staff/i }));

    expect(await screen.findByText(/Staff details updated/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/practices/demo-practice/staff/staff-1'),
        expect.objectContaining({ method: 'PUT' })
      )
    );

    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '2024-06-01T10:00' } });
    fireEvent.change(screen.getByLabelText('Availability duration'), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: /Add slot/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/practices/demo-practice/availability'),
        expect.objectContaining({ method: 'POST' })
      )
    );
    expect(await screen.findByText(/Jun/)).toBeInTheDocument();
  });

  test('validates required fields before saving', async () => {
    const profile: PracticeProfile = { name: 'West Clinic', address: '55 Oak', city: 'Portland' };
    const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock;

    fetchMock
      .mockImplementationOnce(() => mockFetchResponse(profile))
      .mockImplementationOnce(() => mockFetchResponse([]))
      .mockImplementationOnce(() => mockFetchResponse([]))
      .mockImplementationOnce(() => mockFetchResponse([]))
      .mockImplementationOnce(() => mockFetchResponse({ plan: 'Starter', status: 'trialing' }));

    render(<App />);

    expect(await screen.findByDisplayValue('West Clinic')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Contact email'), { target: { value: 'invalid' } });
    fireEvent.click(screen.getByRole('button', { name: /Save profile/i }));

    expect(await screen.findByText(/Enter a valid contact email/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(5);

    fireEvent.change(screen.getByLabelText('Service name'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Add service/i }));

    expect(await screen.findByText(/Service name is required/)).toBeInTheDocument();
  });
});
