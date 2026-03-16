import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Patient, SessionRecord, ScheduledSession } from '../types';
import { cryptoService } from '../services/cryptoService';

interface DataContextType {
  user: User | null;
  patients: Patient[];
  sessions: SessionRecord[];
  scheduledSessions: ScheduledSession[];
  loading: boolean;
  savePatient: (patient: Patient) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  saveSession: (session: SessionRecord) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  saveScheduledSession: (session: ScheduledSession) => Promise<void>;
  deleteScheduledSession: (id: string) => Promise<void>;
  updateScheduledSessionStatus: (id: string, status: ScheduledSession['status']) => Promise<void>;
  updateScheduledSessionReminder: (id: string, sent: boolean, sentAt?: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setPatients([]);
        setSessions([]);
        setScheduledSessions([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const patientsRef = collection(db, `users/${user.uid}/patients`);
    const sessionsRef = collection(db, `users/${user.uid}/sessions`);
    const scheduledRef = collection(db, `users/${user.uid}/scheduled_sessions`);

    const unsubPatients = onSnapshot(patientsRef, async (snapshot) => {
      const data = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const p = docSnap.data() as Patient;
          return {
              ...p,
              // Decrypt sensitive fields
              name: await cryptoService.decrypt(p.name, user.uid),
              phoneNumber: p.phoneNumber ? await cryptoService.decrypt(p.phoneNumber, user.uid) : p.phoneNumber,
              emergencyContact: p.emergencyContact ? await cryptoService.decrypt(p.emergencyContact, user.uid) : p.emergencyContact,
              diagnosticHypothesis: p.diagnosticHypothesis ? await cryptoService.decrypt(p.diagnosticHypothesis, user.uid) : p.diagnosticHypothesis,
              context: await cryptoService.decrypt(p.context, user.uid),
          };
      }));
      setPatients(data);
    });

    const unsubSessions = onSnapshot(sessionsRef, async (snapshot) => {
      const data = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const s = docSnap.data() as SessionRecord;
          return {
              ...s,
              // Decrypt clinical notes
              rawNotes: await cryptoService.decrypt(s.rawNotes, user.uid),
              generatedReport: await cryptoService.decrypt(s.generatedReport, user.uid),
          };
      }));
      setSessions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    const unsubScheduled = onSnapshot(scheduledRef, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as ScheduledSession);
      setScheduledSessions(data);
      setLoading(false);
    });

    return () => {
      unsubPatients();
      unsubSessions();
      unsubScheduled();
    };
  }, [user]);

  const savePatient = async (patient: Patient) => {
    if (!user) return;
    
    // Encrypt sensitive fields before saving
    const securePatient: Patient = {
        ...patient,
        name: await cryptoService.encrypt(patient.name, user.uid),
        phoneNumber: patient.phoneNumber ? await cryptoService.encrypt(patient.phoneNumber, user.uid) : patient.phoneNumber,
        emergencyContact: patient.emergencyContact ? await cryptoService.encrypt(patient.emergencyContact, user.uid) : patient.emergencyContact,
        diagnosticHypothesis: patient.diagnosticHypothesis ? await cryptoService.encrypt(patient.diagnosticHypothesis, user.uid) : patient.diagnosticHypothesis,
        context: await cryptoService.encrypt(patient.context, user.uid),
    };
    
    await setDoc(doc(db, `users/${user.uid}/patients/${securePatient.id}`), securePatient);
  };

  const deletePatient = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/patients/${id}`));
    // Also delete associated sessions and scheduled sessions
    const patientSessions = sessions.filter(s => s.patientId === id);
    for (const s of patientSessions) {
      await deleteDoc(doc(db, `users/${user.uid}/sessions/${s.id}`));
    }
    const patientScheduled = scheduledSessions.filter(s => s.patientId === id);
    for (const s of patientScheduled) {
      await deleteDoc(doc(db, `users/${user.uid}/scheduled_sessions/${s.id}`));
    }
  };

  const saveSession = async (session: SessionRecord) => {
    if (!user) return;
    
    // Encrypt clinical notes before saving
    const secureSession: SessionRecord = {
        ...session,
        rawNotes: await cryptoService.encrypt(session.rawNotes, user.uid),
        generatedReport: await cryptoService.encrypt(session.generatedReport, user.uid),
    };
    
    await setDoc(doc(db, `users/${user.uid}/sessions/${secureSession.id}`), secureSession);
  };

  const deleteSession = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/sessions/${id}`));
  };

  const saveScheduledSession = async (session: ScheduledSession) => {
    if (!user) return;
    await setDoc(doc(db, `users/${user.uid}/scheduled_sessions/${session.id}`), session);
  };

  const deleteScheduledSession = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/scheduled_sessions/${id}`));
  };

  const updateScheduledSessionStatus = async (id: string, status: ScheduledSession['status']) => {
    if (!user) return;
    const session = scheduledSessions.find(s => s.id === id);
    if (session) {
      await setDoc(doc(db, `users/${user.uid}/scheduled_sessions/${id}`), { ...session, status });
    }
  };

  const updateScheduledSessionReminder = async (id: string, sent: boolean, sentAt?: string) => {
    if (!user) return;
    const session = scheduledSessions.find(s => s.id === id);
    if (session) {
      const updated = { ...session, reminderSent: sent };
      if (sentAt) updated.reminderSentAt = sentAt;
      await setDoc(doc(db, `users/${user.uid}/scheduled_sessions/${id}`), updated);
    }
  };

  return (
    <DataContext.Provider value={{
      user, patients, sessions, scheduledSessions, loading,
      savePatient, deletePatient, saveSession, deleteSession,
      saveScheduledSession, deleteScheduledSession,
      updateScheduledSessionStatus, updateScheduledSessionReminder
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
