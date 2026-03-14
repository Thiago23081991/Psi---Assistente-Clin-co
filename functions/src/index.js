"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSession = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const genai_1 = require("@google/genai");
const cors = __importStar(require("cors"));
admin.initializeApp();
const corsHandler = cors({ origin: true });
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
exports.analyzeSession = functions.https.onRequest((request, response) => {
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
            const aiClient = new genai_1.GoogleGenAI({ apiKey });
            const data = request.body.data || request.body; // Handle generic and Firebase SDK formats
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
        }
        catch (error) {
            console.error("Erro na análise:", error);
            response.status(500).json({ error: error.message || "Internal Server Error" });
        }
    });
});
//# sourceMappingURL=index.js.map