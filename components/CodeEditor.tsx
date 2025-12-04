
import React from 'react';
import Editor from 'react-simple-code-editor';
// @ts-ignore
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // html
import { CodeFile } from '../types';
import { ImageIcon } from 'lucide-react';

interface CodeEditorProps {
  file: CodeFile;
  onChange: (newContent: string) => void;
  className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ file, onChange, className }) => {
  
  // Handle Image View
  if (file.type === 'image') {
    return (
      <div className={`flex flex-col items-center justify-center h-full w-full bg-[#1e1e1e] ${className}`}>
        <div className="p-8 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center">
          {file.content ? (
            <img 
              src={file.content} 
              alt={file.name} 
              className="max-w-full max-h-[50vh] object-contain mb-4 shadow-lg" 
            />
          ) : (
            <div className="w-32 h-32 bg-gray-800 rounded flex items-center justify-center mb-4">
              <ImageIcon size={48} className="text-gray-600" />
            </div>
          )}
          <p className="text-gray-400 text-sm font-mono">{file.name}</p>
          <p className="text-gray-600 text-xs mt-2">Visualização de Imagem (Base64)</p>
        </div>
      </div>
    );
  }

  // Handle Code View
  const highlight = (code: string) => {
    let grammar = Prism.languages.markup;
    if (file.language === 'javascript') grammar = Prism.languages.javascript;
    if (file.language === 'css') grammar = Prism.languages.css;
    return Prism.highlight(code, grammar, file.language);
  };

  return (
    <div className={`relative h-full w-full overflow-auto bg-[#1e1e1e] ${className}`}>
      <Editor
        value={file.content}
        onValueChange={onChange}
        highlight={highlight}
        padding={16}
        className="font-mono text-[14px] leading-6 min-h-full"
        textareaClassName="focus:outline-none"
        style={{
          fontFamily: '"Fira Code", "Fira Mono", monospace',
          fontSize: 14,
          backgroundColor: '#1e1e1e',
          color: '#f8f8f2',
          minHeight: '100%'
        }}
      />
    </div>
  );
};

export default CodeEditor;
