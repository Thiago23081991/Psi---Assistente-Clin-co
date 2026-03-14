import { AnalysisRequest } from "../types";

export const analyzeSessionNotes = async (request: AnalysisRequest): Promise<string> => {
  try {
    // In production, this URL should be replaced by your deployed Firebase Function URL
    // e.g., 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/analyzeSession'
    const CLOUD_FUNCTION_URL = 'http://127.0.0.1:5001/psiai---assistente-clínico/us-central1/analyzeSession'; 

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
