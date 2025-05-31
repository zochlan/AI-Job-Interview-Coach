/**
 * Groq API Utilities
 *
 * This module provides functions for interacting with the Groq API through the Flask backend.
 */

import axios from 'axios';
import { ChatMessage } from '../types/chatTypes';
import { mapCategoryToQuestionType } from './questionTypeUtils';

// Base URL for API requests
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Type definitions for API responses
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ApiResponse<T> {
  success: boolean;
  error?: string;
  metadata?: {
    model: string;
    timestamp: string;
    question_type?: string;
    context_size?: number;
    [key: string]: any; // Allow for additional metadata properties
  };
}

interface QuestionResponse extends ApiResponse<string> {
  question: string;
}

interface AnalysisResponse extends ApiResponse<any> {
  analysis: {
    completeness: 'complete' | 'partial' | 'incomplete';
    confidence: 'high' | 'medium' | 'low';
    strengths: string[];
    weaknesses: string[];
    improvement_tips: string[];
    star_rating: number;
    key_topics?: string[];
    follow_up_suggestions?: string[];
    is_behavioral_question?: boolean;
    analysis_timestamp?: string;
    star_analysis?: {
      situation?: { present: boolean; score: number; feedback: string };
      task?: { present: boolean; score: number; feedback: string };
      action?: { present: boolean; score: number; feedback: string };
      result?: { present: boolean; score: number; feedback: string };
    };
    [key: string]: any; // Allow for additional analysis properties
  };
}

interface ChatResponse extends ApiResponse<string> {
  response: string;
}

interface ModelsResponse extends ApiResponse<string[]> {
  models: string[];
  default_model: string;
}

/**
 * Generate an interview question using Groq API
 *
 * @param previousMessages Previous chat messages for context
 * @param cvData CV analysis data for personalization
 * @param model Optional model to use
 * @param isNewSession Whether this is a new session or continuing an existing one
 * @returns Generated question with metadata
 */
