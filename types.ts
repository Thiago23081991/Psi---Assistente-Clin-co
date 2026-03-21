export type ProfessionType = 'psicologo' | 'terapeuta';

export interface UserProfile {
  uid: string;
  email?: string;
  name?: string;
  profession: ProfessionType;
  crp?: string;
  createdAt: string;
}

export interface SessionData {
  id: string;
  patientName: string;
  date: string;
  notes: string;
  approach: string;
  report?: string;
  isLoading?: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  structure: string;
  isDefault?: boolean;
}

export interface AnalysisRequest {
  notes: string;
  approach: string;
  patientContext?: string;
  templateStructure: string;
}

export interface Patient {
  id: string;
  name: string;
  phoneNumber?: string;
  emergencyContact?: string;
  age?: string;
  birthDate?: string;
  height?: string;
  weight?: string;
  diagnosticHypothesis?: string;
  context: string;
  createdAt: string;
  status?: 'active' | 'inactive';
}

export interface SessionRecord {
  id: string;
  patientId: string;
  date: string;
  rawNotes: string;
  generatedReport: string;
  approach: string;
  templateName: string;
}

export interface ScheduledSession {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // minutes
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  isOnline?: boolean;
  meetLink?: string;
  reminderSent?: boolean;
  reminderSentAt?: string; // ISO Date String
}

export enum TherapeuticApproach {
  TCC = 'Terapia Cognitivo-Comportamental (TCC)',
  Psicanalise = 'Psicanálise (Freudiana/Lacaniana)',
  Analitica = 'Psicologia Analítica (Junguiana)',
  Humanista = 'Humanista / Centrada na Pessoa',
  Gestalt = 'Gestalt-Terapia',
  Sistemica = 'Sistêmica / Familiar',
  Integrativa = 'Terapia Integrativa',
  Transpessoal = 'Psicologia Transpessoal',
  Fenomenologica = 'Fenomenológica-Existencial',
  Comportamental = 'Análise do Comportamento (ABA/Behaviorismo)'
}

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  patientId?: string; // Optional, for tying income to a patient
  status: 'paid' | 'pending';
  category?: string;
}