import { AnalysisRequest } from "../types";

const SYSTEM_INSTRUCTION = `
Você é um Assistente Clínico de IA altamente especializado, projetado para auxiliar Psicólogos e Terapeutas Integrativos.
Seu objetivo é processar anotações de sessões e transformá-las em documentação clínica profissional, respeitando a abordagem teórica selecionada.

DIRETRIZES DE ADAPTAÇÃO:
1. **Abordagem Integrativa/Holística**: Se selecionada, observe correlações entre mente, corpo (queixas somáticas), emoções e contexto sistêmico/espiritual. Use linguagem que integre o ser.
2. **Abordagem Clínica/TCC/Comportamental**: Foque em sintomas, evidências, disfunções cognitivas, manutenção de comportamento e metrificação de progresso.
3. **Abordagem Psicodinâmica/Analítica**: Foque em conteúdo latente, simbologia, transferência, contratransferência e mecanismos de defesa.

DIRETRIZES ÉTICAS E DE SEGURANÇA (CRÍTICO):
1. NUNCA forneça diagnósticos definitivos (CID/DSM). Use termos como "Hipótese diagnóstica", "Sugere-se avaliação de...", "Sintomatologia compatível com...".
2. Você é uma ferramenta de suporte à decisão clínica, não um substituto.
3. Se detectar menções claras a risco de vida, suicídio ou heterocídio, inicie o relatório com: "🔴 ALERTA DE RISCO: [detalhes]".
4. Mantenha tom técnico, empático e isento de julgamento moral.
`;

export const analyzeSessionNotes = async (request: AnalysisRequest): Promise<string> => {
  try {
    // Pegando a chave diretamente das variáveis de ambiente do Frontend! Vai funcionar no localhost e na Vercel
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!API_KEY) {
        return "⚠️ Chave de API (VITE_GEMINI_API_KEY) não encontrada. Peça ao administrador para configurar as variáveis de ambiente na Vercel.";
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${API_KEY}`;

    const promptText = `
        Analise as seguintes anotações da sessão clínica:
        
        --- INÍCIO DAS NOTAS ---
        ${request.notes}
        --- FIM DAS NOTAS ---

        Abordagem Teórica Selecionada: ${request.approach}
        ${request.patientContext ? `Contexto do Paciente: ${request.patientContext}` : ''}

        INSTRUÇÃO DE FORMATAÇÃO:
        Gere o relatório preenchendo o conteúdo abaixo, mantendo a estrutura exata do template Markdown fornecido.
        Adapte o vocabulário e o olhar clínico para a Abordagem Teórica: ${request.approach}.

        TEMPLATE A SEGUIR:
        ${request.templateStructure}
    `;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      contents: [{
        parts: [{ text: promptText }]
      }],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 8192
      }
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Gemini API Error details:", errorData);
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta do servidor.";

  } catch (error: any) {
    console.error("Erro ao analisar sessão via Gemini API:", error);
    if (error.message?.includes("fetch") || error.message?.includes("NetworkError")) {
        return `⚠️ **Erro de Conexão:**\n\nNão foi possível conectar ao servidor da Google (Gemini). Verifique sua conexão com a internet.`;
    }
    return `Erro ao processar a solicitação na IA do Google: ${error.message}`;
  }
};
