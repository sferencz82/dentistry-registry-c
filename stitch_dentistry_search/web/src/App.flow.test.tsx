import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { AvailabilitySlot, DentistryDetail, DentistrySummary, Provider } from './api';

const mockFetchResponse = (data: unknown): Promise<Response> =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as unknown as Response);

const mockFetchError = (message: string) => Promise.reject(new Error(message));

describe('Dentistry search and booking flow', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('completes a booking after selecting service, provider, and slot', async () => {
    const dentistries: DentistrySummary[] = [
      { id: '1', name: 'Downtown Smiles', city: 'Seattle', rating: 4.9, distanceMinutes: 8 }
    ];

    const detail: DentistryDetail = {
      id: '1',
      name: 'Downtown Smiles',
      city: 'Seattle',
      services: [
        { id: 'svc-clean', name: 'Teeth Cleaning', durationMinutes: 45 },
        { id: 'svc-check', name: 'Comprehensive Checkup', durationMinutes: 60 }
      ],
      staff: [
        { id: 'staff-1', name: 'Dr. Dent', title: 'DDS', services: ['svc-clean', 'svc-check'] },
        { id: 'staff-2', name: 'Hygienist Hall', title: 'RDH', services: ['svc-clean'] }
      ],
      access: { address: '123 Main St', city: 'Seattle', phone: '555-1212', transit: 'Near Link', parking: 'Garage' }
    };

    const providers: Provider[] = [
      { id: 'staff-1', name: 'Dr. Dent', title: 'DDS' },
      { id: 'staff-2', name: 'Hygienist Hall', title: 'RDH' }
    ];

    const slots: AvailabilitySlot[] = [
      { start: '2024-05-25T10:00:00Z', end: '2024-05-25T10:45:00Z' },
      { start: '2024-05-25T11:00:00Z', end: '2024-05-25T11:45:00Z' }
    ];

    const bookingResponse = { confirmationNumber: 'ABC123', message: 'Appointment booked' };

    const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock;
    fetchMock
      .mockImplementationOnce(() => mockFetchResponse(dentistries))
      .mockImplementationOnce(() => mockFetchResponse(detail))
      .mockImplementationOnce(() => mockFetchResponse(providers))
      .mockImplementationOnce(() => mockFetchResponse(slots))
      .mockImplementationOnce(() => mockFetchResponse(bookingResponse));

    render(<App />);

    fireEvent.change(screen.getByLabelText(/Search dentistry/i), {
      target: { value: 'Downtown' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));

    await waitFor(() => expect(screen.getByText('Downtown Smiles')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Select Downtown Smiles/i }));

    await waitFor(() => expect(screen.getByText(/Address:/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Teeth Cleaning' }));

    await waitFor(() => expect(screen.getByLabelText('Select slot Sat, May 25, 10:00 AM')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Dr. Dent'));
    fireEvent.click(screen.getByLabelText('Select slot Sat, May 25, 10:00 AM'));
    fireEvent.click(screen.getByRole('button', { name: /Book appointment/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/Appointment booked Your confirmation number is ABC123/i)
      ).toBeInTheDocument()
    );

    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/appointments'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"serviceId":"svc-clean"')
      })
    );
  });

  test('shows validation when trying to book without selections', async () => {
    const dentistries: DentistrySummary[] = [{ id: '1', name: 'North Clinic', city: 'Portland' }];
    const detail: DentistryDetail = {
      id: '1',
      name: 'North Clinic',
      city: 'Portland',
      services: [{ id: 'svc-clean', name: 'Clean', durationMinutes: 30 }],
      staff: [],
      access: { address: '22 Oak St', city: 'Portland' }
    };
    const providers: Provider[] = [{ id: 'staff-1', name: 'Dr. Early', title: 'DDS' }];
    const slots: AvailabilitySlot[] = [{ start: '2024-05-26T09:00:00Z' }];

    const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock;
    fetchMock
      .mockImplementationOnce(() => mockFetchResponse(dentistries))
      .mockImplementationOnce(() => mockFetchResponse(detail))
      .mockImplementationOnce(() => mockFetchResponse(providers))
      .mockImplementationOnce(() => mockFetchResponse(slots))
      .mockImplementationOnce(() => mockFetchResponse({ confirmationNumber: 'BBB', message: 'ok' }));

    render(<App />);

    fireEvent.change(screen.getByLabelText(/Search dentistry/i), { target: { value: 'north' } });
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));

    await waitFor(() => expect(screen.getByText('North Clinic')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Select North Clinic/i }));
    await waitFor(() => expect(screen.getByText(/Address:/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Clean' }));
    fireEvent.click(screen.getByLabelText('Dr. Early'));
    fireEvent.click(screen.getByRole('button', { name: /Book appointment/i }));

    expect(
      await screen.findByText(/Select a service, provider, and available time before booking/i)
    ).toBeInTheDocument();
  });

  test('surfaces search errors to the user', async () => {
    const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock;
    fetchMock.mockImplementationOnce(() => mockFetchError('network down'));

    render(<App />);

    fireEvent.change(screen.getByLabelText(/Search dentistry/i), { target: { value: 'fail' } });
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));

    expect(await screen.findByText(/network down/i)).toBeInTheDocument();
  });
});
