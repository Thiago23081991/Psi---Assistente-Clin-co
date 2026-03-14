interface WhatsappResponse {
  success: boolean;
  simulated?: boolean;
}

export const whatsappService = {
  /**
   * Envia um lembrete de agendamento acionando a Cloud Function segura.
   */
  sendAppointmentReminder: async (
    phone: string, 
    patientName: string, 
    date: string, 
    time: string
  ): Promise<boolean> => {
    
    // In production, use the deployed URL
    const CLOUD_FUNCTION_URL = 'http://127.0.0.1:5001/psiai---assistente-clínico/us-central1/sendWhatsappReminder';

    try {
      const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            data: { phone, patientName, date, time } 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na Cloud Function do WhatsApp:', errorData);
        throw new Error(errorData.error || 'Falha no servidor');
      }

      const responseData = await response.json();
      const result = responseData.data as WhatsappResponse;
      
      if (result.simulated) {
          console.log(`[MOCK] O backend simulou o envio para ${patientName} pois as credenciais da Meta não estão presentes lá.`);
      } else {
          console.log(`Sucesso WhatsApp API para ${patientName}`);
      }
      
      return true;

    } catch (error) {
      console.error('Erro ao acionar disparo de mensagem:', error);
      return false;
    }
  }
};