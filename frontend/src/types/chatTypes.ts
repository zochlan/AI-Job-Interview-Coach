// Chat message interface
export interface ChatMessage {
  id: number; // 0 for user, 1 for bot
  message: string;
  timestamp: string;
  analysis?: string;
  strengths?: string[];
  improvement_tips?: string[];
  star_scores?: { [key: string]: number };
  overall_score?: number | null;
  star?: Record<string, any>;
  star_score?: number | null;
  soft_skills?: Record<string, number>;
  technical_depth?: Record<string, number>;
  key_points?: string[];
  llm_feedback?: string;
  sentiment?: number | null;
  professional_tone?: number | null;
  clarity?: number | null;
  completeness_score?: number | null;
  showFeedback?: boolean; // Track if feedback is shown
  isInterviewQuestion?: boolean; // Flag to indicate if this is an interview question vs coaching feedback
  isError?: boolean; // Flag to indicate if this message is an error message
  isTimeout?: boolean; // Flag to indicate if this message is a timeout error
  originalMessage?: string; // Original message for retry functionality
  key_topics?: string[]; // Key topics mentioned in the message for adaptive questioning
  follow_up_suggestions?: string[]; // Suggested follow-up questions
  questionType?: 'behavioral' | 'technical' | 'situational' | 'general' | 'introductory' | 'closing'; // Type of question for STAR analysis
  analysisTimestamp?: string; // When the analysis was performed
  is_behavioral_question?: boolean; // Whether this is a behavioral question
  star_analysis?: { // STAR framework analysis
    situation?: { present: boolean; score: number; feedback: string };
    task?: { present: boolean; score: number; feedback: string };
    action?: { present: boolean; score: number; feedback: string };
    result?: { present: boolean; score: number; feedback: string };
  };
  questionMetadata?: { // Metadata about the question for structured interviews
    id: string;
    category: string;
    difficulty: string;
    isAIGenerated?: boolean;
    interviewStage?: string; // Current interview stage (initial, early, middle, late, closing)
    adaptiveContext?: { // Context for adaptive questioning
      themes?: string[]; // Detected themes in previous answers
      answerLength?: number; // Length of previous answer
      needsElaboration?: boolean; // Whether the previous answer needs elaboration
    };
    [key: string]: any; // Allow additional properties
  }
}

// Bot response interface
export interface BotResponse {
  reply: string;
  analysis?: string;
  strengths?: string[];
  improvement_tips?: string[];
  star_scores?: { [key: string]: number };
  overall_score?: number | null;
  star?: Record<string, any>;
  star_score?: number | null;
  soft_skills?: Record<string, number>;
  technical_depth?: Record<string, number>;
  key_points?: string[];
  llm_feedback?: string;
  sentiment?: number | null;
  professional_tone?: number | null;
  clarity?: number | null;
  completeness_score?: number | null;
}
