import { FormEvent, useEffect, useMemo, useState } from 'react';
import { loadWebEnv } from './env';
import {
  AvailabilitySlot,
  BillingStatus,
  PracticeProfile,
  Service,
  StaffMember,
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

const formatCents = (amount?: number) =>
  typeof amount === 'number' ? `$${(amount / 100).toFixed(2)}` : '—';

export const App = () => {
  const env = useMemo(loadWebEnv, []);
  const api = useMemo(() => createApiClient(env.apiUrl), [env.apiUrl]);

  const practiceId = 'demo-practice';

  const [profile, setProfile] = useState<PracticeProfile | null>(null);
  const [profileForm, setProfileForm] = useState<PracticeProfile>({ name: '', address: '', city: '' });
  const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [serviceForm, setServiceForm] = useState<Omit<Service, 'id'>>({
    name: '',
    durationMinutes: 30,
    price: 0,
    description: '',
    active: true
  });
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffSelection, setStaffSelection] = useState<{
    id: string;
    role: string;
    specialties: string;
  } | null>(null);
  const [staffMessage, setStaffMessage] = useState<string | null>(null);

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [availabilityForm, setAvailabilityForm] = useState<{ start: string; durationMinutes: number }>({
    start: '',
    durationMinutes: 30
  });
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);

  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    setProfileStatus('loading');
    setBillingMessage(null);

    Promise.all([
      api.getPracticeProfile(practiceId, { signal: abortController.signal }),
      api.getServices(practiceId, { signal: abortController.signal }),
      api.getStaffRoster(practiceId, { signal: abortController.signal }),
      api.getPracticeAvailability(practiceId, { signal: abortController.signal }),
      api.getBillingStatus(practiceId, { signal: abortController.signal })
    ])
      .then(([profileResponse, servicesResponse, staffResponse, availabilityResponse, billing]) => {
        if (!abortController.signal.aborted) {
          setProfile(profileResponse);
          setProfileForm(profileResponse);
          setProfileStatus('success');
          setServices(servicesResponse);
          setStaff(staffResponse);
          setAvailability(availabilityResponse);
          setBillingStatus(billing);
          setStaffSelection(
            staffResponse[0]
              ? {
                  id: staffResponse[0].id,
                  role: staffResponse[0].role || staffResponse[0].title || '',
                  specialties: (staffResponse[0].specialties || []).join(', ')
                }
              : null
          );
        }
      })
      .catch((error) => {
        if (!abortController.signal.aborted) {
          setProfileStatus('error');
          setProfileMessage(error instanceof Error ? error.message : 'Unable to load practice data.');
        }
      });

    return () => abortController.abort();
  }, [api, practiceId]);

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!profileForm.name.trim() || !profileForm.address.trim() || !profileForm.city.trim()) {
      setProfileMessage('Name, address, and city are required.');
      return;
    }
    if (profileForm.email && !profileForm.email.includes('@')) {
      setProfileMessage('Enter a valid contact email.');
      return;
    }

    setProfileStatus('loading');
    setProfileMessage(null);
    const previousProfile = profile;
    setProfile(profileForm); // optimistic

    try {
      const updated = await api.updatePracticeProfile(practiceId, profileForm);
      setProfile(updated);
      setProfileForm(updated);
      setProfileStatus('success');
      setProfileMessage('Profile saved.');
    } catch (error) {
      if (previousProfile) setProfile(previousProfile);
      setProfileStatus('error');
      setProfileMessage(error instanceof Error ? error.message : 'Unable to update profile.');
    }
  };

  const handleServiceSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!serviceForm.name.trim()) {
      setServiceMessage('Service name is required.');
      return;
    }
    if (serviceForm.durationMinutes <= 0) {
      setServiceMessage('Duration must be greater than zero.');
      return;
    }
    if (serviceForm.price !== undefined && serviceForm.price < 0) {
      setServiceMessage('Price cannot be negative.');
      return;
    }

    setServiceMessage(null);
    const optimisticService: Service = {
      ...serviceForm,
      id: `temp-${Date.now()}`
    };
    setServices((prev) => [...prev, optimisticService]);

    try {
      const created = await api.createService(practiceId, serviceForm);
      setServices((prev) => prev.map((svc) => (svc.id === optimisticService.id ? created : svc)));
      setServiceMessage('Service added.');
      setServiceForm({ name: '', durationMinutes: 30, price: 0, description: '', active: true });
    } catch (error) {
      setServices((prev) => prev.filter((svc) => svc.id !== optimisticService.id));
      setServiceMessage(error instanceof Error ? error.message : 'Unable to add service.');
    }
  };

  const handleStaffSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!staffSelection?.id) {
      setStaffMessage('Select a staff member to update.');
      return;
    }
    if (!staffSelection.role.trim()) {
      setStaffMessage('Role or title is required.');
      return;
    }

    const specialties = staffSelection.specialties
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    setStaffMessage(null);
    const previousStaff = staff;
    setStaff((prev) =>
      prev.map((member) =>
        member.id === staffSelection.id
          ? { ...member, role: staffSelection.role, specialties }
          : member
      )
    );

    try {
      const updated = await api.updateStaffMember(practiceId, staffSelection.id, {
        role: staffSelection.role,
        specialties
      });
      setStaff((prev) => prev.map((member) => (member.id === updated.id ? updated : member)));
      setStaffMessage('Staff details updated.');
    } catch (error) {
      setStaff(previousStaff);
      setStaffMessage(error instanceof Error ? error.message : 'Unable to update staff member.');
    }
  };

  const handleAvailabilitySubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!availabilityForm.start) {
      setAvailabilityMessage('Choose a start time for availability.');
      return;
    }
    if (availabilityForm.durationMinutes <= 0) {
      setAvailabilityMessage('Duration must be positive.');
      return;
    }

    const startDate = new Date(availabilityForm.start);
    const endDate = new Date(startDate.getTime() + availabilityForm.durationMinutes * 60000);
    const newSlot: AvailabilitySlot = {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };

    setAvailabilityMessage(null);
    setAvailability((prev) => [newSlot, ...prev]);

    try {
      const created = await api.addAvailabilitySlot(practiceId, newSlot);
      setAvailability((prev) => prev.map((slot) => (slot === newSlot ? created : slot)));
      setAvailabilityMessage('Availability saved.');
      setAvailabilityForm({ start: '', durationMinutes: 30 });
    } catch (error) {
      setAvailability((prev) => prev.filter((slot) => slot !== newSlot));
      setAvailabilityMessage(error instanceof Error ? error.message : 'Unable to save availability.');
    }
  };

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '1rem' }}>
        <h1>Practice Administration</h1>
        <p>Environment: {env.environment}</p>
        <p>API URL: {env.apiUrl}</p>
      </header>

      <section aria-label="practice profile" style={{ marginBottom: '1.5rem' }}>
        <h2>Profile</h2>
        {profileStatus === 'loading' && <p>Loading profile…</p>}
        {profileMessage && <p role="alert">{profileMessage}</p>}
        <form onSubmit={handleProfileSubmit} style={{ display: 'grid', gap: '0.75rem', maxWidth: 540 }}>
          <label>
            Practice name
            <input
              value={profileForm.name}
              onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
              required
              aria-label="Practice name"
            />
          </label>
          <label>
            Address
            <input
              value={profileForm.address}
              onChange={(event) => setProfileForm({ ...profileForm, address: event.target.value })}
              required
              aria-label="Address"
            />
          </label>
          <label>
            City
            <input
              value={profileForm.city}
              onChange={(event) => setProfileForm({ ...profileForm, city: event.target.value })}
              required
              aria-label="City"
            />
          </label>
          <label>
            State
            <input
              value={profileForm.state || ''}
              onChange={(event) => setProfileForm({ ...profileForm, state: event.target.value })}
              aria-label="State"
            />
          </label>
          <label>
            Postal code
            <input
              value={profileForm.postalCode || ''}
              onChange={(event) => setProfileForm({ ...profileForm, postalCode: event.target.value })}
              aria-label="Postal code"
            />
          </label>
          <label>
            Phone
            <input
              value={profileForm.phone || ''}
              onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })}
              aria-label="Phone"
            />
          </label>
          <label>
            Contact email
            <input
              type="email"
              value={profileForm.email || ''}
              onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
              aria-label="Contact email"
            />
          </label>
          <button type="submit" disabled={profileStatus === 'loading'}>
            {profileStatus === 'loading' ? 'Saving…' : 'Save profile'}
          </button>
        </form>
        {profile && (
          <div style={{ marginTop: '1rem', border: '1px solid #ddd', padding: '0.75rem', borderRadius: 8 }}>
            <strong>{profile.name}</strong>
            <p style={{ margin: 0 }}>{profile.address}</p>
            <p style={{ margin: 0 }}>{[profile.city, profile.state, profile.postalCode].filter(Boolean).join(', ')}</p>
            {profile.phone && <p style={{ margin: 0 }}>Phone: {profile.phone}</p>}
            {profile.email && <p style={{ margin: 0 }}>Email: {profile.email}</p>}
          </div>
        )}
      </section>

      <section aria-label="services" style={{ marginBottom: '1.5rem' }}>
        <h2>Services</h2>
        {serviceMessage && <p role="alert">{serviceMessage}</p>}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <h3>Current services</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {services.map((service) => (
                <li
                  key={service.id}
                  style={{ border: '1px solid #eee', padding: '0.75rem', borderRadius: 8, marginBottom: '0.5rem' }}
                >
                  <strong>{service.name}</strong>
                  <div>Duration: {service.durationMinutes} min</div>
                  {service.price !== undefined && <div>Price: ${service.price.toFixed(2)}</div>}
                  {service.description && <div>{service.description}</div>}
                  <div>Status: {service.active === false ? 'Inactive' : 'Active'}</div>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ flex: 1, minWidth: 320 }}>
            <h3>Add service</h3>
            <form onSubmit={handleServiceSubmit} style={{ display: 'grid', gap: '0.5rem' }}>
              <label>
                Name
                <input
                  aria-label="Service name"
                  value={serviceForm.name}
                  onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })}
                  required
                />
              </label>
              <label>
                Duration (minutes)
                <input
                  type="number"
                  aria-label="Duration"
                  value={serviceForm.durationMinutes}
                  onChange={(event) =>
                    setServiceForm({ ...serviceForm, durationMinutes: Number(event.target.value) })
                  }
                  min={1}
                  required
                />
              </label>
              <label>
                Price
                <input
                  type="number"
                  step="0.01"
                  aria-label="Price"
                  value={serviceForm.price ?? 0}
                  onChange={(event) => setServiceForm({ ...serviceForm, price: Number(event.target.value) })}
                  min={0}
                />
              </label>
              <label>
                Description
                <textarea
                  aria-label="Description"
                  value={serviceForm.description || ''}
                  onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })}
                  rows={3}
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={serviceForm.active !== false}
                  aria-label="Active"
                  onChange={(event) => setServiceForm({ ...serviceForm, active: event.target.checked })}
                />{' '}
                Active
              </label>
              <button type="submit">Add service</button>
            </form>
          </div>
        </div>
      </section>

      <section aria-label="staff roster" style={{ marginBottom: '1.5rem' }}>
        <h2>Staff roster</h2>
        {staffMessage && <p role="alert">{staffMessage}</p>}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {staff.map((member) => (
                <li
                  key={member.id}
                  style={{ border: '1px solid #eee', padding: '0.75rem', borderRadius: 8, marginBottom: '0.5rem' }}
                >
                  <strong>{member.name}</strong> – {member.title}
                  <div>Role: {member.role || 'Not set'}</div>
                  {member.specialties && member.specialties.length > 0 && (
                    <div>Specialties: {member.specialties.join(', ')}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ flex: 1, minWidth: 320 }}>
            <h3>Edit staff role & specialties</h3>
            <form onSubmit={handleStaffSubmit} style={{ display: 'grid', gap: '0.5rem' }}>
              <label>
                Staff member
                <select
                  aria-label="Select staff"
                  value={staffSelection?.id || ''}
                  onChange={(event) => {
                    const member = staff.find((item) => item.id === event.target.value);
                    setStaffSelection(
                      member
                        ? {
                            id: member.id,
                            role: member.role || member.title || '',
                            specialties: (member.specialties || []).join(', ')
                          }
                        : null
                    );
                  }}
                  required
                >
                  <option value="" disabled>
                    Choose staff
                  </option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Role/title
                <input
                  aria-label="Role"
                  value={staffSelection?.role || ''}
                  onChange={(event) =>
                    setStaffSelection((prev) => (prev ? { ...prev, role: event.target.value } : prev))
                  }
                  required
                />
              </label>
              <label>
                Specialties (comma separated)
                <input
                  aria-label="Specialties"
                  value={staffSelection?.specialties || ''}
                  onChange={(event) =>
                    setStaffSelection((prev) =>
                      prev ? { ...prev, specialties: event.target.value } : prev
                    )
                  }
                />
              </label>
              <button type="submit">Update staff</button>
            </form>
          </div>
        </div>
      </section>

      <section aria-label="availability" style={{ marginBottom: '1.5rem' }}>
        <h2>Availability editor</h2>
        {availabilityMessage && <p role="alert">{availabilityMessage}</p>}
        <form onSubmit={handleAvailabilitySubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <label>
            Start time
            <input
              type="datetime-local"
              aria-label="Start time"
              value={availabilityForm.start}
              onChange={(event) => setAvailabilityForm({ ...availabilityForm, start: event.target.value })}
              required
            />
          </label>
          <label>
            Duration (minutes)
            <input
              type="number"
              aria-label="Availability duration"
              min={1}
              value={availabilityForm.durationMinutes}
              onChange={(event) =>
                setAvailabilityForm({ ...availabilityForm, durationMinutes: Number(event.target.value) })
              }
              required
            />
          </label>
          <button type="submit">Add slot</button>
        </form>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          {availability.map((slot, index) => (
            <span
              key={`${slot.start}-${index}`}
              style={{ border: '1px solid #eee', padding: '0.5rem', borderRadius: 6 }}
            >
              {formatSlot(slot)}
            </span>
          ))}
        </div>
      </section>

      <section aria-label="billing" style={{ marginBottom: '1.5rem' }}>
        <h2>Billing & subscription</h2>
        {billingMessage && <p role="alert">{billingMessage}</p>}
        {billingStatus ? (
          <div style={{ border: '1px solid #eee', padding: '0.75rem', borderRadius: 8 }}>
            <div>Plan: {billingStatus.plan}</div>
            <div>Status: {billingStatus.status}</div>
            {billingStatus.renewalDate && (
              <div>Renews on: {new Date(billingStatus.renewalDate).toLocaleDateString()}</div>
            )}
            {billingStatus.amountDueCents !== undefined && (
              <div>Amount due: {formatCents(billingStatus.amountDueCents)}</div>
            )}
            {billingStatus.paymentMethod && <div>Payment: {billingStatus.paymentMethod}</div>}
          </div>
        ) : (
          <p>Billing status not available.</p>
        )}
      </section>
    </main>
  );
};

export default App;
