import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalysisRequest } from "../types";

const SYSTEM_INSTRUCTION = `
Você é um Assistente Clínico de IA altamente especializado, projetado para auxiliar Psicólogos e Terapeutas Integrativos.
Seu objetivo é processar anotações de sessões e transformá-las em documentação clínica profissional, respeitando a abordagem teórica selecionada.

DIRETRIZES DE ADAPTAÇÃO:
1. **Abordagem Integrativa/Holística**: Observe correlações entre mente, corpo, emoções e contexto sistêmico/espiritual.
2. **Abordagem Clínica/TCC/Comportamental**: Foque em sintomas, evidências, disfunções cognitivas e manutenção de comportamento.
3. **Abordagem Psicodinâmica/Analítica**: Foque em conteúdo latente, simbologia, transferência e mecanismos de defesa.

DIRETRIZES ÉTICAS E DE SEGURANÇA (CRÍTICO):
1. NUNCA forneça diagnósticos definitivos (CID/DSM). Use termos como "Hipótese diagnóstica" ou "Sintomatologia compatível com...".
2. Você é uma ferramenta de suporte à decisão clínica, não um substituto.
3. Se detectar menções claras a risco de vida, inicie o relatório com: "🔴 ALERTA DE RISCO: [detalhes]".
4. Mantenha tom técnico, empático e isento de julgamento moral.
`;

export const analyzeSessionNotes = async (request: AnalysisRequest): Promise<string> => {
  try {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

    if (!API_KEY) {
      return "⚠️ Chave de API (VITE_GEMINI_API_KEY) não encontrada. Configure-a nas variáveis de ambiente da Vercel e no arquivo .env.local local.";
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const prompt = `
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

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();

  } catch (error: any) {
    console.error("Erro ao analisar sessão via Gemini SDK:", error);
    // Sempre mostrar o erro real para facilitar o diagnóstico
    return `Erro ao processar a solicitação na IA do Google: ${error.message || JSON.stringify(error)}`;
  }
};
