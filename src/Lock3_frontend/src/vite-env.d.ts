/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DFX_NETWORK: string;
  readonly CANISTER_ID_LOCK3_BACKEND: string;
  readonly CANISTER_ID_LOCK3_FRONTEND: string;
  readonly CANISTER_CANDID_PATH_LOCK3_BACKEND: string;
  readonly CANISTER_CANDID_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

declare interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

declare interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

declare interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

declare interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

declare interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

// HTMLNavElement exists in newer TypeScript versions
declare global {
  interface HTMLNavElement extends HTMLElement {
    // Add any specific nav element properties if needed
  }
}