export const generateQuestion = async (
  previousMessages: ChatMessage[],
  cvData: any = null,
  model?: string,
  isNewSession: boolean = false
): Promise<any> => {
  try {
    // Determine the current interview stage based on message count
    const messageCount = previousMessages.length;
    let stage = "initial";
    let difficulty = "medium";

    if (messageCount === 0) {
      stage = "initial";
      difficulty = "easy";
    } else if (messageCount < 6) {
      stage = "early";
      difficulty = "easy";
    } else if (messageCount < 14) {
      stage = "middle";
      difficulty = "medium";
    } else if (messageCount < 24) {
      stage = "late";
      difficulty = "medium";
    } else {
      stage = "closing";
      difficulty = "hard";
    }

    console.log(`Current interview stage: ${stage} (message count: ${messageCount})`);

    // Extract previous questions and answers for context
    // Get the last 5 questions to provide sufficient context without overwhelming the API
    const previousQuestions = previousMessages
      .filter(msg => msg.id === 1)
      .slice(-5)  // Get only the last 5 questions for better context
      .map(msg => msg.message);

    // Get the last 5 answers to match the questions
    const previousAnswers = previousMessages
      .filter(msg => msg.id === 0)
      .slice(-5)  // Get only the last 5 answers
      .map(msg => msg.message);

    // Log the context being sent to the API
    console.log('Sending context to API:', {
      stage,
      difficulty,
      questionCount: previousQuestions.length,
      answerCount: previousAnswers.length
    });

    // Extract job role from CV data or previous answers
    let jobRole = 'general professional';

    // Log CV data for debugging
    console.log('CV Data in generateQuestion:', cvData);

    // First try to get job role from CV data
    if (cvData?.jobRole) {
      jobRole = cvData.jobRole;
      console.log('Using jobRole from CV data:', jobRole);
    } else if (cvData?.target_job) {
      jobRole = cvData.target_job;
      console.log('Using target_job from CV data:', jobRole);
    } else if (cvData?.experience) {
      // Try to extract job role from experience
      jobRole = typeof cvData.experience === 'string'
        ? cvData.experience.split(' ')[0] // Take first word of experience string
        : Array.isArray(cvData.experience) && cvData.experience.length > 0
          ? cvData.experience[0]
          : 'general professional';
      console.log('Extracted job role from experience:', jobRole);
    } else {
      console.log('No job role found in CV data, using default:', jobRole);
    }

    // If we still don't have a job role, try to extract it from previous answers
    if (jobRole === 'general professional' && previousAnswers.length > 0) {
      const firstAnswer = previousAnswers[0].toLowerCase();

      // Check for common job roles in the first answer
      const jobRoles = [
        'retail', 'manager', 'sales', 'marketing', 'engineer', 'developer',
        'analyst', 'consultant', 'designer', 'teacher', 'doctor', 'nurse',
        'accountant', 'finance', 'hr', 'customer service', 'project manager'
      ];

      for (const role of jobRoles) {
        if (firstAnswer.includes(role)) {
          jobRole = role;
          break;
        }
      }
    }

    console.log('Using job role for question generation:', jobRole);

    // Analyze previous answers for adaptive questioning
    let adaptiveContext = null;
    if (previousAnswers.length > 0) {
      const lastAnswer = previousAnswers[previousAnswers.length - 1].toLowerCase();

      // Check for key themes in the last answer
      const themes = {
        achievement: ['achieve', 'success', 'accomplish', 'proud', 'impact', 'result'],
        challenge: ['challenge', 'difficult', 'problem', 'obstacle', 'struggle', 'overcome'],
        teamwork: ['team', 'colleague', 'collaborate', 'group', 'work together', 'coordination'],
        leadership: ['lead', 'manage', 'direct', 'supervise', 'guide', 'responsibility'],
        technical: ['technical', 'technology', 'software', 'system', 'code', 'develop', 'implement'],
        communication: ['communicate', 'present', 'explain', 'discuss', 'meeting', 'client']
      };

      // Identify themes present in the answer
      const detectedThemes = Object.entries(themes)
        .filter(([_, keywords]) => keywords.some(keyword => lastAnswer.includes(keyword)))
        .map(([theme]) => theme);

      if (detectedThemes.length > 0) {
        adaptiveContext = {
          themes: detectedThemes,
          answerLength: lastAnswer.split(' ').length,
          needsElaboration: lastAnswer.split(' ').length < 30
        };
        console.log('Adaptive context:', adaptiveContext);
      }
    }

    // Create a modified CV data object with explicit job role and adaptive context
    const enhancedCvData = {
      ...cvData,
      jobRole: jobRole,  // Ensure job role is explicitly set in CV data
      adaptiveContext: adaptiveContext, // Add adaptive context if available
      interviewStage: stage, // Add current interview stage
      questionDifficulty: difficulty // Add question difficulty
    };

    console.log('Enhanced CV data with context:', enhancedCvData);

    // Add a unique identifier to prevent duplicate questions and ensure variety
    // Include multiple random components to maximize entropy and question variety
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const additionalEntropy = Math.floor(Math.random() * 1000000);
    const uniqueId = `${timestamp}-${randomString}-${additionalEntropy}`;

    // Add cache-busting parameters to prevent any caching of questions
    const cacheBuster = {
      timestamp: timestamp,
      random: Math.random(),
      sessionRandom: sessionStorage.getItem('interviewSessionRandom') || Math.random().toString()
    };

    // Store a random value in session storage to ensure different questions across sessions
    if (!sessionStorage.getItem('interviewSessionRandom')) {
      sessionStorage.setItem('interviewSessionRandom', Math.random().toString());
    }

    // Check if this is a new session from sessionStorage
    const isNewSessionFromStorage = sessionStorage.getItem('isNewSession') === 'true';

    // If isNewSession is true from parameter or storage, ensure we're using the initial stage
    const finalIsNewSession = isNewSession || isNewSessionFromStorage;
    const finalStage = finalIsNewSession ? 'initial' : stage;

    console.log(`Question generation - isNewSession: ${finalIsNewSession}, stage: ${finalStage}`);

    // Create question metadata with isNewSession flag
    const questionMetadata = {
      isNewSession: finalIsNewSession,
      interviewStage: finalStage,
      id: `question-${Date.now()}`,
      category: mapCategoryToQuestionType(finalStage), // Use the utility function to map stage to category
      difficulty: difficulty || 'medium'
    };

    // Clear the new session flag after using it
    if (isNewSessionFromStorage) {
      sessionStorage.removeItem('isNewSession');
    }

    // Make API request with cache-busting parameters
    const response = await api.post<QuestionResponse>('/groq/question', {
      jobRole: jobRole,
      previousQuestions,
      previousAnswers,
      cvData: enhancedCvData,  // Use enhanced CV data
      model,
      isNewSession: finalIsNewSession, // Use the combined new session flag
      uniqueId, // Add a unique identifier to prevent caching/duplicates
      stage: finalStage, // Use the appropriate stage based on session state
      difficulty, // Add question difficulty
      cacheBuster, // Add cache-busting parameters
      varietyBoost: Math.random(), // Additional randomness to ensure variety
      sessionId: sessionStorage.getItem('currentSessionId') || 'new-session', // Track session for variety
      questionCount: previousQuestions.length, // Track question count for variety
      forceInitialQuestion: finalIsNewSession, // Add explicit flag to force initial question
      questionMetadata // Pass the question metadata to the backend
    });

    const data = response.data as QuestionResponse;

    if (data.success) {
      // Additional frontend cleanup for any meta-commentary that might have slipped through
      let cleanedQuestion = data.question;

      // Remove common meta-commentary prefixes
      const prefixes = [
        "here's a conversational opening question",
        "here's a natural",
        "here is a natural",
        "here's a",
        "here is a",
        "this is a"
      ];

      for (const prefix of prefixes) {
        if (cleanedQuestion.toLowerCase().startsWith(prefix)) {
          // Look for transition words after the prefix
          const restOfText = cleanedQuestion.substring(prefix.length).trim();
          const transitionMatch = restOfText.match(/^(?:that|which|:)\s+(.*)/i);

          if (transitionMatch) {
            cleanedQuestion = transitionMatch[1];
            console.log(`Frontend removed meta-commentary: "${prefix}..."`);
          } else {
            cleanedQuestion = restOfText;
            console.log(`Frontend removed prefix: "${prefix}"`);
          }

          // Capitalize first letter if needed
          if (cleanedQuestion && !cleanedQuestion.match(/^[A-Z]/)) {
            cleanedQuestion = cleanedQuestion.charAt(0).toUpperCase() + cleanedQuestion.slice(1);
          }

          break;
        }
      }

      // Check for meta-commentary phrases embedded in the question
      const metaPhrases = [
        "as a first question",
        "to start our interview",
        "to begin our conversation",
        "to get started",
        "to establish rapport",
        "to set the tone"
      ];

      for (const phrase of metaPhrases) {
        if (cleanedQuestion.toLowerCase().includes(phrase)) {
          const parts = cleanedQuestion.split(new RegExp(phrase, 'i'));
          if (parts.length > 1 && parts[1].trim().length > 20) {
            cleanedQuestion = parts[1].trim();
            // Capitalize first letter
            cleanedQuestion = cleanedQuestion.charAt(0).toUpperCase() + cleanedQuestion.slice(1);
            console.log(`Frontend removed embedded meta-commentary: "${phrase}"`);
            break;
          }
        }
      }

      return {
        text: cleanedQuestion,
        id: `question-${Date.now()}`,
        category: stage, // Use the stage as the category
        difficulty: difficulty, // Use the determined difficulty
        isAIGenerated: true
      };
    } else {
      throw new Error(data.error || 'Failed to generate question');
    }
  } catch (error) {
    console.error('Error generating question:', error);

    // Provide a fallback question if API fails
    const fallbackQuestions = [
      "Could you tell me about a challenging project you've worked on recently?",
      "What aspects of your work do you find most fulfilling?",
      "How do you approach learning new skills in your field?",
      "Can you describe a situation where you had to adapt quickly to a change?",
      "What do you consider to be your greatest professional achievement so far?"
    ];

    return {
      text: fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)],
      id: `fallback-${Date.now()}`,
      category: 'general',
      difficulty: 'medium',
      isAIGenerated: false
    };
  }
};

