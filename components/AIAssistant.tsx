import React, { useState, useRef, useEffect } from 'react';
import { CodeFile, ChatMessage } from '../types';
import { streamGeminiResponse } from '../services/geminiService';
import { Send, User, Loader2, Sparkles, X, Trash2, Check } from 'lucide-react';
import { GenerateContentResponse } from '@google/genai';

interface AIAssistantProps {
  currentFile: CodeFile;
  files: CodeFile[];
  onApplyCode?: (code: string) => void; // Potential future feature
  onClose: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ currentFile, files, onClose }) => {
  const HANA_AVATAR_URL = "https://img.icons8.com/?size=100&id=n0X3RRyAOlyK&format=png&color=000000";
  
  const getWelcomeMessage = (fileName: string): ChatMessage => ({
    id: 'welcome',
    role: 'model',
    text: `Olá! Sou a Hana, sua instrutora de código. Estou analisando o arquivo ${fileName}. No que posso ajudar você hoje?`
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
    return [getWelcomeMessage(currentFile.name)];
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
  }, [messages]);

  // Save chat to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('mobilecoder_chat', JSON.stringify(messages));
  }, [messages]);

  const handleClearChat = () => {
    const newHistory = [getWelcomeMessage(currentFile.name)];
    setMessages(newHistory);
    localStorage.setItem('mobilecoder_chat', JSON.stringify(newHistory));
    setIsConfirmingClear(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    // Optimistically add user message
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // We pass the CURRENT history (before the new user message) + the new message implicitly via the service update
      const stream = await streamGeminiResponse(userMsg.text, messages, currentFile, files);
      
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
        text: 'Desculpe, ocorreu um erro ao conectar com a Hana.',
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] text-gray-100 relative">
       <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#1e1e1e]">
        <div className="flex items-center gap-3">
           <div className="relative">
             <img src={HANA_AVATAR_URL} alt="Hana" className="w-8 h-8 rounded-full border border-purple-500/50" />
             <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#1e1e1e] rounded-full"></div>
           </div>
           <div>
             <h2 className="font-semibold text-sm tracking-wide text-white">Instrutora Hana</h2>
             <p className="text-[10px] text-purple-400 font-medium">Online</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
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
                src={HANA_AVATAR_URL} 
                alt="Hana" 
                className="w-8 h-8 rounded-full flex-shrink-0 border border-gray-700 bg-[#1e1e1e]" 
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
                src={HANA_AVATAR_URL} 
                alt="Hana" 
                className="w-8 h-8 rounded-full flex-shrink-0 border border-gray-700 bg-[#1e1e1e]" 
              />
            <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-purple-400" />
              <span className="text-xs text-gray-400">Hana está digitando...</span>
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
            placeholder="Pergunte à Hana..."
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