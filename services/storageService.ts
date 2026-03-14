import { Patient, SessionRecord, ScheduledSession } from '../types';

const PATIENTS_KEY = 'psiai_patients';
const SESSIONS_KEY = 'psiai_sessions';
const SCHEDULE_KEY = 'psiai_schedule';

export const storageService = {
  // Patient Methods
  getPatients: (): Patient[] => {
    const data = localStorage.getItem(PATIENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  savePatient: (patient: Patient): void => {
    const patients = storageService.getPatients();
    const existingIndex = patients.findIndex(p => p.id === patient.id);
    
    if (existingIndex >= 0) {
      patients[existingIndex] = patient;
    } else {
      patients.push(patient);
    }
    
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
  },

  deletePatient: (id: string): void => {
    const patients = storageService.getPatients().filter(p => p.id !== id);
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
    
    // Cleanup sessions for this patient
    const sessions = storageService.getAllSessions().filter(s => s.patientId !== id);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

    // Cleanup schedule for this patient
    const schedule = storageService.getScheduledSessions().filter(s => s.patientId !== id);
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
  },

  // Session Methods
  getAllSessions: (): SessionRecord[] => {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getSessionsByPatient: (patientId: string): SessionRecord[] => {
    const sessions = storageService.getAllSessions();
    return sessions.filter(s => s.patientId === patientId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  saveSession: (session: SessionRecord): void => {
    const sessions = storageService.getAllSessions();
    sessions.push(session);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  },

  deleteSession: (id: string): void => {
    const sessions = storageService.getAllSessions().filter(s => s.id !== id);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  },

  // Schedule Methods
  getScheduledSessions: (): ScheduledSession[] => {
    const data = localStorage.getItem(SCHEDULE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveScheduledSession: (session: ScheduledSession): void => {
    const schedule = storageService.getScheduledSessions();
    const existingIndex = schedule.findIndex(s => s.id === session.id);

    if (existingIndex >= 0) {
      schedule[existingIndex] = session;
    } else {
      schedule.push(session);
    }

    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
  },

  updateScheduledSessionStatus: (id: string, status: ScheduledSession['status']): void => {
    const schedule = storageService.getScheduledSessions();
    const session = schedule.find(s => s.id === id);
    if (session) {
      session.status = status;
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
    }
  },

  updateScheduledSessionReminder: (id: string, sent: boolean, sentAt?: string): void => {
    const schedule = storageService.getScheduledSessions();
    const session = schedule.find(s => s.id === id);
    if (session) {
      session.reminderSent = sent;
      if (sentAt) {
        session.reminderSentAt = sentAt;
      }
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
    }
  },

  deleteScheduledSession: (id: string): void => {
    const schedule = storageService.getScheduledSessions().filter(s => s.id !== id);
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
  }
};