/**
 * Analyze a candidate's response using Groq API with STAR framework
 *
 * @param question The interview question
 * @param answer The candidate's answer
 * @param previousMessages Previous chat messages for context
 * @returns Enhanced analysis of the response with STAR framework
 */
export const analyzeResponse = async (
  question: string,
  answer: string,
  model?: string,
  previousMessages: ChatMessage[] = []
): Promise<any> => {
  try {
    // Extract previous questions and answers for context
    const previousQuestions = previousMessages
      .filter(msg => msg.id === 1)
      .slice(-3)  // Get only the last 3 questions for context
      .map(msg => msg.message);

    const previousAnswers = previousMessages
      .filter(msg => msg.id === 0)
      .slice(-3)  // Get only the last 3 answers for context
      .map(msg => msg.message);

    console.log('Sending context for analysis:', {
      questionCount: previousQuestions.length,
      answerCount: previousAnswers.length
    });

    const response = await api.post<AnalysisResponse>('/groq/analyze', {
      question,
      answer,
      model,
      previousQuestions,
      previousAnswers
    });

    const data = response.data as AnalysisResponse;

    if (data.success) {
      // Log analysis metadata for debugging
      console.log('Analysis metadata:', data.metadata);

      // Check if this is a behavioral question that should use STAR framework
      const isBehavioral = data.analysis.is_behavioral_question ||
        data.metadata?.question_type === 'behavioral';

      console.log(`Question type: ${isBehavioral ? 'Behavioral' : 'General'}`);

      // Return the enhanced analysis
      return {
        ...data.analysis,
        questionType: isBehavioral ? 'behavioral' : 'general',
        analysisTimestamp: data.metadata?.timestamp || new Date().toISOString()
      };
    } else {
      throw new Error(data.error || 'Failed to analyze response');
    }
  } catch (error) {
    console.error('Error analyzing response:', error);

    // Determine if this is likely a behavioral question
    const isBehavioral = question.toLowerCase().includes('tell me about a time') ||
      question.toLowerCase().includes('describe a situation') ||
      question.toLowerCase().includes('give an example');

    // Return a default analysis if the API call fails
    return {
      completeness: "partial",
      confidence: "medium",
      strengths: ["Unable to analyze properly"],
      weaknesses: ["Unable to analyze properly"],
      improvement_tips: ["Try to be more specific and structured in your answer"],
      star_rating: 3,
      key_topics: [],
      follow_up_suggestions: ["Could you elaborate more on your experience?"],
      questionType: isBehavioral ? 'behavioral' : 'general',
      analysisTimestamp: new Date().toISOString(),
      is_behavioral_question: isBehavioral
    };
  }
};

