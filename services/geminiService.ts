import { AnalysisRequest } from "../types";

export const analyzeSessionNotes = async (request: AnalysisRequest): Promise<string> => {
  try {
    // Usando Rota de API Severless da Vercel (Mesma origem do app React)
    const API_URL = '/api/analyzeSession';

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: request }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const jsonResponse = await response.json();
    return jsonResponse.data?.report || "Sem resposta do servidor.";

  } catch (error: any) {
    console.error("Erro ao analisar sessão via Cloud Function:", error);
    if (error.message?.includes("fetch")) {
        return `⚠️ **Erro de Conexão:**\n\nNão foi possível conectar ao servidor Vercel. Tente novamente mais tarde.`;
    }
    return "Erro ao processar a solicitação no servidor Vercel. Tente novamente em instantes.";
  }
};
