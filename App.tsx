
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CodeFile, TabView } from './types';
import { INITIAL_FILES } from './constants';
import CodeEditor from './components/CodeEditor';
import Preview from './components/Preview';
import AIAssistant from './components/AIAssistant';
import FileList from './components/FileList';
import AuthScreen from './components/AuthScreen';
import { Code2, Play, Sparkles, Menu, FolderOpen, PanelRightClose } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('mobilecoder_auth_key') === 'valid';
  });

  // Initialize files from LocalStorage or fallback
  const [files, setFiles] = useState<CodeFile[]>(() => {
    try {
      const savedFiles = localStorage.getItem('mobilecoder_files');
      if (savedFiles) {
        let parsed = JSON.parse(savedFiles);
        // Migration check: if old format (no type), add defaults
        if (parsed.length > 0 && !parsed[0].type) {
            parsed = parsed.map((f: any) => ({
                ...f,
                type: 'file',
                parentId: null
            }));
        }
        return parsed;
      }
    } catch (e) {
      console.error("Erro ao carregar arquivos:", e);
    }
    // Ensure initial files have type info if reloading from constant
    return INITIAL_FILES.map(f => ({ ...f, parentId: null, type: f.type || 'file' }));
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    const savedId = localStorage.getItem('mobilecoder_active_id');
    return savedId || files[0].id;
  });

  const [activeTab, setActiveTab] = useState<TabView>(TabView.EDITOR);
  const [showSidebar, setShowSidebar] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('mobilecoder_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('mobilecoder_active_id', activeFileId);
  }, [activeFileId]);

  // Mobile viewport fix
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  const handleFileChange = (newContent: string) => {
    setFiles(files.map(f => f.id === activeFileId ? { ...f, content: newContent } : f));
  };

  const handleDeleteFile = (id: string) => {
    // Recursive delete for folders
    const getIdsToDelete = (rootId: string): string[] => {
        const children = files.filter(f => f.parentId === rootId);
        let ids = [rootId];
        children.forEach(child => {
            ids = [...ids, ...getIdsToDelete(child.id)];
        });
        return ids;
    };

    const idsToDelete = getIdsToDelete(id);
    const newFiles = files.filter(f => !idsToDelete.includes(f.id));
    
    // Safety: If user deletes EVERYTHING, reset to a default state instead of blocking
    if (newFiles.length === 0) {
        const defaultFile: CodeFile = {
            id: Date.now().toString(),
            parentId: null,
            type: 'file',
            name: 'index.html',
            language: 'html',
            content: '<h1>Comece a Programar</h1>'
        };
        setFiles([defaultFile]);
        setActiveFileId(defaultFile.id);
        return;
    }

    setFiles(newFiles);
    
    // If active file was deleted, switch to the first available one
    if (idsToDelete.includes(activeFileId)) {
        const firstFile = newFiles.find(f => f.type === 'file');
        if (firstFile) {
            setActiveFileId(firstFile.id);
        } else {
             // If only folders remain, just select the first folder (though editor might be empty)
             // or try to find anything.
             if (newFiles.length > 0) {
                 setActiveFileId(newFiles[0].id);
             }
        }
    }
  };

  const checkDuplicate = (name: string, parentId: string | null) => {
      return files.some(f => f.name === name && f.parentId === parentId);
  };

  const handleAddFile = (name: string, parentId: string | null): boolean => {
    if (checkDuplicate(name, parentId)) {
      alert("Já existe um arquivo com esse nome nesta pasta.");
      return false;
    }
    
    const ext = name.split('.').pop()?.toLowerCase() || 'txt';
    let language = 'markdown';
    let initialContent = '';

    if (ext === 'js') {
      language = 'javascript';
      initialContent = '// Novo script\nconsole.log("Olá!");';
    }
    if (ext === 'html') {
      language = 'html';
      initialContent = '<!DOCTYPE html>\n<html>\n<body>\n  <h1>Nova Página</h1>\n</body>\n</html>';
    }
    if (ext === 'css') {
      language = 'css';
      initialContent = '/* Novos estilos */\nbody {\n  background: #000;\n}';
    }
    if (ext === 'json') {
      language = 'json';
      initialContent = '{}';
    }

    const newFile: CodeFile = {
      id: Date.now().toString(),
      parentId,
      type: 'file',
      name,
      language: language as any,
      content: initialContent
    };
    
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
    return true;
  };

  const handleAddFolder = (name: string, parentId: string | null): boolean => {
      if (checkDuplicate(name, parentId)) {
          alert("Já existe uma pasta com esse nome.");
          return false;
      }
      const newFolder: CodeFile = {
          id: Date.now().toString(),
          parentId,
          type: 'folder',
          name,
          language: 'markdown', // Irrelevant for folder
          content: '',
          isOpen: true
      };
      setFiles([...files, newFolder]);
      return true;
  };

  const handleUploadImage = (file: File, parentId: string | null) => {
      if (checkDuplicate(file.name, parentId)) {
          alert("Já existe um arquivo com este nome.");
          return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
              const newImage: CodeFile = {
                  id: Date.now().toString(),
                  parentId,
                  type: 'image',
                  name: file.name,
                  language: 'markdown', // Irrelevant
                  content: result, // Base64 string
              };
              setFiles(prev => [...prev, newImage]);
              setActiveFileId(newImage.id);
              if (window.innerWidth < 768) {
                  setShowSidebar(false);
              }
          }
      };
      reader.readAsDataURL(file);
  };

  const handleToggleFolder = (id: string) => {
      setFiles(files.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  };

  const handlePreviewNavigate = (path: string) => {
    // Attempt to match path to file name
    // Simplify: just look for the name for now, improving full path matching is complex without a full router
    const fileName = path.split('/').pop();
    const targetFile = files.find(f => f.name === fileName);
    if (targetFile) {
      setActiveFileId(targetFile.id);
    }
  };

  if (!isAuthenticated) {
    return <AuthScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex flex-col h-dvh bg-[#0f0f11] overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 bg-[#1e1e1e] border-b border-gray-800 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSidebar(true)} 
            className="p-2 hover:bg-gray-800 rounded-md text-gray-300 md:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Code2 className="text-blue-500" size={24} />
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              MobileCoder
            </h1>
          </div>
        </div>
        
        <div className="md:hidden text-xs text-gray-500 font-mono truncate max-w-[120px]">
          {activeFile.name}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar */}
        <aside 
          className={`
            fixed inset-y-0 left-0 z-40 w-72 bg-[#18181b] transform transition-transform duration-300 ease-in-out
            md:relative md:transform-none border-r border-gray-800
            ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${showSidebar ? 'shadow-2xl' : ''}
          `}
        >
          <FileList 
            files={files} 
            activeFileId={activeFileId} 
            onSelect={(id) => { setActiveFileId(id); setShowSidebar(false); setActiveTab(TabView.EDITOR); }}
            onDelete={handleDeleteFile}
            onCreateFile={handleAddFile}
            onCreateFolder={handleAddFolder}
            onUploadImage={handleUploadImage}
            onToggleFolder={handleToggleFolder}
            onClose={() => setShowSidebar(false)}
          />
        </aside>

        {showSidebar && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Editor Area */}
        <main className={`flex-1 relative bg-[#1e1e1e] ${activeTab !== TabView.EDITOR ? 'hidden md:block' : ''}`}>
           <CodeEditor file={activeFile} onChange={handleFileChange} />
        </main>

        {/* Preview Area */}
        <div className={`
          absolute inset-0 bg-white z-20 md:relative md:inset-auto md:w-1/2 lg:w-1/3 md:border-l md:border-gray-800
          ${activeTab === TabView.PREVIEW ? 'block' : 'hidden'}
        `}>
          <Preview 
            files={files} 
            active={activeTab === TabView.PREVIEW} 
            activeFileId={activeFileId} 
            onNavigate={handlePreviewNavigate}
          />
        </div>

        {/* AI Assistant */}
        <div className={`
          absolute inset-0 z-30 md:w-96 md:left-auto md:right-0 md:border-l md:border-gray-800 md:shadow-2xl
          ${activeTab === TabView.AI ? 'block' : 'hidden'}
        `}>
           <AIAssistant 
             currentFile={activeFile} 
             files={files} 
             onClose={() => setActiveTab(TabView.EDITOR)}
           />
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="h-16 bg-[#1e1e1e] border-t border-gray-800 flex justify-around items-center px-2 shrink-0 z-30 pb-safe">
        <button 
          onClick={() => { setActiveTab(TabView.EDITOR); setShowSidebar(true); }}
          className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-blue-400 md:hidden"
        >
          <FolderOpen size={20} />
          <span className="text-[10px]">Arquivos</span>
        </button>

        <button 
          onClick={() => setActiveTab(TabView.EDITOR)}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === TabView.EDITOR ? 'text-blue-400' : 'text-gray-400'}`}
        >
          <Code2 size={20} />
          <span className="text-[10px]">Código</span>
        </button>

        <button 
          onClick={() => setActiveTab(TabView.PREVIEW)}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === TabView.PREVIEW ? 'text-green-400' : 'text-gray-400'}`}
        >
          <Play size={20} />
          <span className="text-[10px]">Run</span>
        </button>

        <button 
          onClick={() => setActiveTab(TabView.AI)}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === TabView.AI ? 'text-purple-400' : 'text-gray-400'}`}
        >
          <Sparkles size={20} />
          <span className="text-[10px]">IA</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