/**
 * Send a chat message and get a response using Groq API
 *
 * @param message User message
 * @param context Previous messages for context
 * @returns AI response
 */
export const sendChatMessage = async (
  message: string,
  context: { role: string, content: string }[] = []
): Promise<string> => {
  try {
    const response = await api.post<ChatResponse>('/groq/chat', {
      message,
      context
    });

    const data = response.data as ChatResponse;

    if (data.success) {
      return data.response;
    } else {
      throw new Error(data.error || 'Failed to get chat response');
    }
  } catch (error) {
    console.error('Error in chat:', error);
    throw new Error('Failed to get chat response');
  }
};

/**
 * Get available Groq models
 *
 * @returns List of available models and default model
 */
export const getAvailableModels = async (): Promise<{
  models: string[],
  default_model: string
}> => {
  try {
    const response = await api.get<ModelsResponse>('/groq/models');

    const data = response.data as ModelsResponse;

    if (data.success) {
      return {
        models: data.models,
        default_model: data.default_model
      };
    } else {
      throw new Error(data.error || 'Failed to get available models');
    }
  } catch (error) {
    console.error('Error getting available models:', error);
    // Return a default list if the API call fails
    return {
      models: [
        // Groq models
        "llama3-8b-8192",
        "llama3-70b-8192",
        "mixtral-8x7b-32768",
        "gemma-7b-it",
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307"
      ],
      default_model: "llama3-8b-8192" // Default to Llama 3 8B
    };
  }
};

// Create a named export object to satisfy ESLint
const groqApiExports = {
  generateQuestion,
  analyzeResponse,
  sendChatMessage,
  getAvailableModels
};

export default groqApiExports;
