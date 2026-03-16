import React, { useState, useEffect } from 'react';
import { Patient, SessionRecord } from '../types';
import { useData } from '../contexts/DataContext';
import { User, Calendar, ChevronDown, Trash2, Search, ArrowLeft, FileText } from 'lucide-react';
import ReportView from './ReportView';

const PatientHistory: React.FC = () => {
  const { patients, sessions, deletePatient, deleteSession } = useData();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientSessions, setPatientSessions] = useState<SessionRecord[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedPatientId) {
      const filteredSessions = sessions.filter(s => s.patientId === selectedPatientId);
      setPatientSessions(filteredSessions);
      // If the currently selected session was deleted, clear it
      if (selectedSession && !filteredSessions.find(s => s.id === selectedSession.id)) {
        setSelectedSession(null);
      }
    } else {
      setPatientSessions([]);
      setSelectedSession(null);
    }
  }, [selectedPatientId, sessions]);

  const handleDeletePatient = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza? Isso apagará todo o histórico e relatórios deste paciente.')) {
      await deletePatient(id);
      if (selectedPatientId === id) setSelectedPatientId(null);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Excluir este relatório permanentemente?')) {
      await deleteSession(id);
      if (selectedSession?.id === id) setSelectedSession(null);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Helper to strip HTML for list preview
  const stripHtml = (html: string) => {
      return html.replace(/<[^>]*>?/gm, '');
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-[600px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      
      {/* Sidebar - Patient List */}
      {/* Mobile: Hidden if patient selected. Desktop: Always visible (1/3 width) */}
      <div className={`
        flex-col bg-slate-50 border-r border-slate-200
        ${selectedPatientId ? 'hidden md:flex' : 'flex w-full'}
        md:w-1/3 md:min-w-[250px]
      `}>
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-teal-600" />
            Pacientes ({patients.length})
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar paciente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredPatients.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Nenhum paciente encontrado.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPatients.map(patient => (
                <div 
                  key={patient.id}
                  onClick={() => setSelectedPatientId(patient.id)}
                  className={`p-4 cursor-pointer hover:bg-white transition-colors group ${selectedPatientId === patient.id ? 'bg-white border-l-4 border-teal-500 shadow-sm' : 'border-l-4 border-transparent'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-medium flex items-center gap-2 ${selectedPatientId === patient.id ? 'text-teal-800' : 'text-slate-700'}`}>
                        {patient.name}
                        {patient.age && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-normal">{patient.age} anos</span>}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{stripHtml(patient.context)}</p>
                    </div>
                    <button 
                      onClick={(e) => handleDeletePatient(e, patient.id)}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-300 hover:text-red-500 p-2"
                      title="Excluir Paciente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {/* Mobile: Visible only if patient selected. Desktop: Always visible (2/3 width) */}
      <div className={`
        flex-1 flex-col bg-slate-50/50
        ${selectedPatientId ? 'flex' : 'hidden md:flex'}
      `}>
        {!selectedPatientId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <User className="h-12 w-12 mb-3 opacity-20" />
            <p>Selecione um paciente para ver o histórico</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row h-full">
            
            {/* Session List Column */}
            {/* Mobile: Hidden if session selected (viewing report). Desktop: Always visible (1/3 of content) */}
            <div className={`
               flex-col border-r border-slate-200 overflow-y-auto bg-white
               ${selectedSession ? 'hidden lg:flex' : 'flex w-full'}
               lg:w-1/3 lg:min-w-[280px]
            `}>
              <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                {/* Mobile Back Button */}
                <button 
                    onClick={() => setSelectedPatientId(null)}
                    className="md:hidden flex items-center text-slate-500 hover:text-teal-600 mb-3 text-sm font-medium transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para Pacientes
                </button>

                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-slate-800">{selectedPatient?.name}</h4>
                        <p className="text-xs text-slate-500">Histórico de Sessões</p>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">{patientSessions.length}</span>
                </div>
              </div>
              
              {patientSessions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Nenhuma sessão registrada.
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {patientSessions.map(session => (
                    <div 
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedSession?.id === session.id ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : 'border-slate-200 bg-white'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                          <Calendar className="h-3.5 w-3.5 text-teal-600" />
                          {new Date(session.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </div>
                        <button 
                           onClick={(e) => handleDeleteSession(e, session.id)}
                           className="text-slate-300 hover:text-red-500 p-1"
                        >
                           <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                         <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                           {session.approach.split(' ')[0]}
                         </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 italic">
                        "{stripHtml(session.rawNotes).substring(0, 100)}..."
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Report Detail View */}
            {/* Mobile: Visible only if session selected. Desktop: Visible as details pane */}
            <div className={`
                flex-1 flex-col overflow-y-auto bg-slate-50
                ${selectedSession ? 'flex fixed inset-0 z-50 bg-white lg:static lg:bg-slate-50' : 'hidden lg:flex'}
            `}>
                {selectedSession ? (
                    <div className="flex flex-col h-full">
                        {/* Mobile Header for Report View */}
                        <div className="lg:hidden p-4 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10">
                            <button 
                                onClick={() => setSelectedSession(null)}
                                className="text-slate-600 hover:text-teal-600 font-medium flex items-center text-sm"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                            </button>
                            <span className="text-sm font-semibold text-slate-800">
                                {new Date(selectedSession.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </span>
                            <div className="w-8"></div> {/* Spacer for centering */}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                            <ReportView report={selectedSession.generatedReport} />
                        </div>
                    </div>
                ) : (
                    <div className="hidden lg:flex flex-col items-center justify-center h-full text-slate-400 p-8">
                        <FileText className="h-12 w-12 mb-3 opacity-20" />
                        <p>Selecione uma sessão para visualizar o relatório</p>
                    </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientHistory;