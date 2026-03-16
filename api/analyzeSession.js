import { GoogleGenAI } from '@google/genai';

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

export default async function handler(req, res) {
    // Configuração de CORS: Permitir todas as origens na Vercel
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    // Se for OPTIONS (preflight do Navegador CORS), retorna OK imediato
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing na Vercel");
            return res.status(500).json({ error: "Chave da API do Gemini não configurada no backend Vercel." });
        }

        const aiClient = new GoogleGenAI({ apiKey });
        
        // Em Vercel Serverless Functions, o body costuma vir parseado ou dentro de event.body
        const data = req.body?.data || req.body; 

        if (!data || !data.notes || !data.approach || !data.templateStructure) {
            return res.status(400).json({ error: "Parâmetros obrigatórios ausentes (notes, approach, templateStructure)." });
        }

        const prompt = `
            Analise as seguintes anotações da sessão clínica:
            
            --- INÍCIO DAS NOTAS ---
            ${data.notes}
            --- FIM DAS NOTAS ---

            Abordagem Teórica Selecionada: ${data.approach}
            ${data.patientContext ? `Contexto do Paciente: ${data.patientContext}` : ''}

            INSTRUÇÃO DE FORMATAÇÃO:
            Gere o relatório preenchendo o conteúdo abaixo, mantendo a estrutura exata do template Markdown fornecido.
            Adapte o vocabulário e o olhar clínico para a Abordagem Teórica: ${data.approach}.

            TEMPLATE A SEGUIR:
            ${data.templateStructure}
        `;

        const aiResponse = await aiClient.models.generateContent({
            model: 'gemini-3-pro-preview', 
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.35, 
            },
        });

        // Firebase espera resposta { data: { ... } } mas como criamos API própria, podemos padronizar
        return res.status(200).json({ data: { report: aiResponse.text || "Sem resposta." } });

    } catch (error) {
        console.error("Erro na análise Serverless Vercel:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}
