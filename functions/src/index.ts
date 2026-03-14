import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { GoogleGenAI } from '@google/genai';
import * as cors from 'cors';

admin.initializeApp();

const corsHandler = cors({ origin: true });

// Interfaces based on your types.ts
interface AnalysisRequest {
    notes: string;
    approach: string;
    patientContext?: string;
    templateStructure: string;
}

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

export const analyzeSession = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
        if (request.method !== 'POST') {
            response.status(405).send('Method Not Allowed');
            return;
        }

        try {
            // Get API Key from Firebase Config or Environment variables
            // Ideally setup with: firebase functions:config:set gemini.key="YOUR_KEY"
            const apiKey = functions.config().gemini?.key || process.env.GEMINI_API_KEY;

            if (!apiKey) {
                console.error("GEMINI_API_KEY is missing");
                response.status(500).json({ error: "Chave da API do Gemini não configurada no backend." });
                return;
            }

            const aiClient = new GoogleGenAI({ apiKey });
            const data: AnalysisRequest = request.body.data || request.body; // Handle generic and Firebase SDK formats

            if (!data.notes || !data.approach || !data.templateStructure) {
                response.status(400).json({ error: "Parâmetros obrigatórios ausentes (notes, approach, templateStructure)." });
                return;
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

            // Return using the "data" wrapper convention expected by Firebase HTTPS Callables 
            response.status(200).json({ data: { report: aiResponse.text || "Sem resposta." } });

        } catch (error: any) {
            console.error("Erro na análise:", error);
            response.status(500).json({ error: error.message || "Internal Server Error" });
        }
    });
});

export const sendWhatsappReminder = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
        if (request.method !== 'POST') {
            response.status(405).send('Method Not Allowed');
            return;
        }

        try {
            const token = functions.config().whatsapp?.token || process.env.WHATSAPP_API_TOKEN;
            const phoneId = functions.config().whatsapp?.phone_id || process.env.WHATSAPP_PHONE_ID;
            
            const data = request.body.data || request.body;
            const { phone, patientName, date, time } = data;

            if (!phone || !patientName || !date || !time) {
                response.status(400).json({ error: "Parâmetros obrigatórios ausentes." });
                return;
            }

            const cleanPhone = phone.replace(/\\D/g, '');
            const formattedPhone = cleanPhone.length <= 11 ? \`55\${cleanPhone}\` : cleanPhone;

            if (!token || !phoneId) {
                console.warn('⚠️ Credenciais do WhatsApp ausentes no Backend. Simulando envio.');
                response.status(200).json({ data: { success: true, simulated: true } });
                return;
            }

            const url = \`https://graph.facebook.com/v17.0/\${phoneId}/messages\`;
            const body = {
                messaging_product: 'whatsapp',
                to: formattedPhone,
                type: 'template',
                template: {
                    name: 'appointment_reminder',
                    language: { code: 'pt_BR' },
                    components: [{
                        type: 'body',
                        parameters: [
                            { type: 'text', text: patientName },
                            { type: 'text', text: date },
                            { type: 'text', text: time }
                        ]
                    }]
                }
            };

            const fetchResponse = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': \`Bearer \${token}\`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!fetchResponse.ok) {
                const errorData = await fetchResponse.json();
                throw new Error(errorData.error?.message || 'Falha no envio da Meta API');
            }

            response.status(200).json({ data: { success: true } });

        } catch (error: any) {
            console.error("Erro WhatsApp Backend:", error);
            response.status(500).json({ error: error.message || "Erro Interno" });
        }
    });
});
