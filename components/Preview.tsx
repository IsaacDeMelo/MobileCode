
import React, { useEffect, useState } from 'react';
import { CodeFile } from '../types';
import { RefreshCw } from 'lucide-react';

interface PreviewProps {
  files: CodeFile[];
  active: boolean;
  activeFileId: string;
  onNavigate?: (path: string) => void;
}

const Preview: React.FC<PreviewProps> = ({ files, active, activeFileId, onNavigate }) => {
  const [src, setSrc] = useState<string>('');
  const [key, setKey] = useState(0);

  // Handle messages from the iframe script
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PREVIEW_NAVIGATE') {
        if (onNavigate) {
          onNavigate(event.data.path);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onNavigate]);

  // Helper to build a map of full paths to file objects
  const buildFileMap = () => {
    const map: Record<string, CodeFile> = {};
    
    // Recursive function to get full path of a file
    const getFullPath = (file: CodeFile): string => {
        let path = file.name;
        let current = file;
        while (current.parentId) {
            const parent = files.find(f => f.id === current.parentId);
            if (parent) {
                path = `${parent.name}/${path}`;
                current = parent;
            } else {
                break;
            }
        }
        return path; // e.g., "css/style.css" or "index.html"
    };

    files.forEach(f => {
        const fullPath = getFullPath(f);
        map[fullPath] = f;
        map[`/${fullPath}`] = f; // Add leading slash version
        map[`./${fullPath}`] = f; // Add relative current version
    });
    
    return map;
  };

  useEffect(() => {
    if (!active) return;

    const fileMap = buildFileMap();
    const activeFile = files.find(f => f.id === activeFileId);
    
    // Determine entry point: either active HTML file or index.html
    let htmlFile: CodeFile | undefined;

    if (activeFile && activeFile.name.endsWith('.html') && activeFile.type === 'file') {
      htmlFile = activeFile;
    } else {
      // Look for index.html in root, then any html
      htmlFile = files.find(f => f.name === 'index.html' && f.parentId === null) || 
                 files.find(f => f.name.endsWith('.html') && f.type === 'file');
    }

    if (!htmlFile) {
      setSrc('data:text/html;charset=utf-8,<html><body style="background:#0f0f11;color:#666;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;"><div>Nenhum arquivo HTML para pré-visualizar.</div></body></html>');
      return;
    }

    let content = htmlFile.content;

    // 1. Resolve Link Tags (CSS)
    // Matches <link href="...">
    content = content.replace(/<link[^>]+href=["']([^"']+)["'][^>]*>/g, (match, href) => {
        const file = fileMap[href] || fileMap[`/${href}`];
        if (file && file.type === 'file' && file.name.endsWith('.css')) {
            return `<style>${file.content}</style>`;
        }
        return match;
    });

    // 2. Resolve Script Tags (JS)
    // Matches <script src="...">
    content = content.replace(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/g, (match, src) => {
        const file = fileMap[src] || fileMap[`/${src}`];
        if (file && file.type === 'file' && file.name.endsWith('.js')) {
            return `<script>${file.content}</script>`;
        }
        return match;
    });

    // 3. Resolve Image Tags
    // Matches <img src="...">
    content = content.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/g, (match, src) => {
        const file = fileMap[src] || fileMap[`/${src}`];
        if (file && file.type === 'image') {
            // Replace the src path with the base64 content
            return match.replace(src, file.content);
        }
        return match;
    });

    // 4. Inject Navigation Interceptor Script
    const navigationScript = `
      <script>
        document.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (link) {
            const href = link.getAttribute('href');
            if (!href) return;
            if (href.startsWith('#') || href.startsWith('javascript:')) return;
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
              e.preventDefault();
              window.open(href, '_blank');
              return;
            }
            e.preventDefault();
            window.parent.postMessage({ type: 'PREVIEW_NAVIGATE', path: href }, '*');
          }
        });
      </script>
    `;
    
    if (content.includes('</body>')) {
      content = content.replace('</body>', `${navigationScript}</body>`);
    } else {
      content += navigationScript;
    }

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setSrc(url);

    return () => URL.revokeObjectURL(url);
  }, [files, active, key, activeFileId]);

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  if (!active) return null;

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={handleRefresh}
          className="p-2 bg-gray-900/80 rounded-full text-white hover:bg-black backdrop-blur-sm transition-all shadow-lg"
        >
          <RefreshCw size={20} />
        </button>
      </div>
      <iframe 
        title="preview"
        src={src}
        className="flex-1 w-full h-full border-none bg-white"
        sandbox="allow-scripts allow-modals allow-forms allow-popups"
      />
    </div>
  );
};

export default Preview;
