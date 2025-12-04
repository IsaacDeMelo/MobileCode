import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { CodeFile, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `Você é Hana, uma instrutora de programação amigável e paciente (perfil feminino).
Você está integrada ao "MobileCoder", um IDE mobile web.
Seu objetivo é ensinar os usuários a escrever, depurar e otimizar códigos HTML, CSS e JavaScript.
Como o usuário está em um dispositivo móvel, seja concisa, mas didática.
Quando o usuário pedir código, explique o 'porquê' da solução brevemente para ajudar no aprendizado.
Você tem acesso ao contexto dos arquivos atuais do usuário.
Fale SOMENTE em português.`;

export const streamGeminiResponse = async (
  prompt: string,
  history: ChatMessage[],
  currentFile: CodeFile,
  allFiles: CodeFile[]
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const fileContext = allFiles
    .map((f) => `--- Arquivo: ${f.name} (${f.language}) ---\n${f.content}\n`)
    .join('\n');

  // Format the last few messages for context (limit to last 10 to save tokens)
  const conversationHistory = history
    .slice(-10) 
    .filter(m => !m.isError && m.id !== 'welcome')
    .map(m => `${m.role === 'user' ? 'Aluno' : 'Hana'}: ${m.text}`)
    .join('\n\n');

  const fullPrompt = `
Contexto do projeto atual:
${fileContext}

Histórico da conversa recente:
${conversationHistory}

Editando atualmente: ${currentFile.name}

Nova Pergunta do Aluno: ${prompt}
`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    return responseStream;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};