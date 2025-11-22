import { create } from 'zustand';

export type AppUser = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type Appointment = {
  id: string;
  dentist: string;
  time: string;
  status: 'scheduled' | 'completed' | 'canceled';
};

export type ChatMessage = {
  id: string;
  text: string;
  sender: 'patient' | 'staff';
  timestamp: string;
};

export type AppState = {
  user?: AppUser;
  appointments: Appointment[];
  messages: ChatMessage[];
  setUser: (user: AppUser) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  addMessage: (message: ChatMessage) => void;
};

export const useAppStore = create<AppState>((set) => ({
  user: undefined,
  appointments: [
    {
      id: 'apt-1',
      dentist: 'Dr. Rivera',
      time: '2024-07-01T13:00:00Z',
      status: 'scheduled'
    }
  ],
  messages: [
    {
      id: 'msg-1',
      sender: 'staff',
      text: 'Welcome to Stitch Dentistry! How can we help today?',
      timestamp: new Date().toISOString()
    }
  ],
  setUser: (user) => set({ user }),
  addAppointment: (appointment) =>
    set((state) => ({ appointments: [...state.appointments, appointment] })),
  updateAppointmentStatus: (id, status) =>
    set((state) => ({
      appointments: state.appointments.map((appointment) =>
        appointment.id === id ? { ...appointment, status } : appointment
      )
    })),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] }))
}));
