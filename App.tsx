import React, { useState, useEffect } from 'react';
import InputForm from './components/InputForm';
import ReportView from './components/ReportView';
import TemplateManager from './components/TemplateManager';
import PatientHistory from './components/PatientHistory';
import PatientCRM from './components/PatientCRM';
import ScheduledSessions from './components/ScheduledSessions';
import Remarketing from './components/Remarketing';
import RichTextEditor from './components/RichTextEditor';
import Auth from './components/Auth';
import OnboardingProfession from './components/OnboardingProfession';
import { analyzeSessionNotes } from './services/geminiService';
import { notificationService } from './services/notificationService';
import { useData } from './contexts/DataContext';
import { AnalysisRequest, ReportTemplate, Patient, SessionRecord, TherapeuticApproach, UserProfile } from './types';
import { Plus, Users, History, Save, CalendarCheck, TrendingUp, BrainCircuit, Menu, X, FileText, LogOut, LayoutList } from 'lucide-react';
import { auth } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Default Templates
const DEFAULT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'default-1',
    name: 'Padrão (Evolução Clínica)',
    isDefault: true,
    structure: `# Evolução Clínica

## 1. Resumo da Sessão
Síntese dos temas abordados e acontecimentos principais.

## 2. Análise do Estado Emocional
Humor predominante, afeto e congruência.

## 3. Conteúdos Relevantes (Abordagem Específica)
Interpretação dos dados à luz da teoria selecionada.

## 4. Intervenções Realizadas
Técnicas aplicadas, manejo clínico e psicoeducação.

## 5. Planejamento Terapêutico
Encaminhamentos e foco para próximos atendimentos.`
  },
  {
    id: 'default-integrativo',
    name: 'Integrativo (Holístico)',
    isDefault: true,
    structure: `# Relatório Integrativo

## Dimensão Mental & Cognitiva
Padrões de pensamento, crenças e narrativa trazida.

## Dimensão Emocional
Sentimentos identificados, expressão e regulação emocional.

## Dimensão Somática & Energética
Queixas físicas, linguagem corporal, nível de energia/disposição.

## Contexto Sistêmico & Relacional
Dinâmicas familiares, sociais e ambientais impactando o quadro.

## Síntese Integrativa
Como as dimensões acima se conectam na queixa atual.

## Práticas e Recomendações
Sugestões terapêuticas, exercícios ou florais/recursos complementares (se aplicável à abordagem).`
  },
  {
    id: 'default-exame',
    name: 'Exame das Funções Mentais (MSE)',
    isDefault: true,
    structure: `# Súmula do Exame Psíquico

## Apresentação Geral
Aparência, higiene, postura e atitude frente ao examinador.

## Consciência e Atenção
Nível de vigilância, tenacidade e mobilidade da atenção.

## Orientação e Memória
Orientação alopsíquica/autopsíquica e memória (imediata/recente/remota).

## Sensopercepção e Pensamento
Curso, forma e conteúdo do pensamento; presença de alucinações/ilusões.

## Afetividade e Humor
Modulação afetiva e estado de humor basal.

## Juízo Crítico e Conduta
Insight sobre o adoecimento e controle de impulsos.`
  },
  {
    id: 'default-soap',
    name: 'SOAP (Hospitalar/Convênio)',
    isDefault: true,
    structure: `# Registro SOAP

## S - Subjetivo (Subjective)
Relato do paciente (ipsis litteris quando relevante). Queixa principal.

## O - Objetivo (Objective)
Observações clínicas do terapeuta. Exame do estado mental breve.

## A - Avaliação (Assessment)
Análise do progresso, hipóteses diagnósticas e mudanças sintomáticas.

## P - Plano (Plan)
Conduta, ajustes no tratamento, tarefas de casa e agendamento.`
  }
];

type Tab = 'new' | 'crm' | 'history' | 'schedule' | 'remarketing';

