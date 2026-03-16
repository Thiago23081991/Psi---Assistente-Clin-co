import React, { useState } from 'react';
import { Patient, SessionRecord } from '../types';
import { useData } from '../contexts/DataContext';
import { User, Calendar, Trash2, Search, ArrowLeft, Clock, Activity, FileText, Phone, Mail, Edit3, Save, Plus } from 'lucide-react';
import ReportView from './ReportView';

const PatientCRM: React.FC = () => {
  const { patients, sessions, savePatient, deletePatient, deleteSession } = useData();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit mode functionality for the Patient Profile
  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Patient | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New Patient Form State
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientBirthDate, setNewPatientBirthDate] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [newPatientHeight, setNewPatientHeight] = useState('');
  const [newPatientWeight, setNewPatientWeight] = useState('');
  const [newPatientContext, setNewPatientContext] = useState('');


  // Filter sessions for the selected patient
  const patientSessions = selectedPatientId 
      ? sessions.filter(s => s.patientId === selectedPatientId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : [];

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setIsCreatingNew(false);
    setIsEditing(false);
    setEditedPatient({ ...patient });
  };

  const handleStartCreate = () => {
    setSelectedPatientId(null);
    setIsCreatingNew(true);
    setNewPatientName('');
    setNewPatientPhone('');
    setNewPatientBirthDate('');
    setNewPatientAge('');
    setNewPatientHeight('');
    setNewPatientWeight('');
    setNewPatientContext('');
  };

  const calculateAge = (dob: string) => {
    if (!dob) return;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    setNewPatientAge(age.toString());
  };

  const handleCreatePatient = async () => {
    if (!newPatientName.trim()) return;
    
    const newPatient: Patient = {
        id: Date.now().toString(),
        name: newPatientName,
        phoneNumber: newPatientPhone,
        birthDate: newPatientBirthDate,
        age: newPatientAge,
        height: newPatientHeight,
        weight: newPatientWeight,
        context: newPatientContext,
        createdAt: new Date().toISOString(),
        status: 'active'
    };
    
    try {
        await savePatient(newPatient);
        
        setIsCreatingNew(false);
        setSelectedPatientId(newPatient.id);
        
        // Reset form
        setNewPatientName('');
        setNewPatientPhone('');
        setNewPatientBirthDate('');
        setNewPatientAge('');
        setNewPatientHeight('');
        setNewPatientWeight('');
        setNewPatientContext('');
        
    } catch (e: any) {
        console.error("Erro ao criar paciente:", e);
        alert("Erro ao criar paciente: " + (e.message || "Desconhecido. Verifique o console."));
    }
  };

  const handleSaveProfile = async () => {
      if (editedPatient) {
          try {
              // Atualiza o banco de dados
              await savePatient(editedPatient);
              setIsEditing(false);
              // Atualiza a seleção local imediatamente para evitar "piscar" ou não atualizar
              setSelectedPatientId(editedPatient.id);
          } catch (error: any) {
              console.error("Erro detalhado ao salvar paciente:", error);
              alert("Erro ao salvar: " + (error.message || "Verifique o console para mais detalhes."));
          }
      }
  };

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
    }
  };

  const stripHtml = (html: string) => {
      return html.replace(/<[^>]*>?/gm, '');
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      
      {/* Sidebar - Patient List */}
      <div className={`
        flex-col bg-slate-50 border-r border-slate-200 h-full
        ${selectedPatientId ? 'hidden md:flex' : 'flex w-full'}
        md:w-80 md:min-w-[320px] lg:w-96 lg:min-w-[384px]
      `}>
        <div className="p-5 border-b border-slate-200 bg-white">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-teal-600" />
                CRM <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-1">{patients.length}</span>
            </div>
            <button 
                onClick={handleStartCreate}
                className="bg-teal-600 text-white p-1.5 rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                title="Cadastrar Novo Paciente"
            >
                <Plus className="h-4 w-4" />
            </button>
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar paciente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors"
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
                  onClick={() => handleSelectPatient(patient)}
                  className={`p-4 cursor-pointer transition-all hover:bg-slate-100 group ${selectedPatientId === patient.id ? 'bg-teal-50 border-l-4 border-teal-500' : 'bg-transparent border-l-4 border-transparent'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-semibold text-base ${selectedPatientId === patient.id ? 'text-teal-900' : 'text-slate-700'}`}>
                        {patient.name}
                      </h4>
                      <div className="flex gap-2 mt-1.5 items-center text-xs text-slate-500">
                          {patient.status === 'inactive' ? (
                              <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded uppercase text-[10px] font-bold tracking-wider">Inativo</span>
                          ) : (
                              <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase text-[10px] font-bold tracking-wider">Ativo</span>
                          )}
                          {patient.age && <span>{patient.age} anos</span>}
                          {patient.phoneNumber && <span>• {patient.phoneNumber.split(' ')[0]}</span>}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleDeletePatient(e, patient.id)}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-300 hover:text-red-500 p-2 transition-opacity"
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

      {/* Main Content Area - Patient Profile & Timeline */}
      <div className={`
        flex-1 flex-col bg-slate-50/50 h-full overflow-y-auto
        ${(selectedPatientId || isCreatingNew) ? 'flex' : 'hidden md:flex'}
      `}>
        {(!selectedPatientId && !isCreatingNew) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4 border border-slate-100">
                <User className="h-16 w-16 opacity-30 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-slate-600 mb-2">Prontuário Eletrônico</h3>
            <p className="max-w-md">Selecione um paciente na lista lateral para acessar o perfil, ou cadastre um novo paciente usando o botão de "+".</p>
          </div>
        ) : isCreatingNew ? (
          <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
               {/* Mobile Back Button */}
              <button 
                  onClick={() => setIsCreatingNew(false)}
                  className="md:hidden flex items-center text-slate-500 hover:text-teal-600 mb-4 text-sm font-medium transition-colors"
              >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </button>

              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <User className="h-6 w-6 text-teal-600" />
                  Cadastrar Novo Paciente
              </h2>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome Completo *</label>
                            <input 
                                type="text"
                                value={newPatientName}
                                onChange={(e) => setNewPatientName(e.target.value)}
                                className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 focus:bg-white transition-all shadow-sm"
                                placeholder="Ex: João da Silva"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">WhatsApp / Telefone</label>
                            <input 
                                type="text"
                                value={newPatientPhone}
                                onChange={(e) => setNewPatientPhone(e.target.value)}
                                className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 focus:bg-white transition-all shadow-sm"
                                placeholder="Ex: 11 99999-9999"
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nascimento</label>
                            <input 
                                type="date"
                                value={newPatientBirthDate}
                                onChange={(e) => {
                                    setNewPatientBirthDate(e.target.value);
                                    calculateAge(e.target.value);
                                }}
                                className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 focus:bg-white transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Idade</label>
                            <input 
                                type="number"
                                value={newPatientAge}
                                onChange={(e) => setNewPatientAge(e.target.value)}
                                className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 focus:bg-white transition-all shadow-sm"
                                placeholder="Ex: 35"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Altura (cm)</label>
                            <input 
                                type="number"
                                value={newPatientHeight}
                                onChange={(e) => setNewPatientHeight(e.target.value)}
                                className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 focus:bg-white transition-all shadow-sm"
                                placeholder="Ex: 175"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Peso (kg)</label>
                            <input 
                                type="number"
                                value={newPatientWeight}
                                onChange={(e) => setNewPatientWeight(e.target.value)}
                                className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 focus:bg-white transition-all shadow-sm"
                                placeholder="Ex: 70"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Contexto Anamnese / HD</label>
                        <textarea 
                            value={newPatientContext}
                            onChange={(e) => setNewPatientContext(e.target.value)}
                            className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 focus:bg-white transition-all shadow-sm resize-y"
                            placeholder="Histórico familiar, diagnósticos prévios, medicações..."
                            rows={5}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button 
                            onClick={() => setIsCreatingNew(false)}
                            className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleCreatePatient}
                            disabled={!newPatientName.trim()}
                            className="px-6 py-2.5 text-sm font-medium bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" /> Salvar Paciente
                        </button>
                    </div>
              </div>
          </div>
        ) : selectedPatient ? (
          <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
            {/* Mobile Back Button */}
            <button 
                onClick={() => setSelectedPatientId(null)}
                className="md:hidden flex items-center text-slate-500 hover:text-teal-600 mb-4 text-sm font-medium transition-colors"
            >
                <ArrowLeft className="h-4 w-4 mr-1" /> Lista de Pacientes
            </button>

            {/* PATIENT PROFILE CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                <div className="bg-teal-600 h-24 sm:h-32 w-full relative">
                    {/* Decorative background */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                </div>
                
                <div className="px-6 sm:px-8 pb-6 relative">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-12 sm:-mt-16 mb-4">
                        <div className="h-24 w-24 sm:h-32 sm:w-32 bg-white rounded-full p-1.5 shadow-md border-2 border-slate-100 z-10">
                            <div className="h-full w-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-3xl font-bold">
                                {selectedPatient.name.charAt(0)}
                            </div>
                        </div>
                        
                        <div className="mt-4 sm:mt-0 flex gap-2 w-full sm:w-auto z-10">
                            {!isEditing ? (
                                <button onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                                    <Edit3 className="h-4 w-4" /> Editar Perfil
                                </button>
                            ) : (
                                <button onClick={handleSaveProfile} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
                                    <Save className="h-4 w-4" /> Salvar
                                </button>
                            )}
                        </div>
                    </div>

                    {!isEditing ? (
                        <>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-slate-800">{selectedPatient.name}</h2>
                                <p className="text-slate-500 text-sm flex flex-wrap gap-4 mt-2">
                                    {selectedPatient.phoneNumber && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {selectedPatient.phoneNumber}</span>}
                                    {selectedPatient.age && <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {selectedPatient.age} anos</span>}
                                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Desde {new Date(selectedPatient.createdAt).toLocaleDateString('pt-BR')}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-teal-500" /> Dados Clínicos</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex flex-col"><span className="text-slate-500">Hipótese Diagnóstica / Foco:</span> <span className="font-medium text-slate-800">{selectedPatient.diagnosticHypothesis || 'Não especificado'}</span></div>
                                        <div className="flex flex-col"><span className="text-slate-500">Contexto / Anamnese:</span> <div className="font-medium text-slate-800" dangerouslySetInnerHTML={{ __html: selectedPatient.context || 'Não registrado' }}></div></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2"><User className="h-4 w-4 text-orange-500" /> Pessoal</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex flex-col"><span className="text-slate-500">Contato de Emergência:</span> <span className="font-medium text-slate-800">{selectedPatient.emergencyContact || 'Não especificado'}</span></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col"><span className="text-slate-500">Altura:</span> <span className="font-medium text-slate-800">{selectedPatient.height ? `${selectedPatient.height} cm` : '--'}</span></div>
                                            <div className="flex flex-col"><span className="text-slate-500">Peso:</span> <span className="font-medium text-slate-800">{selectedPatient.weight ? `${selectedPatient.weight} kg` : '--'}</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-teal-50/30 p-5 rounded-xl border border-teal-100 mb-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Nome Completo</label>
                                <input type="text" value={editedPatient?.name || ''} onChange={e => setEditedPatient(prev => prev ? {...prev, name: e.target.value} : null)} className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-teal-500 focus:border-teal-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Telefone</label>
                                <input type="text" value={editedPatient?.phoneNumber || ''} onChange={e => setEditedPatient(prev => prev ? {...prev, phoneNumber: e.target.value} : null)} className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-teal-500 focus:border-teal-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Contato de Emergência</label>
                                <input type="text" value={editedPatient?.emergencyContact || ''} onChange={e => setEditedPatient(prev => prev ? {...prev, emergencyContact: e.target.value} : null)} className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-teal-500 focus:border-teal-500 outline-none" placeholder="Nome e Telefone" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Hipótese Diagnóstica / Foco Clínico</label>
                                <input type="text" value={editedPatient?.diagnosticHypothesis || ''} onChange={e => setEditedPatient(prev => prev ? {...prev, diagnosticHypothesis: e.target.value} : null)} className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-teal-500 focus:border-teal-500 outline-none" placeholder="Ex: TAG, TDAH, Transtorno Misto..." />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Status do Paciente</label>
                                <select value={editedPatient?.status || 'active'} onChange={e => setEditedPatient(prev => prev ? {...prev, status: e.target.value as 'active'|'inactive'} : null)} className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-teal-500 focus:border-teal-500 outline-none">
                                    <option value="active">Ativo (Em acompanhamento)</option>
                                    <option value="inactive">Inativo (Alta / Interrompeu)</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* TIMELINE OF SESSIONS */}
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-teal-600" />
                Linha do Tempo
            </h3>

            {patientSessions.length === 0 ? (
                <div className="bg-white rounded-xl p-8 border border-slate-200 text-center shadow-sm">
                    <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Nenhum prontuário registrado.</p>
                    <p className="text-slate-400 text-sm mt-1">Gere relatórios na aba "Nova Sessão" selecionando este paciente.</p>
                </div>
            ) : (
                <div className="relative border-l-2 border-slate-200 ml-4 pb-12 space-y-8">
                    {patientSessions.map(session => (
                        <div key={session.id} className="relative pl-6 sm:pl-8">
                            {/* Timeline dot */}
                            <div className="absolute left-[-9px] top-1.5 h-4 w-4 rounded-full bg-white border-4 border-teal-500 shadow-sm" />
                            
                            <div className="bg-white border md:border-2 border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 pb-4 border-b border-slate-100 gap-2">
                                    <div>
                                        <div className="flex text-lg font-bold text-slate-800 items-center gap-2">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            Sessão de {new Date(session.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                        <div className="text-sm font-medium text-teal-600 mt-1 uppercase tracking-wider">{session.approach}</div>
                                    </div>
                                    <button onClick={(e) => handleDeleteSession(e, session.id)} className="text-sm text-slate-400 hover:text-red-600 self-start sm:self-center p-2 sm:p-0 transition-colors">
                                        Excluir
                                    </button>
                                </div>
                                
                                <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    <ReportView report={session.generatedReport} doctorName=" " />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PatientCRM;
