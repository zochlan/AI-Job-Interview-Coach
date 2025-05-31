/**
 * Interface for chat message data structure
 */
export interface ChatMessage {
  id: number; // 0 for user messages, 1 for bot messages
  message: string;
  timestamp: string;
  showFeedback?: boolean;
  feedback?: string;
  isInterviewQuestion?: boolean;
  questionMetadata?: {
    id: string;
    category: string;
    difficulty: string;
  };
}

/**
 * Interface for session data structure
 */
export interface Session {
  id: string;
  sessionType: 'interview' | 'coach';
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  title?: string;
}
