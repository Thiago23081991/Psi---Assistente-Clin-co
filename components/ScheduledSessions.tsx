import React, { useState, useEffect, useRef } from 'react';
import { Patient, ScheduledSession } from '../types';
import { useData } from '../contexts/DataContext';
import { whatsappService } from '../services/whatsappService';
import { Calendar, Clock, Plus, CheckCircle, XCircle, Trash2, User, Play, X, MessageCircle, Loader2, Check, Info, Edit2, FileText, Smartphone, Send, Zap, CalendarPlus, Video, Link as LinkIcon } from 'lucide-react';

interface ScheduledSessionsProps {
  onStartSession: (patientId: string) => void;
}

const ScheduledSessions: React.FC<ScheduledSessionsProps> = ({ onStartSession }) => {
  const { 
    patients, 
    scheduledSessions, 
    saveScheduledSession, 
    deleteScheduledSession, 
    updateScheduledSessionStatus, 
    updateScheduledSessionReminder 
  } = useData();
  
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado para controlar qual menu de mensagem está aberto
  const [activeMenuSessionId, setActiveMenuSessionId] = useState<string | null>(null);

  // Estado para controlar qual sessão está enviando mensagem via API no momento
  const [sendingSessionId, setSendingSessionId] = useState<string | null>(null);
  
  // Estado para edição
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  
  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(50);
  const [notes, setNotes] = useState('');
  const [isOnline, setIsOnline] = useState(false);

  // Gera um link aleatório de Meet (formato padrão do Google Meet)
  const generateMeetLink = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const segment = (length: number) => Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      return `https://meet.google.com/${segment(3)}-${segment(4)}-${segment(3)}`;
  };

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuSessionId(null);
    if (activeMenuSessionId) {
        window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuSessionId]);

  useEffect(() => {
    // Sort sessions: Upcoming first, then by date/time
    const loadedSessions = [...scheduledSessions].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
    setSessions(loadedSessions);
  }, [scheduledSessions]);

  const handleSave = async (andSend: boolean = false) => {
    if (!selectedPatientId || !date || !time) return;

    let sessionToSave: ScheduledSession;

    if (editingSessionId) {
        // Modo Edição: Preservar dados existentes como status e lembretes
        const existingSession = sessions.find(s => s.id === editingSessionId);
        if (!existingSession) return;

        sessionToSave = {
            ...existingSession,
            patientId: selectedPatientId,
            date,
            time,
            duration,
            isOnline,
            meetLink: isOnline && !existingSession.meetLink ? generateMeetLink() : (isOnline ? existingSession.meetLink : undefined),
            notes: notes.trim()
        };
    } else {
        // Modo Criação
        sessionToSave = {
            id: Date.now().toString(),
            patientId: selectedPatientId,
            date,
            time,
            duration,
            status: 'scheduled',
            isOnline,
            meetLink: isOnline ? generateMeetLink() : undefined,
            reminderSent: false,
            notes: notes.trim()
        };
    }

    await saveScheduledSession(sessionToSave);
    handleCloseModal();

    if (andSend) {
        handleManualWhatsApp(sessionToSave, 'confirm');
    }
  };

  const handleEdit = (session: ScheduledSession) => {
    setEditingSessionId(session.id);
    setSelectedPatientId(session.patientId);
    setDate(session.date);
    setTime(session.time);
    setDuration(session.duration);
    setNotes(session.notes || '');
    setIsOnline(session.isOnline || false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingSessionId(null);
    setSelectedPatientId('');
    setDate('');
    setTime('');
    setDuration(50);
    setNotes('');
    setIsOnline(false);
  };

  const updateStatus = async (id: string, status: ScheduledSession['status']) => {
    await updateScheduledSessionStatus(id, status);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Cancelar este agendamento?')) {
      await deleteScheduledSession(id);
    }
  };

  const getPatient = (id: string) => {
      return patients.find(p => p.id === id);
  };

  const getPatientName = (id: string) => {
    return getPatient(id)?.name || 'Paciente Desconhecido';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-white text-slate-800 border-slate-200';
    }
  };

  const filterSessions = (status: string) => {
      return sessions.filter(s => {
          if (status === 'upcoming') return s.status === 'scheduled';
          return s.status === status;
      });
  };

  // Envio via API (Pago/Simulado)
  const handleSendApiReminder = async (session: ScheduledSession) => {
      const patient = getPatient(session.patientId);
      
      if (!patient || !patient.phoneNumber) {
          alert("Este paciente não possui número de WhatsApp cadastrado.");
          return;
      }

      setSendingSessionId(session.id);

      try {
          const dateStr = new Date(session.date + 'T12:00:00').toLocaleDateString('pt-BR');
          let textMsg = `Olá ${patient.name}, lembrando da nossa sessão agendada para amanhã, ${dateStr} às ${session.time}.`;
          
          if (session.isOnline && session.meetLink) {
              textMsg += `\n\n🎥 Link da chamada de vídeo: ${session.meetLink}`;
          }

          const success = await whatsappService.sendAppointmentReminder(
              patient.phoneNumber,
              patient.name,
              dateStr,
              session.time
          ); // Nota: Em um ambiente real com Twilio/API, o template da API também precisaria incluir a variável do link.

          if (success) {
              const now = new Date().toISOString();
              await updateScheduledSessionReminder(session.id, true, now);
          } else {
              alert("Falha ao enviar mensagem via API.");
          }
      } catch (error) {
          console.error(error);
          alert("Erro inesperado ao conectar com o serviço de mensagens.");
      } finally {
          setSendingSessionId(null);
          setActiveMenuSessionId(null);
      }
  };

  // Envio Manual (Link wa.me - Gratuito)
  const handleManualWhatsApp = (session: ScheduledSession, type: 'confirm' | 'cancel') => {
      const patient = getPatient(session.patientId);
      
      if (!patient || !patient.phoneNumber) {
          alert("Este paciente não possui número de WhatsApp cadastrado.");
          return;
      }

      // Limpar telefone
      const cleanPhone = patient.phoneNumber.replace(/\D/g, '');
      const phone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
      
      const dateStr = new Date(session.date + 'T12:00:00').toLocaleDateString('pt-BR');
      
      let message = '';
      if (type === 'confirm') {
          message = `Olá ${patient.name}, gostaria de confirmar nossa sessão agendada para *${dateStr} às ${session.time}*.`;
          if (session.isOnline && session.meetLink) {
              message += `\n\n🎥 A sessão será online. Aqui está o seu link de acesso:\n${session.meetLink}`;
          }
      } else {
          message = `Olá ${patient.name}, infelizmente precisarei remarcar nossa sessão de *${dateStr} às ${session.time}*. Podemos ver um novo horário?`;
      }

      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      setActiveMenuSessionId(null);
  };

  const formatReminderDate = (isoString?: string) => {
      if (!isoString) return 'Data desconhecida';
      return new Date(isoString).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
      });
  };

  const getGoogleCalendarUrl = (session: ScheduledSession) => {
      const patient = getPatient(session.patientId);
      const patientName = patient?.name || 'Paciente';
      
      let titleParams = `Sessão Psi: ${patientName}`;
      let detailsText = `Sessão com ${patientName}.\n\nObservações: ${session.notes || ''}`;
      
      if (session.isOnline && session.meetLink) {
          titleParams = `Sessão Online Psi: ${patientName}`;
          detailsText += `\n\nLink da Sessão: ${session.meetLink}`;
      }

      const title = encodeURIComponent(titleParams);
      const details = encodeURIComponent(detailsText);
      
      const [year, month, day] = session.date.split('-');
      const [hour, minute] = session.time.split(':');
      
      const startDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
      const endDate = new Date(startDate.getTime() + session.duration * 60000);
      
      const formatGoogleDate = (date: Date) => {
          return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
      };
      
      const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;
      
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
  };

  return (
    <div className="flex flex-col flex-1 min-h-[600px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6">
      {/* Header / Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <Calendar className="h-6 w-6 text-teal-600" />
             Agenda
           </h2>
           <p className="text-sm text-slate-500">Gerencie seus próximos atendimentos.</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Novo Agendamento
        </button>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scheduled / Upcoming */}
        <div className="lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Clock className="h-4 w-4 text-teal-600" /> Próximas Sessões
            </h3>
            
            {filterSessions('upcoming').length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-400">
                    Nenhuma sessão agendada.
                </div>
            ) : (
                <div className="grid gap-3">
                    {filterSessions('upcoming').map(session => (
                        <div key={session.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-md relative">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="bg-teal-50 p-2.5 rounded-full mt-1 flex-shrink-0">
                                    <User className="h-5 w-5 text-teal-600" />
                                </div>
                                <div className="min-w-0 w-full">
                                    <h4 className="font-bold text-slate-800 truncate">{getPatientName(session.patientId)}</h4>
                                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" /> 
                                            {new Date(session.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" /> 
                                            {session.time} ({session.duration} min)
                                        </span>
                                        {session.isOnline && (
                                            <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                                                <Video className="h-3.5 w-3.5" /> Online
                                            </span>
                                        )}
                                    </div>
                                    
                                    {session.isOnline && session.meetLink && (
                                        <div className="mt-2 text-xs flex items-center gap-2">
                                            <a href={session.meetLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded border border-blue-100 transition-colors w-fit">
                                                <Video className="h-3.5 w-3.5" /> Entrar na Chamada
                                            </a>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(session.meetLink!);
                                                    alert("Link copiado para a área de transferência!");
                                                }}
                                                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
                                                title="Copiar Link"
                                            >
                                                <LinkIcon className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    {session.notes && (
                                        <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 flex items-start gap-1.5 w-full md:w-[90%]">
                                            <FileText className="h-3.5 w-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                                            <span className="italic leading-relaxed break-words">{session.notes}</span>
                                        </div>
                                    )}

                                    {session.reminderSent && (
                                        <div className="flex items-center gap-1 mt-2 group relative w-fit cursor-help">
                                            <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" /> Lembrete enviado
                                            </span>
                                            <Info className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                            
                                            {/* Tooltip */}
                                            <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-50">
                                                <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap">
                                                    Enviado em: {formatReminderDate(session.reminderSentAt)}
                                                    <div className="absolute top-full left-4 -ml-1 border-4 border-transparent border-t-slate-800"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 flex-shrink-0">
                                {/* WhatsApp Button with Dropdown */}
                                <div className="relative" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={() => setActiveMenuSessionId(activeMenuSessionId === session.id ? null : session.id)}
                                        disabled={sendingSessionId === session.id}
                                        className={`p-1.5 border rounded transition-colors ${
                                            session.reminderSent || activeMenuSessionId === session.id
                                            ? 'text-green-600 border-green-200 bg-green-50' 
                                            : 'text-slate-400 hover:text-green-600 border-slate-200 hover:bg-green-50'
                                        }`}
                                        title="Opções de Mensagem"
                                    >
                                        {sendingSessionId === session.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <MessageCircle className="h-4 w-4" />
                                        )}
                                    </button>

                                    {/* Dropdown Menu */}
                                    {activeMenuSessionId === session.id && (
                                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-100 z-50 animate-fadeIn">
                                            <div className="py-1">
                                                <div className="px-3 py-2 border-b border-slate-50 bg-slate-50/50">
                                                     <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações Manuais (Grátis)</p>
                                                </div>
                                                <button
                                                    onClick={() => handleManualWhatsApp(session, 'confirm')}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <Smartphone className="h-4 w-4 text-green-500" /> Confirmar Consulta
                                                </button>
                                                <button
                                                    onClick={() => handleManualWhatsApp(session, 'cancel')}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <XCircle className="h-4 w-4 text-orange-500" /> Desmarcar/Remarcar
                                                </button>
                                                
                                                <div className="border-t border-slate-100 my-1"></div>
                                                <div className="px-3 py-1 bg-slate-50/50">
                                                     <p className="text-[10px] text-slate-400">Automação (Requer API)</p>
                                                </div>
                                                <button
                                                    onClick={() => handleSendApiReminder(session)}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <Zap className="h-4 w-4 text-yellow-500" /> Lembrete Automático
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <button 
                                    onClick={() => window.open(getGoogleCalendarUrl(session), '_blank')}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 border border-slate-200 rounded hover:bg-blue-50 transition-colors"
                                    title="Adicionar ao Google Agenda"
                                >
                                    <CalendarPlus className="h-4 w-4" />
                                </button>

                                <button 
                                    onClick={() => handleEdit(session)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 border border-slate-200 rounded hover:bg-blue-50 transition-colors"
                                    title="Editar Agendamento"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>

                                <button 
                                    onClick={() => updateStatus(session.id, 'completed')}
                                    className="p-1.5 text-slate-400 hover:text-teal-600 border border-slate-200 rounded hover:bg-teal-50 transition-colors"
                                    title="Marcar como Realizada (Sem Iniciar)"
                                >
                                    <Check className="h-4 w-4" />
                                </button>

                                <button 
                                    onClick={() => {
                                        updateStatus(session.id, 'completed');
                                        onStartSession(session.patientId);
                                    }}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-teal-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-teal-700 transition-colors"
                                    title="Iniciar Atendimento"
                                >
                                    <Play className="h-3 w-3" /> Iniciar
                                </button>
                                <button 
                                    onClick={() => updateStatus(session.id, 'cancelled')}
                                    className="p-1.5 text-slate-400 hover:text-red-500 border border-slate-200 rounded hover:bg-red-50 transition-colors"
                                    title="Cancelar"
                                >
                                    <XCircle className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Recent History (Completed/Cancelled) */}
        <div className="space-y-4">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Calendar className="h-4 w-4 text-slate-400" /> Recentes
            </h3>
            <div className="space-y-2">
                {sessions.filter(s => s.status !== 'scheduled').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map(session => (
                    <div key={session.id} className={`p-3 rounded-lg border text-sm flex justify-between items-center ${getStatusColor(session.status)}`}>
                        <div className="min-w-0">
                            <p className="font-medium truncate">{getPatientName(session.patientId)}</p>
                            <p className="text-xs opacity-80">{new Date(session.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {session.time}</p>
                            {session.notes && (
                                <p className="text-[10px] mt-1 text-slate-500 italic truncate max-w-[200px]">
                                    {session.notes}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/50">
                                {session.status === 'completed' ? 'Realizada' : 'Cancelada'}
                            </span>
                            <button onClick={() => handleDelete(session.id)} className="text-slate-400 hover:text-red-600">
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
                {sessions.filter(s => s.status !== 'scheduled').length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">Nenhum histórico recente.</p>
                )}
            </div>
        </div>

      </div>

      {/* Modal Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleCloseModal}></div>
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                  <h3 className="font-bold text-slate-800">
                      {editingSessionId ? 'Editar Agendamento' : 'Novo Agendamento'}
                  </h3>
                  <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                  <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Paciente</label>
                      <select 
                        value={selectedPatientId} 
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      >
                          <option value="">Selecione...</option>
                          {patients.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                      </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Data</label>
                          <input 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Horário</label>
                          <input 
                            type="time" 
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Duração (minutos)</label>
                      <input 
                        type="number" 
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                  </div>

                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                      <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                              type="checkbox" 
                              checked={isOnline}
                              onChange={(e) => setIsOnline(e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                          />
                          <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                  <Video className="h-4 w-4 text-blue-600" /> Sessão Online
                              </span>
                              <span className="text-xs text-slate-500">Um link do Google Meet será gerado automaticamente.</span>
                          </div>
                      </label>
                  </div>
                  
                  <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Observações (Opcional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none h-20"
                        placeholder="Ex: Trazer relatório escolar, focar em ansiedade..."
                      />
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                      <button 
                        onClick={() => handleSave(true)}
                        disabled={!selectedPatientId || !date || !time}
                        className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                          <Send className="h-4 w-4" /> 
                          {editingSessionId ? 'Salvar e Avisar no WhatsApp' : 'Agendar e Enviar Link no WhatsApp'}
                      </button>
                      <button 
                        onClick={() => handleSave(false)}
                        disabled={!selectedPatientId || !date || !time}
                        className="w-full bg-slate-100 text-slate-600 py-2.5 rounded-lg font-medium hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                          {editingSessionId ? 'Apenas Salvar Alterações' : 'Apenas Salvar Agendamento'}
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledSessions;