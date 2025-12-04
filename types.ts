
export type Language = 'html' | 'css' | 'javascript' | 'markdown' | 'json';

export type FileType = 'file' | 'folder' | 'image';

export interface CodeFile {
  id: string;
  parentId: string | null; // For hierarchy
  type: FileType;
  name: string;
  language: Language;
  content: string; // For images, this will be the base64 string
  isOpen?: boolean; // UI state for folders
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface AIConfig {
  name: string;
  avatarUrl: string;
  systemInstruction: string;
}

export enum TabView {
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW',
  AI = 'AI',
}
