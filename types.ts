
import type { Content, GenerateContentResponse } from '@google/genai';

export enum Sender {
  User = 'user',
  Model = 'model',
  System = 'system',
  Reasoning = 'reasoning',
}

export interface ChatMessage {
  sender: Sender;
  message: string;
  commands?: Command[];
}

export type FileName = 'index.html' | 'styles.css' | 'script.js';

export interface Command {
    name: 'edit' | 'chat' | 'reasoning' | 'task_completed' | 'inline_edit' | 'title';
    fileName?: FileName;
    lineNumber?: number;
    content: string;
    isTerminated?: boolean; // Flag to indicate if the command block was closed with $$$
}

export interface ParsedResponse {
    commands: Command[];
}

// FIX: Add missing SnipOptions type definition for the SnipModal component.
export interface SnipOptions {
    viewport: {
        width: number;
        height: number;
    };
    scrollPercent?: number;
}

// Fix: Define StreamGenerateContentResult to provide proper typing for streaming responses from the Gemini API.
// The SDK's generateContentStream returns an async iterable of response chunks.
export type StreamGenerateContentResult = AsyncIterable<GenerateContentResponse>;


export type ModelId = 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'gemini-flash-latest' | 'gemini-flash-lite-latest';

export interface Model {
  id: ModelId;
  name: string;
}

export interface LogEntry {
  command: string;
  status: 'success' | 'failure';
  message: string;
}

export interface TurnLog {
  turnNumber: number;
  rawOutput: string;
  logs: LogEntry[];
}

export interface Applet {
    id: string;
    name: string;
    html: string;
    css: string;
    js: string;
    chatHistory: ChatMessage[];
    modelHistory: Content[];
    fullLogHistory: TurnLog[];
}