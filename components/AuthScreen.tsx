
import React, { useState } from 'react';
import { Lock, ArrowRight, Code2 } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key === 'lxpsaicbvewpo') {
      localStorage.setItem('mobilecoder_auth_key', 'valid');
      onSuccess();
    } else {
      setError(true);
      setKey('');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0f0f11] flex flex-col items-center justify-center p-6 z-50">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
            <Code2 className="text-blue-500" size={32} />
        </div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          MobileCoder
        </h1>
        <p className="text-gray-500 text-sm mt-2">Ambiente de Desenvolvimento Seguro</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock size={16} className="text-gray-500" />
          </div>
          <input
            type="password"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError(false);
            }}
            placeholder="Chave de Acesso"
            className={`w-full bg-[#1e1e1e] border ${error ? 'border-red-500' : 'border-gray-800'} rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600`}
            autoFocus
          />
        </div>
        
        {error && (
          <p className="text-red-400 text-xs text-center animate-pulse">
            Chave inválida. Tente novamente.
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
        >
          <span>Entrar</span>
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
};

export default AuthScreen;
