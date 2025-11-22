import { FormEvent, useEffect, useMemo, useState } from 'react';
import { loadWebEnv } from './env';
import {
  AvailabilitySlot,
  DentistryDetail,
  DentistrySummary,
  Provider,
  Service,
  createApiClient
} from './api';

const formatSlot = (slot: AvailabilitySlot) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(slot.start));

export const App = () => {
  const env = useMemo(loadWebEnv, []);
  const api = useMemo(() => createApiClient(env.apiUrl), [env.apiUrl]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DentistrySummary[]>([]);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedDentistryId, setSelectedDentistryId] = useState<string | null>(null);
  const [dentistryDetail, setDentistryDetail] = useState<DentistryDetail | null>(null);
  const [detailStatus, setDetailStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [detailError, setDetailError] = useState<string | null>(null);

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersStatus, setProvidersStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [providersError, setProvidersError] = useState<string | null>(null);

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);

  const resetBookingSelections = () => {
    setSelectedServiceId(null);
    setProviders([]);
    setProvidersStatus('idle');
    setAvailability([]);
    setAvailabilityStatus('idle');
    setSelectedProviderId(null);
    setSelectedSlot(null);
    setValidationMessage(null);
    setBookingStatus('idle');
    setBookingMessage(null);
  };

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    setSearchStatus('loading');
    setSearchError(null);
    setSelectedDentistryId(null);
    setDentistryDetail(null);
    resetBookingSelections();

    try {
      const results = await api.searchDentistries(searchQuery.trim());
      setSearchResults(results);
      setSearchStatus('success');
      if (results.length === 0) {
        setSearchError('No dental practices matched your search.');
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Unable to search dentistries.');
      setSearchStatus('error');
    }
  };

  useEffect(() => {
    if (!selectedDentistryId) return;
    setDetailStatus('loading');
    setDetailError(null);
    setDentistryDetail(null);

    const abortController = new AbortController();
    api
      .getDentistry(selectedDentistryId, { signal: abortController.signal })
      .then((detail) => {
        if (!abortController.signal.aborted) {
          setDentistryDetail(detail);
          setDetailStatus('success');
        }
      })
      .catch((error) => {
        if (!abortController.signal.aborted) {
          setDetailError(error instanceof Error ? error.message : 'Unable to load dentistry.');
          setDetailStatus('error');
        }
      });

    return () => abortController.abort();
  }, [api, selectedDentistryId]);

  useEffect(() => {
    if (!selectedDentistryId || !selectedServiceId) return;
    setProvidersStatus('loading');
    setProvidersError(null);
    setProviders([]);
    setSelectedProviderId(null);
    setAvailability([]);
    setAvailabilityStatus('idle');

    const abortController = new AbortController();
    api
      .getProviders(selectedDentistryId, selectedServiceId, { signal: abortController.signal })
      .then((providerList) => {
        if (!abortController.signal.aborted) {
          setProviders(providerList);
          setProvidersStatus('success');
          if (providerList.length === 0) {
            setProvidersError('No providers available for this service.');
          }
        }
      })
      .catch((error) => {
        if (!abortController.signal.aborted) {
          setProvidersError(error instanceof Error ? error.message : 'Unable to load providers.');
          setProvidersStatus('error');
        }
      });

    return () => abortController.abort();
  }, [api, selectedDentistryId, selectedServiceId]);

  useEffect(() => {
    if (!selectedProviderId || !selectedServiceId) return;
    setAvailabilityStatus('loading');
    setAvailabilityError(null);
    setAvailability([]);
    setSelectedSlot(null);

    const abortController = new AbortController();
    api
      .getAvailability(selectedProviderId, selectedServiceId, { signal: abortController.signal })
      .then((slots) => {
        if (!abortController.signal.aborted) {
          setAvailability(slots);
          setAvailabilityStatus('success');
          if (slots.length === 0) {
            setAvailabilityError('No availability in the near future.');
          }
        }
      })
      .catch((error) => {
        if (!abortController.signal.aborted) {
          setAvailabilityError(error instanceof Error ? error.message : 'Unable to load availability.');
          setAvailabilityStatus('error');
        }
      });

    return () => abortController.abort();
  }, [api, selectedProviderId, selectedServiceId]);

  const selectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSelectedSlot(null);
    setSelectedProviderId(null);
    setAvailability([]);
    setAvailabilityStatus('idle');
    setValidationMessage(null);
  };

  const handleBookAppointment = async () => {
    if (!selectedDentistryId || !selectedServiceId || !selectedProviderId || !selectedSlot) {
      setValidationMessage('Select a service, provider, and available time before booking.');
      return;
    }

    setBookingStatus('loading');
    setBookingMessage(null);
    setValidationMessage(null);

    try {
      const response = await api.bookAppointment({
        dentistryId: selectedDentistryId,
        providerId: selectedProviderId,
        serviceId: selectedServiceId,
        slotStart: selectedSlot.start,
        slotEnd: selectedSlot.end,
        patientName: 'Walk-in Patient'
      });
      setBookingMessage(
        `${response.message} Your confirmation number is ${response.confirmationNumber}.`
      );
      setBookingStatus('success');
    } catch (error) {
      setBookingMessage(error instanceof Error ? error.message : 'Unable to book appointment.');
      setBookingStatus('error');
    }
  };

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <header>
        <h1>Stitch Dentistry Finder</h1>
        <p>Environment: {env.environment}</p>
        <p>API URL: {env.apiUrl}</p>
      </header>

      <section aria-label="dentistry search" style={{ marginBottom: '1.5rem' }}>
        <h2>Dentistry search</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ flexGrow: 1 }}>
            Search dentistry or city
            <input
              aria-label="Search dentistry"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
              placeholder="e.g. Downtown, Invisalign"
            />
          </label>
          <button type="submit" style={{ padding: '0.75rem 1rem' }}>
            {searchStatus === 'loading' ? 'Searching…' : 'Search'}
          </button>
        </form>
        {searchError && <p role="alert">{searchError}</p>}
        {searchStatus === 'success' && searchResults.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
            {searchResults.map((result) => (
              <li
                key={result.id}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  marginBottom: '0.5rem',
                  borderRadius: 8,
                  background: result.id === selectedDentistryId ? '#eef6ff' : 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{result.name}</strong>
                    <p style={{ margin: 0 }}>{result.city}</p>
                    {result.rating && <p style={{ margin: 0 }}>Rating: {result.rating.toFixed(1)}</p>}
                    {result.distanceMinutes && (
                      <p style={{ margin: 0 }}>~{result.distanceMinutes} min away</p>
                    )}
                  </div>
                  <button onClick={() => {
                    setSelectedDentistryId(result.id);
                    resetBookingSelections();
                  }} aria-label={`Select ${result.name}`}>
                    Select
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="dentistry details" style={{ marginBottom: '1.5rem' }}>
        <h2>Dentistry detail</h2>
        {detailStatus === 'loading' && <p>Loading practice details…</p>}
        {detailError && <p role="alert">{detailError}</p>}
        {dentistryDetail && (
          <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: 8 }}>
            <h3>{dentistryDetail.name}</h3>
            <p>{dentistryDetail.description}</p>
            <p>
              Address: {dentistryDetail.access.address}, {dentistryDetail.access.city}
            </p>
            {dentistryDetail.access.phone && <p>Phone: {dentistryDetail.access.phone}</p>}
            {dentistryDetail.access.transit && <p>Transit: {dentistryDetail.access.transit}</p>}
            {dentistryDetail.access.parking && <p>Parking: {dentistryDetail.access.parking}</p>}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <h4>Services</h4>
                {dentistryDetail.services.map((service: Service) => (
                  <button
                    key={service.id}
                    onClick={() => selectService(service.id)}
                    aria-label={service.name}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      borderRadius: 6,
                      border: selectedServiceId === service.id ? '2px solid #2563eb' : '1px solid #ccc',
                      background: selectedServiceId === service.id ? '#e5edff' : 'white'
                    }}
                  >
                    <strong>{service.name}</strong>
                    <span style={{ display: 'block' }}>Duration: {service.durationMinutes} min</span>
                    {service.price && <span style={{ display: 'block' }}>${service.price.toFixed(2)}</span>}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <h4>Staff</h4>
                <ul>
                  {dentistryDetail.staff.map((member) => (
                    <li key={member.id}>
                      <strong>{member.name}</strong> – {member.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>

      <section aria-label="provider selection" style={{ marginBottom: '1.5rem' }}>
        <h2>Provider selection</h2>
        {providersStatus === 'loading' && <p>Loading providers…</p>}
        {providersError && <p role="alert">{providersError}</p>}
        {providersStatus === 'success' && providers.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {providers.map((provider: Provider) => (
              <label
                key={provider.id}
                style={{
                  border: '1px solid #ddd',
                  padding: '0.75rem',
                  borderRadius: 8,
                  background: provider.id === selectedProviderId ? '#e5edff' : 'white',
                  minWidth: 240,
                  flex: 1
                }}
              >
                <input
                  type="radio"
                  name="provider"
                  value={provider.id}
                  checked={selectedProviderId === provider.id}
                  aria-label={provider.name}
                  onChange={() => {
                    setSelectedProviderId(provider.id);
                    setValidationMessage(null);
                  }}
                />{' '}
                <strong>{provider.name}</strong>
                <div>{provider.title}</div>
                {provider.specialties && provider.specialties.length > 0 && (
                  <div>Specialties: {provider.specialties.join(', ')}</div>
                )}
              </label>
            ))}
          </div>
        )}
      </section>

      <section aria-label="availability calendar" style={{ marginBottom: '1.5rem' }}>
        <h2>Nearest availability</h2>
        {availabilityStatus === 'loading' && <p>Checking calendar…</p>}
        {availabilityError && <p role="alert">{availabilityError}</p>}
        {availabilityStatus === 'success' && availability.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {availability.map((slot, index) => (
              <button
                key={`${slot.start}-${index}`}
                aria-label={`Select slot ${formatSlot(slot)}`}
                onClick={() => {
                  setSelectedSlot(slot);
                  setValidationMessage(null);
                }}
                style={{
                  padding: '0.75rem',
                  borderRadius: 6,
                  border: selectedSlot?.start === slot.start ? '2px solid #2563eb' : '1px solid #ccc',
                  background: selectedSlot?.start === slot.start ? '#e5edff' : 'white'
                }}
              >
                {formatSlot(slot)}
              </button>
            ))}
          </div>
        )}
      </section>

      <section aria-label="booking confirmation">
        <h2>Booking confirmation</h2>
        {validationMessage && <p role="alert">{validationMessage}</p>}
        <button onClick={handleBookAppointment} disabled={bookingStatus === 'loading'}>
          {bookingStatus === 'loading' ? 'Booking…' : 'Book appointment'}
        </button>
        {bookingMessage && (
          <p role="status" style={{ marginTop: '0.75rem' }}>
            {bookingMessage}
          </p>
        )}
      </section>
    </main>
  );
};

export default App;
