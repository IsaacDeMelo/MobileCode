
import { CodeFile } from './types';

export const INITIAL_FILES: CodeFile[] = [
  {
    id: '1',
    parentId: null,
    type: 'file',
    name: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pré-visualização Mobile</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="container">
    <h1>Olá Mundo</h1>
    <p>Bem-vindo ao MobileCoder IDE.</p>
    <button id="clickBtn">Clique Aqui</button>
    <p id="output"></p>
    <!-- Tente fazer upload de uma imagem para uma pasta 'assets' e referenciá-la aqui! -->
    <!-- <img src="/assets/minha-imagem.png" /> -->
  </div>
  <script src="/script.js"></script>
</body>
</html>`
  },
  {
    id: '2',
    parentId: null,
    type: 'file',
    name: 'style.css',
    language: 'css',
    content: `body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: #121212;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
}

.container {
  text-align: center;
  padding: 20px;
  background: #1e1e1e;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
}

button:active {
  transform: scale(0.98);
}`
  },
  {
    id: '3',
    parentId: null,
    type: 'file',
    name: 'script.js',
    language: 'javascript',
    content: `const btn = document.getElementById('clickBtn');
const output = document.getElementById('output');
let count = 0;

btn.addEventListener('click', () => {
  count++;
  output.textContent = \`Você clicou no botão \${count} vezes!\`;
  
  // Efeito de cor aleatória
  const hue = Math.floor(Math.random() * 360);
  btn.style.backgroundColor = \`hsl(\${hue}, 70%, 50%)\`;
});`
  }
];