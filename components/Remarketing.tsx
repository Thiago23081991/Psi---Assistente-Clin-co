import React, { useState, useEffect } from 'react';
import { Patient, SessionRecord } from '../types';
import { useData } from '../contexts/DataContext';
import { User, Calendar, MessageCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';

interface InactivePatient extends Patient {
  lastSessionDate: Date | null;
  daysAbsent: number;
}

const Remarketing: React.FC = () => {
  const { patients, sessions } = useData();
  const [inactivePatients, setInactivePatients] = useState<InactivePatient[]>([]);
  const [thresholdDays, setThresholdDays] = useState(30);

  useEffect(() => {
    analyzePatients();
  }, [thresholdDays, patients, sessions]);

  const analyzePatients = () => {
    const now = new Date();
    const results: InactivePatient[] = [];

    patients.forEach(patient => {
      const patientSessions = sessions
        .filter(s => s.patientId === patient.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      let lastSessionDate: Date | null = null;
      let daysAbsent = 0;

      if (patientSessions.length > 0) {
        lastSessionDate = new Date(patientSessions[0].date);
        const diffTime = Math.abs(now.getTime() - lastSessionDate.getTime());
        daysAbsent = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else {
        // Se nunca teve sessão, conta desde a criação do cadastro
        const createdDate = new Date(patient.createdAt || new Date().toISOString());
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        daysAbsent = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Filtra baseado no limite de dias (ex: mais de 30 dias sem vir)
      if (daysAbsent >= thresholdDays) {
        results.push({
          ...patient,
          lastSessionDate,
          daysAbsent
        });
      }
    });

    // Ordenar: Quem está ausente há mais tempo primeiro (mas talvez quem nunca veio seja prioridade)
    // Vamos ordenar por dias ausentes (decrescente)
    results.sort((a, b) => b.daysAbsent - a.daysAbsent);
    setInactivePatients(results);
  };

  const handleWhatsAppContact = (patient: InactivePatient) => {
    if (!patient.phoneNumber) {
      alert("Este paciente não possui número cadastrado.");
      return;
    }

    const cleanPhone = patient.phoneNumber.replace(/\D/g, '');
    const phone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    
    let message = '';
    
    if (patient.lastSessionDate) {
      // Mensagem para retorno (já é paciente antigo)
      message = `Olá ${patient.name}, tudo bem? Notei que faz um tempinho desde nossa última sessão. Como você tem estado? Estou organizando a agenda e gostaria de saber se deseja retomar nossos encontros.`;
    } else {
      // Mensagem para quem cadastrou mas nunca fez sessão (Lead)
      message = `Olá ${patient.name}, tudo bem? Vi aqui que realizamos seu cadastro mas ainda não iniciamos as sessões. Gostaria de verificar sua disponibilidade para agendarmos um horário?`;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col flex-1 min-h-[600px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-orange-500" />
            Remarketing & Recuperação
          </h2>
          <p className="text-sm text-slate-500">
            Pacientes que não realizam sessões há mais de {thresholdDays} dias.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
           <span className="text-xs font-medium text-slate-600">Filtrar ausência:</span>
           <select 
              value={thresholdDays}
              onChange={(e) => setThresholdDays(Number(e.target.value))}
              className="text-sm border-none bg-transparent font-bold text-teal-700 focus:ring-0 cursor-pointer outline-none"
           >
              <option value={15}>&gt; 15 dias</option>
              <option value={30}>&gt; 30 dias</option>
              <option value={60}>&gt; 60 dias</option>
              <option value={90}>&gt; 90 dias</option>
           </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
        {inactivePatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
             <AlertCircle className="h-12 w-12 mb-3 opacity-20" />
             <p>Nenhum paciente inativo encontrado para este período.</p>
             <p className="text-xs">Sua retenção de pacientes está ótima!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactivePatients.map(patient => (
              <div key={patient.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${patient.lastSessionDate ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 truncate max-w-[150px]">{patient.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                           {patient.lastSessionDate ? 'Paciente Inativo' : 'Nunca iniciou'}
                        </p>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className="block text-2xl font-bold text-slate-700">{patient.daysAbsent}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Dias s/ Sessão</span>
                   </div>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                            Última vez: {patient.lastSessionDate ? patient.lastSessionDate.toLocaleDateString() : 'Nunca'}
                        </span>
                    </div>
                    {patient.phoneNumber ? (
                       <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                          <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                          <span>{patient.phoneNumber}</span>
                       </div>
                    ) : (
                       <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 p-2 rounded">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Sem telefone cadastrado</span>
                       </div>
                    )}
                </div>

                <button
                  onClick={() => handleWhatsAppContact(patient)}
                  disabled={!patient.phoneNumber}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  Mandar Mensagem
                </button>
                
                <p className="text-[10px] text-center text-slate-400 mt-2">
                   Abre o WhatsApp com mensagem sugerida
                </p>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Remarketing;
