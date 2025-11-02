export enum Sender {
  User = 'user',
  Model = 'model',
  System = 'system',
  Reasoning = 'reasoning',
}

export interface ChatMessage {
  sender: Sender;
  message: string;
}

export type FileName = 'index.html' | 'styles.css' | 'script.js';

export interface SnipOptions {
  viewport?: { width: number; height: number };
  scrollPercent?: number;
  selector?: string;
}

export interface Command {
    name: 'edit' | 'replace_lines' | 'chat' | 'reasoning' | 'insert_content' | 'delete_lines' | 'snip';
    fileName?: FileName;
    lineNumber?: number;
    startLine?: number;
    endLine?: number;
    content: string;
    snipOptions?: SnipOptions;
}

export interface ParsedResponse {
    commands: Command[];
    recursionExpected: boolean;
}
