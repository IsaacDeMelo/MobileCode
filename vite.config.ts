import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // O Vite expõe variáveis que começam com VITE_ por padrão, 
      // mas aqui mapeamos manualmente para process.env.API_KEY para compatibilidade com seu código atual
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
      'process.env': {} // Previne erros de "process is not defined" no navegador
    },
    build: {
      outDir: 'dist',
    }
  };
});