import { storageService } from './storageService';

export const notificationService = {
  checkAndSendReminders: () => {
    const sessions = storageService.getScheduledSessions();
    const patients = storageService.getPatients();
    const now = new Date();

    sessions.forEach(session => {
      // Ignorar sessões que não estão agendadas ou já foram notificadas
      if (session.status !== 'scheduled' || session.reminderSent) {
        return;
      }

      const sessionDate = new Date(`${session.date}T${session.time}`);
      const diffMs = sessionDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Regra: Enviar lembrete se faltar entre 0 e 24 horas para a sessão
      if (diffHours > 0 && diffHours <= 24) {
        const patient = patients.find(p => p.id === session.patientId);
        const patientName = patient ? patient.name : 'Paciente';

        // Simulação do envio (Log no Console)
        console.group('🔔 [SIMULAÇÃO] Notificação Push / E-mail');
        console.log(`Para: ${patientName}`);
        console.log(`Assunto: Lembrete de Sessão Amanhã`);
        console.log(`Mensagem: Olá ${patientName}, lembrete da sua sessão amanhã (${new Date(session.date).toLocaleDateString('pt-BR')}) às ${session.time}.`);
        console.groupEnd();

        // Atualizar status para não enviar novamente, salvando o timestamp
        storageService.updateScheduledSessionReminder(session.id, true, new Date().toISOString());
      }
    });
  }
};