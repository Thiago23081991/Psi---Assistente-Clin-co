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

// Auto-detecta qual modelo está disponível para a chave de API fornecida
async function getAvailableModel(apiKey: string): Promise<string> {
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const response = await fetch(listUrl);
  if (!response.ok) {
    throw new Error(`Falha ao listar modelos: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const models: any[] = data.models || [];

  // Filtra apenas modelos que suportam generateContent
  const compatible = models.filter((m: any) =>
    m.supportedGenerationMethods?.includes('generateContent')
  );

  if (compatible.length === 0) {
    throw new Error("Nenhum modelo compatível com generateContent encontrado para sua chave de API.");
  }

  // Preferência de modelo em ordem (mais capaz para menos)
  const preferences = [
    'gemini-2.5', 'gemini-2.0', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro', 'gemini-pro'
  ];

  for (const pref of preferences) {
    const found = compatible.find((m: any) => m.name.includes(pref));
    if (found) {
      // O nome vem como "models/gemini-xxx", precisamos só de "gemini-xxx"
      return found.name.replace('models/', '');
    }
  }

  // Fallback: usa o primeiro disponível
  return compatible[0].name.replace('models/', '');
}

export const analyzeSessionNotes = async (request: AnalysisRequest): Promise<string> => {
  try {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

    if (!API_KEY) {
      return "⚠️ Chave de API (VITE_GEMINI_API_KEY) não encontrada. Configure-a nas variáveis de ambiente da Vercel e no arquivo .env.local.";
    }

    // Descobre automaticamente qual modelo usar para esta chave
    const modelName = await getAvailableModel(API_KEY);
    console.log(`[GeminiService] Usando modelo: ${modelName}`);

    const prompt = `${SYSTEM_INSTRUCTION}

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

    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
    
    const response = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 8192
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta do servidor.";

  } catch (error: any) {
    console.error("Erro ao analisar sessão via Gemini API:", error);
    return `Erro ao processar a solicitação na IA do Google: ${error.message || JSON.stringify(error)}`;
  }
};
