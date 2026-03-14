/**
 * Arquivo: cryptoService.ts
 * Utilitário para Criptografia de Ponta-a-Ponta (E2EE) no navegador.
 * 
 * Sendo uma aplicação clínica, os prontuários (notas e relatórios) 
 * devem ser armazenados criptografados no Firestore.
 */

// Retorna uma chave AES a partir do UID do Firebase ou PIN do usuário.
// Em um app de produção Nível 3 (HIPAA), você extrairia isso de um input
// assinado do usuário (uma Master Password que nunca vai pro Firebase Auth).
// Aqui usamos uma derivação simples baseada no ID do usuário logado para MVP:
const getDeriveKey = async (secret: string): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("psiai-clinical-secure-salt-2024"),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
};

// Funções utilitárias para conversão ArrayBuffer/Base64
const bufferToBase64 = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

const base64ToBuffer = (base64: string): ArrayBuffer => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
};

export const cryptoService = {
    encrypt: async (text: string, userId: string): Promise<string> => {
        if (!text) return text;
        
        try {
            const key = await getDeriveKey(userId);
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encodedText = new TextEncoder().encode(text);

            const encryptedBuffer = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                key,
                encodedText
            );

            // Combina o IV (vetor de inicialização) e o conteúdo protegido no retorno
            const ivBase64 = bufferToBase64(iv.buffer);
            const encryptedBase64 = bufferToBase64(encryptedBuffer);
            
            return `ENC::${ivBase64}::${encryptedBase64}`;
        } catch (error) {
            console.error("Falha na criptografia", error);
            throw new Error("Não foi possível criptografar o documento seguro.");
        }
    },

    decrypt: async (encryptedData: string, userId: string): Promise<string> => {
        if (!encryptedData || !encryptedData.startsWith('ENC::')) return encryptedData;

        try {
            const parts = encryptedData.split('::');
            if (parts.length !== 3) throw new Error("Formato de cifra inválido");

            const ivBase64 = parts[1];
            const contentBase64 = parts[2];

            const key = await getDeriveKey(userId);
            const iv = new Uint8Array(base64ToBuffer(ivBase64));
            const encryptedBuffer = base64ToBuffer(contentBase64);

            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                encryptedBuffer
            );

            return new TextDecoder().decode(decryptedBuffer);
        } catch (error) {
            console.error("Falha ao descriptografar", error);
            return "[Erro: Não foi possível descriptografar este texto de segurança]";
        }
    }
};
