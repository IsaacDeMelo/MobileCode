
import React, { useState } from 'react';
import { CodeFile } from '../types';
import { FileCode2, FileJson, FileType, Plus, Trash2, Check, X, Folder, FolderOpen, ChevronRight, ChevronDown, Image as ImageIcon, Upload } from 'lucide-react';

interface FileListProps {
  files: CodeFile[];
  activeFileId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateFile: (name: string, parentId: string | null) => boolean;
  onCreateFolder: (name: string, parentId: string | null) => boolean;
  onUploadImage: (file: File, parentId: string | null) => void;
  onToggleFolder: (id: string) => void;
}

const FileList: React.FC<FileListProps> = ({ 
  files, 
  activeFileId, 
  onSelect, 
  onDelete, 
  onCreateFile,
  onCreateFolder,
  onUploadImage,
  onToggleFolder
}) => {
  const [creationState, setCreationState] = useState<{
    type: 'file' | 'folder' | null;
    parentId: string | null;
  }>({ type: null, parentId: null });
  
  const [newItemName, setNewItemName] = useState('');

  // Handle Image Upload Input Ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  const startCreating = (type: 'file' | 'folder', parentId: string | null) => {
    setCreationState({ type, parentId });
    setNewItemName('');
  };

  const cancelCreating = () => {
    setCreationState({ type: null, parentId: null });
    setNewItemName('');
  };

  const handleCreate = () => {
    if (!newItemName.trim() || !creationState.type) return;

    let success = false;
    if (creationState.type === 'file') {
      success = onCreateFile(newItemName, creationState.parentId);
    } else {
      success = onCreateFolder(newItemName, creationState.parentId);
    }

    if (success) cancelCreating();
  };

  const triggerImageUpload = (parentId: string | null) => {
    setUploadTargetId(parentId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0], uploadTargetId);
    }
    setUploadTargetId(null);
  };

  const getIcon = (file: CodeFile) => {
    if (file.type === 'folder') return file.isOpen ? <FolderOpen size={18} className="text-yellow-500" /> : <Folder size={18} className="text-yellow-500" />;
    if (file.type === 'image') return <ImageIcon size={18} className="text-purple-400" />;
    
    const name = file.name;
    if (name.endsWith('.html')) return <FileCode2 size={18} className="text-orange-500" />;
    if (name.endsWith('.css')) return <FileType size={18} className="text-blue-400" />;
    if (name.endsWith('.js')) return <FileCode2 size={18} className="text-yellow-400" />;
    if (name.endsWith('.json')) return <FileJson size={18} className="text-green-400" />;
    return <FileType size={18} className="text-gray-400" />;
  };

  // Recursive render function
  const renderTree = (parentId: string | null, depth: number = 0) => {
    const items = files.filter(f => f.parentId === parentId);
    
    // Sort: Folders first, then files, alphabetical
    items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });

    return (
      <>
        {items.map(file => (
          <React.Fragment key={file.id}>
            <div
              onClick={() => {
                if (file.type === 'folder') {
                  onToggleFolder(file.id);
                } else {
                  onSelect(file.id);
                }
              }}
              className={`
                group flex items-center justify-between py-3 pr-2 rounded-md cursor-pointer mb-0.5 transition-all select-none
                ${activeFileId === file.id ? 'bg-blue-600/20 text-blue-100' : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'}
              `}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                {file.type === 'folder' && (
                  <span className="opacity-70 p-0.5">
                    {file.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                )}
                {getIcon(file)}
                <span className="text-sm truncate">{file.name}</span>
              </div>
              
              {/* Actions - ALWAYS VISIBLE now */}
              <div className="flex items-center gap-2 opacity-100">
                {file.type === 'folder' && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); startCreating('file', file.id); }}
                      className="p-1.5 hover:bg-gray-700 rounded text-gray-500 hover:text-white"
                      title="Novo Arquivo"
                    >
                      <Plus size={14} />
                    </button>
                     <button 
                      onClick={(e) => { e.stopPropagation(); startCreating('folder', file.id); }}
                      className="p-1.5 hover:bg-gray-700 rounded text-gray-500 hover:text-white"
                      title="Nova Pasta"
                    >
                      <Folder size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); triggerImageUpload(file.id); }}
                      className="p-1.5 hover:bg-gray-700 rounded text-gray-500 hover:text-white"
                      title="Upload Imagem"
                    >
                      <Upload size={14} />
                    </button>
                  </>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
                  className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded text-gray-500"
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Render Children if open */}
            {file.type === 'folder' && file.isOpen && renderTree(file.id, depth + 1)}
            
            {/* Render Creation Input inside folder */}
            {creationState.parentId === file.id && (
              <div style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }} className="pr-2 py-1">
                 {renderCreationForm()}
              </div>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  const renderCreationForm = () => (
    <div className="flex items-center p-1.5 bg-gray-800 rounded border border-blue-500/50 animate-in fade-in zoom-in-95 duration-200">
      {creationState.type === 'folder' ? <Folder size={16} className="text-yellow-500 mr-2" /> : <FileCode2 size={16} className="text-gray-400 mr-2" />}
      <input 
          autoFocus
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={creationState.type === 'folder' ? "Nome da pasta" : "nome.ext"}
          className="bg-transparent border-none outline-none text-white text-sm w-full min-w-0 placeholder:text-gray-600"
          onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') cancelCreating();
          }}
      />
      <div className="flex items-center gap-1 ml-1">
          <button onClick={handleCreate} className="p-0.5 text-green-400 hover:bg-green-400/20 rounded">
              <Check size={14} />
          </button>
          <button onClick={cancelCreating} className="p-0.5 text-red-400 hover:bg-red-400/20 rounded">
              <X size={14} />
          </button>
      </div>
   </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#18181b] text-white">
      {/* Hidden File Input for Uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />

      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1e1e1e]">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Arquivos</h2>
        <div className="flex gap-1">
            <button onClick={() => triggerImageUpload(null)} className="p-1.5 hover:bg-gray-700 rounded transition-colors" title="Upload Imagem">
                <Upload size={16} className="text-gray-300" />
            </button>
            <button onClick={() => startCreating('folder', null)} className="p-1.5 hover:bg-gray-700 rounded transition-colors" title="Nova Pasta">
                <Folder size={16} className="text-gray-300" />
            </button>
            <button onClick={() => startCreating('file', null)} className="p-1.5 hover:bg-gray-700 rounded transition-colors" title="Novo Arquivo">
                <Plus size={16} className="text-gray-300" />
            </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pt-2 pb-4">
        {/* Creation at Root */}
        {creationState.parentId === null && creationState.type && (
             <div className="px-2 mb-2">
                {renderCreationForm()}
             </div>
        )}
        
        {renderTree(null)}

        {files.length === 0 && (
          <div className="p-4 text-center text-gray-600 text-xs">
            Nenhum arquivo. Crie um para começar.
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-800 bg-[#1e1e1e]/50">
        <p className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
          Feito por <span className="text-purple-400 font-medium">Honorato</span>
        </p>
      </div>
    </div>
  );
};

export default FileList;
