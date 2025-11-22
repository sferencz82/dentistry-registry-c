import { loadSharedEnv } from './env';

export type Practitioner = {
  id: string;
  firstName: string;
  lastName: string;
  specialties: string[];
};

export type AppointmentSlot = {
  id: string;
  practitionerId: string;
  start: string;
  end: string;
};

export const sharedEnvironment = loadSharedEnv();
