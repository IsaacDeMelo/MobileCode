import React, { useState, useRef, useEffect } from 'react';
import { CodeFile, ChatMessage, AIConfig } from '../types';
import { streamGeminiResponse } from '../services/geminiService';
import { Send, User, Loader2, X, Trash2, Check, Settings, Save, RotateCcw, Upload } from 'lucide-react';
import { GenerateContentResponse } from '@google/genai';

interface AIAssistantProps {
  currentFile: CodeFile;
  files: CodeFile[];
  onApplyCode?: (code: string) => void;
  onClose: () => void;
}

const DEFAULT_AI_CONFIG: AIConfig = {
  name: "Hana",
  avatarUrl: "https://img.icons8.com/?size=100&id=n0X3RRyAOlyK&format=png&color=000000",
  systemInstruction: `Você é Hana, uma instrutora de programação amigável e paciente (perfil feminino).
Você está integrada ao "MobileCoder", um IDE mobile web.
Seu objetivo é ensinar os usuários a escrever, depurar e otimizar códigos HTML, CSS e JavaScript.
Como o usuário está em um dispositivo móvel, seja concisa, mas didática.
Quando o usuário pedir código, explique o 'porquê' da solução brevemente para ajudar no aprendizado.
Você tem acesso ao contexto dos arquivos atuais do usuário.
Fale SOMENTE em português.`
};