function App() {
  const { user, patients, loading, savePatient, saveSession } = useData();
  const [activeTab, setActiveTab] = useState<Tab>('new');
  const [report, setReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentNotes, setCurrentNotes] = useState<string>('');
  const [currentApproach, setCurrentApproach] = useState<string>('');
  const [isReportSaved, setIsReportSaved] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [onboardingNeeded, setOnboardingNeeded] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Patient State
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);

  // Template State
  const [templates, setTemplates] = useState<ReportTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_TEMPLATES[0].id);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);

  // Carrega perfil do usuário (Firestore com fallback para localStorage)
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setOnboardingNeeded(false);
      setProfileLoading(false);
      return;
    }
    const checkProfile = async () => {
      setProfileLoading(true);

      // 1. Verifica localStorage primeiro (funciona mesmo sem permissão no Firestore)
      const localProfileRaw = localStorage.getItem(`userProfile_${user.uid}`);
      if (localProfileRaw) {
        try {
          const localProfile = JSON.parse(localProfileRaw) as UserProfile;
          setUserProfile(localProfile);
          setOnboardingNeeded(false);
          setProfileLoading(false);
          // Tenta sincronizar com Firestore em segundo plano
          setDoc(doc(db, 'userProfiles', user.uid), localProfile).catch(() => {});
          return;
        } catch (_) {}
      }

      // 2. Tenta buscar no Firestore
      try {
        const profileRef = doc(db, 'userProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const profile = profileSnap.data() as UserProfile;
          setUserProfile(profile);
          localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(profile));
          setOnboardingNeeded(false);
        } else {
          setOnboardingNeeded(true);
        }
      } catch (e) {
        console.warn('Firestore indisponível, exibindo onboarding:', e);
        setOnboardingNeeded(true);
      } finally {
        setProfileLoading(false);
      }
    };
    checkProfile();
  }, [user]);


  useEffect(() => {
    // Check for reminders immediately on load
    notificationService.checkAndSendReminders();
    
    // Check every minute
    const interval = setInterval(() => {
        notificationService.checkAndSendReminders();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleAnalysis = async (notes: string, approach: string) => {
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || DEFAULT_TEMPLATES[0];

    setIsAnalyzing(true);
    setReport(null); 
    setCurrentNotes(notes);
    setCurrentApproach(approach);
    setIsReportSaved(false);
    
    // Construct a rich context string including demographics
    let fullContext = currentPatient?.context || "";
    if (currentPatient) {
        const demos = [];
        if (currentPatient.age) demos.push(`Idade: ${currentPatient.age} anos`);
        if (currentPatient.birthDate) demos.push(`Data de Nasc.: ${new Date(currentPatient.birthDate + 'T12:00:00').toLocaleDateString('pt-BR')}`);
        if (currentPatient.height) demos.push(`Altura: ${currentPatient.height}cm`);
        if (currentPatient.weight) demos.push(`Peso: ${currentPatient.weight}kg`);
        
        if (demos.length > 0) {
            fullContext = `DADOS DEMOGRÁFICOS:\n${demos.join(' | ')}\n\nCONTEXTO CLÍNICO:\n${fullContext}`;
        }
    }

    const request: AnalysisRequest = {
      notes,
      approach,
      patientContext: fullContext,
      templateStructure: selectedTemplate.structure
    };

    const result = await analyzeSessionNotes(request);
    setReport(result);
    setIsAnalyzing(false);

    // Auto-save session if patient is selected
    if (currentPatient && result) {
        const newSession: SessionRecord = {
            id: Date.now().toString(),
            patientId: currentPatient.id,
            date: new Date().toISOString(),
            rawNotes: notes,
            generatedReport: result,
            approach,
            templateName: selectedTemplate.name
        };
        saveSession(newSession).then(() => {
            setIsReportSaved(true);
        });
    }
  };

  const handleSaveReport = () => {
    if (!currentPatient || !report) return;
    
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || DEFAULT_TEMPLATES[0];
    const newSession: SessionRecord = {
        id: Date.now().toString(),
        patientId: currentPatient.id,
        date: new Date().toISOString(),
        rawNotes: currentNotes || "Relatório salvo manualmente.",
        generatedReport: report,
        approach: currentApproach || TherapeuticApproach.TCC,
        templateName: selectedTemplate.name
    };
    saveSession(newSession).then(() => {
        setIsReportSaved(true);
    });
  };

  const handleStartScheduledSession = (patientId: string) => {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
          setCurrentPatient(patient);
          if (report) {
              setIsReportSaved(false);
          }
          setActiveTab('new');
      }
  };

  const handleAddTemplate = (newTemplate: ReportTemplate) => {
    setTemplates([...templates, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
    setIsTemplateManagerOpen(false);
  };

  const handleDeleteTemplate = (id: string) => {
    const newTemplates = templates.filter(t => t.id !== id);
    setTemplates(newTemplates);
    if (selectedTemplateId === id) {
        setSelectedTemplateId(newTemplates[0].id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Aguarda verificação do perfil antes de renderizar
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // Novo usuário: mostrar onboarding de profissão
  if (onboardingNeeded) {
    return (
      <OnboardingProfession
        uid={user.uid}
        email={user.email}
        onComplete={(profile) => {
          setUserProfile(profile);
          setOnboardingNeeded(false);
        }}
      />
    );
  }


  const NavItem = ({ icon: Icon, label, tab, activeColor = 'text-teal-700 bg-teal-50' }: { icon: any, label: string, tab: Tab, activeColor?: string }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
        activeTab === tab 
          ? activeColor 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className={`h-5 w-5 ${activeTab === tab ? '' : 'text-slate-400'}`} />
      {label}
    </button>
  );

  return (
    <div className="flex h-[100dvh] bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="bg-teal-600 p-1.5 rounded-lg mr-3 shadow-sm">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">PsiAI</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Menu Principal</div>
          <NavItem icon={Plus} label="Nova Sessão" tab="new" />
          <NavItem icon={Users} label="CRM Pacientes" tab="crm" activeColor="text-blue-700 bg-blue-50" />
          <NavItem icon={CalendarCheck} label="Agenda" tab="schedule" />
          <NavItem icon={History} label="Consultar Histórico" tab="history" />
          
          <div className="mt-8 mb-3 px-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Marketing</div>
          </div>
          <NavItem icon={TrendingUp} label="Remarketing" tab="remarketing" activeColor="text-orange-700 bg-orange-50" />
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors mb-2">
            <div className="h-9 w-9 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-sm overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (user?.displayName || user?.email || 'DR').charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.displayName || 'Dr. Psicólogo'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'Plano Pro'}</p>
            </div>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* Mobile Header & Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="bg-teal-600 p-1.5 rounded-lg shadow-sm">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">PsiAI</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm pt-16">
          <div className="bg-white h-full w-64 shadow-xl flex flex-col animate-fadeIn">
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
              <NavItem icon={Plus} label="Nova Sessão" tab="new" />
              <NavItem icon={Users} label="CRM Pacientes" tab="crm" activeColor="text-blue-700 bg-blue-50" />
              <NavItem icon={CalendarCheck} label="Agenda" tab="schedule" />
              <NavItem icon={History} label="Histórico (Busca)" tab="history" />
              <div className="my-4 border-t border-slate-100"></div>
              <NavItem icon={TrendingUp} label="Remarketing" tab="remarketing" activeColor="text-orange-700 bg-orange-50" />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden pt-16 md:pt-0 relative bg-slate-50/50">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto flex flex-col min-h-full">
            
            {activeTab === 'new' && (
                <div className="flex flex-col flex-1 gap-6">
                    {/* Patient Selection Section - Simplified */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-shrink-0">
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                                    Paciente da Sessão
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={currentPatient?.id || ''}
                                        onChange={(e) => {
                                            const p = patients.find(pat => pat.id === e.target.value);
                                            setCurrentPatient(p || null);
                                            if (report) {
                                                setIsReportSaved(false);
                                            }
                                        }}
                                        className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-sm transition-shadow"
                                    >
                                        <option value="">Selecione um paciente (Opcional)...</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {currentPatient && (
                            <div className="px-5 py-4 border-t border-slate-100 bg-white">
                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                    {currentPatient.age && (
                                        <span className="text-slate-600"><strong className="text-slate-800 font-medium">Idade:</strong> {currentPatient.age} anos</span>
                                    )}
                                    {currentPatient.phoneNumber && (
                                        <span className="text-slate-600"><strong className="text-slate-800 font-medium">Tel:</strong> {currentPatient.phoneNumber}</span>
                                    )}
                                    {currentPatient.context && (
                                        <div className="w-full mt-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <strong className="text-slate-700 block mb-1">Contexto:</strong>
                                            <div dangerouslySetInnerHTML={{ __html: currentPatient.context }} className="line-clamp-2" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content Grid */}
                    <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-6">
                        {/* Left Column: Input */}
                        <div className="flex flex-col min-h-[500px] lg:min-h-[600px]">
                            <InputForm 
                                onSubmit={handleAnalysis} 
                                isAnalyzing={isAnalyzing} 
                                templates={templates}
                                selectedTemplateId={selectedTemplateId}
                                onSelectTemplate={setSelectedTemplateId}
                                onOpenTemplateManager={() => setIsTemplateManagerOpen(true)}
                            />
                        </div>

                        {/* Right Column: Output */}
                        <div className="flex flex-col min-h-[500px] lg:min-h-[600px] relative">
                            {report ? (
                                <>
                                    <ReportView report={report} doctorName={user?.displayName || 'Dr(a).'} />
                                    {isReportSaved && !isAnalyzing && (
                                        <div className="absolute top-4 right-4 bg-teal-100 text-teal-800 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse shadow-sm z-10 font-medium">
                                            <Save className="h-3.5 w-3.5" /> Salvo no Histórico
                                        </div>
                                    )}
                                    {!isReportSaved && !isAnalyzing && (
                                        <button 
                                            onClick={handleSaveReport}
                                            disabled={!currentPatient}
                                            className={`absolute top-4 right-4 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm z-10 font-medium transition-colors ${currentPatient ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
                                            title={!currentPatient ? "Selecione um paciente primeiro para salvar" : "Clique para salvar no histórico"}
                                        >
                                            <Save className="h-3.5 w-3.5" /> 
                                            {!currentPatient ? "⚠️ Não salvo (Sem Paciente)" : "Salvar Relatório"}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                                    <div className="bg-slate-50 p-4 rounded-full mb-4">
                                        <FileText className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <p className="font-medium text-slate-500 mb-1">Nenhum relatório gerado</p>
                                    <p className="text-sm">Preencha as notas da sessão e clique em gerar para ver o resultado aqui.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'crm' && (
                <PatientCRM />
            )}

            {activeTab === 'schedule' && (
                <ScheduledSessions onStartSession={handleStartScheduledSession} />
            )}

            {activeTab === 'history' && (
                <PatientHistory />
            )}

            {activeTab === 'remarketing' && (
                <Remarketing />
            )}
          </div>
        </div>
      </main>

      <TemplateManager 
        isOpen={isTemplateManagerOpen}
        onClose={() => setIsTemplateManagerOpen(false)}
        templates={templates}
        onAddTemplate={handleAddTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />
    </div>
  );
}

export default App;
