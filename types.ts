
export interface Message {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: Date;
  isComplete: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface AudioConfig {
  inputSampleRate: number;
  outputSampleRate: number;
}
