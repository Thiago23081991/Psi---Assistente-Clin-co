import { AnalysisRequest } from "../types";

export const analyzeSessionNotes = async (request: AnalysisRequest): Promise<string> => {
  try {
    // Using the verified production URL for the deployed Google Cloud Function
    const CLOUD_FUNCTION_URL = 'https://us-central1-psiai-17df8.cloudfunctions.net/analyzeSession';

    const response = await fetch(CLOUD_FUNCTION_URL, {
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
        return `⚠️ **Erro de Conexão:**\n\nNão foi possível conectar ao servidor. Certifique-se de que as Cloud Functions estão rodando localmente (firebase emulators:start) ou que a URL de produção está configurada corretamente no \`geminiService.ts\`.`;
    }
    return "Erro ao processar a solicitação no servidor Seguro. Verifique os logs da Cloud Function.";
  }
};