const AIAssistant: React.FC<AIAssistantProps> = ({ currentFile, files, onClose }) => {
  // Load AI Config
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    try {
      const savedConfig = localStorage.getItem('mobilecoder_ai_config');
      return savedConfig ? JSON.parse(savedConfig) : DEFAULT_AI_CONFIG;
    } catch {
      return DEFAULT_AI_CONFIG;
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Settings Form State
  const [tempConfig, setTempConfig] = useState<AIConfig>(aiConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getWelcomeMessage = (fileName: string, name: string): ChatMessage => ({
    id: 'welcome',
    role: 'model',
    text: `Olá! Sou ${name}. Estou analisando o arquivo ${fileName}. Como posso ajudar?`
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const savedChat = localStorage.getItem('mobilecoder_chat');
      if (savedChat) {
        return JSON.parse(savedChat);
      }
    } catch (e) {
      console.error("Erro ao carregar chat:", e);
    }
    return [getWelcomeMessage(currentFile.name, aiConfig.name)];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSettingsOpen]);

  useEffect(() => {
    localStorage.setItem('mobilecoder_chat', JSON.stringify(messages));
  }, [messages]);

  // Save config logic
  const handleSaveConfig = () => {
    setAiConfig(tempConfig);
    localStorage.setItem('mobilecoder_ai_config', JSON.stringify(tempConfig));
    setIsSettingsOpen(false);
    
    // Optionally refresh welcome message if chat is empty or just welcome
    if (messages.length <= 1) {
       setMessages([getWelcomeMessage(currentFile.name, tempConfig.name)]);
    }
  };

  const handleResetConfig = () => {
    setTempConfig(DEFAULT_AI_CONFIG);
  };

  const handleClearChat = () => {
    const newHistory = [getWelcomeMessage(currentFile.name, aiConfig.name)];
    setMessages(newHistory);
    localStorage.setItem('mobilecoder_chat', JSON.stringify(newHistory));
    setIsConfirmingClear(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit to ~2MB
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem é muito grande. Por favor, escolha uma menor que 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setTempConfig(prev => ({ ...prev, avatarUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await streamGeminiResponse(
        userMsg.text, 
        messages, 
        currentFile, 
        files, 
        aiConfig.systemInstruction,
        aiConfig.name
      );
      
      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '' }]);

      let fullText = '';
      for await (const chunk of stream) {
        const chunkText = (chunk as GenerateContentResponse).text;
        if (chunkText) {
          fullText += chunkText;
          setMessages(prev => 
            prev.map(msg => msg.id === modelMsgId ? { ...msg, text: fullText } : msg)
          );
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: `Desculpe, ocorreu um erro ao conectar com ${aiConfig.name}.`,
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSettingsOpen) {
    return (
      <div className="flex flex-col h-full bg-[#121212] text-gray-100">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#1e1e1e]">
          <h2 className="font-semibold text-sm text-white flex items-center gap-2">
            <Settings size={16} /> Configurar IA
          </h2>
          <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-gray-800 rounded">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nome da IA</label>
            <input 
              type="text" 
              value={tempConfig.name}
              onChange={(e) => setTempConfig(prev => ({...prev, name: e.target.value}))}
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-purple-500 focus:outline-none text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Avatar (URL ou Arquivo)</label>
            <div className="flex gap-2 items-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-12 h-12 flex-shrink-0 cursor-pointer group"
                title="Clique para enviar imagem"
              >
                <img 
                  src={tempConfig.avatarUrl} 
                  alt="Preview" 
                  className="w-full h-full rounded-full bg-gray-700 border border-gray-600 object-cover" 
                  onError={(e) => (e.currentTarget.src = DEFAULT_AI_CONFIG.avatarUrl)} 
                />
                 <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={16} className="text-white" />
                 </div>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <input 
                type="text" 
                value={tempConfig.avatarUrl}
                onChange={(e) => setTempConfig(prev => ({...prev, avatarUrl: e.target.value}))}
                className="flex-1 bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
                placeholder="https://exemplo.com/avatar.png"
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <label className="block text-xs text-gray-400 mb-1">Personalidade (System Prompt)</label>
            <textarea 
              value={tempConfig.systemInstruction}
              onChange={(e) => setTempConfig(prev => ({...prev, systemInstruction: e.target.value}))}
              className="w-full flex-1 min-h-[200px] bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-purple-500 focus:outline-none text-white font-mono leading-relaxed"
            />
          </div>
        </div>
        <div className="p-4 border-t border-gray-800 bg-[#1e1e1e] flex justify-between">
           <button 
            onClick={handleResetConfig}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded text-sm hover:bg-gray-600 transition-colors"
          >
            <RotateCcw size={16} /> Restaurar Padrão
          </button>
          <button 
            onClick={handleSaveConfig}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded text-sm text-white hover:bg-purple-500 transition-colors shadow-lg"
          >
            <Save size={16} /> Salvar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#121212] text-gray-100 relative">
       <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#1e1e1e]">
        <div className="flex items-center gap-3">
           <div className="relative">
             <img src={aiConfig.avatarUrl} alt={aiConfig.name} className="w-8 h-8 rounded-full border border-purple-500/50 object-cover" />
             <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#1e1e1e] rounded-full"></div>
           </div>
           <div>
             <h2 className="font-semibold text-sm tracking-wide text-white">{aiConfig.name}</h2>
             <p className="text-[10px] text-purple-400 font-medium">Online</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={() => {
              setTempConfig(aiConfig);
              setIsSettingsOpen(true);
            }} 
            className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
            title="Configurações da IA"
          >
            <Settings size={18} />
          </button>

          {isConfirmingClear ? (
            <div className="flex items-center bg-gray-800 rounded overflow-hidden border border-red-500/50 animate-in fade-in slide-in-from-right-4 duration-200">
              <span className="text-[10px] px-2 text-red-300">Apagar?</span>
              <button 
                onClick={handleClearChat}
                className="p-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                title="Confirmar"
              >
                <Check size={14} />
              </button>
              <button 
                onClick={() => setIsConfirmingClear(false)}
                className="p-1.5 hover:bg-gray-700 text-gray-400 transition-colors"
                title="Cancelar"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => setIsConfirmingClear(true)} 
              title="Nova Conversa" 
              className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 hover:bg-gray-800 rounded"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.role === 'model' ? (
              <img 
                src={aiConfig.avatarUrl} 
                alt={aiConfig.name} 
                className="w-8 h-8 rounded-full flex-shrink-0 border border-gray-700 bg-[#1e1e1e] object-cover" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <User size={16} />
              </div>
            )}
            
            <div className={`
              max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
              ${msg.role === 'user' 
                ? 'bg-blue-600/20 text-blue-100 rounded-tr-none' 
                : 'bg-gray-800 text-gray-200 rounded-tl-none'}
              ${msg.isError ? 'border border-red-500/50 bg-red-900/10' : ''}
            `}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
             <img 
                src={aiConfig.avatarUrl} 
                alt={aiConfig.name} 
                className="w-8 h-8 rounded-full flex-shrink-0 border border-gray-700 bg-[#1e1e1e] object-cover" 
              />
            <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-purple-400" />
              <span className="text-xs text-gray-400">{aiConfig.name} está digitando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-0 bg-[#1e1e1e] border-t border-gray-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Pergunte à ${aiConfig.name}...`}
            className="w-full bg-[#121212] border-t border-gray-800 py-4 pl-4 pr-12 text-sm focus:outline-none focus:bg-[#1a1a1a] transition-all placeholder:text-gray-600 text-gray-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-purple-600 rounded-full text-white disabled:opacity-50 disabled:bg-gray-700 transition-all shadow-lg hover:bg-purple-500"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIAssistant;