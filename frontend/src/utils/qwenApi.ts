/**
 * QWEN API Utilities
 *
 * This module provides functions for interacting with the QWEN API through the Flask backend.
 */

import axios from 'axios';
import { ChatMessage } from '../types/chatTypes';

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
 * Generate an interview question using QWEN API
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

    // Create a modified CV data object with explicit job role
    const enhancedCvData = {
      ...cvData,
      jobRole: jobRole  // Ensure job role is explicitly set in CV data
    };

    console.log('Enhanced CV data with explicit job role:', enhancedCvData);

    // Add a unique identifier to prevent duplicate questions
    // Include a random component to ensure uniqueness even if multiple calls happen in the same millisecond
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    // Make API request
    const response = await api.post<QuestionResponse>('/qwen/question', {
      jobRole: jobRole,
      previousQuestions,
      previousAnswers,
      cvData: enhancedCvData,  // Use enhanced CV data
      model,
      isNewSession, // Add the session state information
      uniqueId // Add a unique identifier to prevent caching/duplicates
    });

    const data = response.data as QuestionResponse;

    if (data.success) {
      return {
        text: data.question,
        id: `question-${Date.now()}`,
        category: 'interview',
        difficulty: 'medium',
        isAIGenerated: true
      };
    } else {
      throw new Error(data.error || 'Failed to generate question');
    }
  } catch (error) {
    console.error('Error generating question:', error);
    throw new Error('Failed to generate interview question');
  }
};

/**
 * Analyze a candidate's response using QWEN API
 *
 * @param question The interview question
 * @param answer The candidate's answer
 * @returns Analysis of the response
 */
export const analyzeResponse = async (
  question: string,
  answer: string,
  model?: string
): Promise<any> => {
  try {
    const response = await api.post<AnalysisResponse>('/qwen/analyze', {
      question,
      answer,
      model
    });

    const data = response.data as AnalysisResponse;

    if (data.success) {
      return data.analysis;
    } else {
      throw new Error(data.error || 'Failed to analyze response');
    }
  } catch (error) {
    console.error('Error analyzing response:', error);
    // Return a default analysis if the API call fails
    return {
      completeness: "partial",
      confidence: "medium",
      strengths: ["Unable to analyze properly"],
      weaknesses: ["Unable to analyze properly"],
      improvement_tips: ["Try to be more specific and structured in your answer"],
      star_rating: 3
    };
  }
};

/**
 * Send a chat message and get a response using QWEN API
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
    const response = await api.post<ChatResponse>('/qwen/chat', {
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
 * Get available QWEN models
 *
 * @returns List of available models and default model
 */
export const getAvailableModels = async (): Promise<{
  models: string[],
  default_model: string
}> => {
  try {
    const response = await api.get<ModelsResponse>('/qwen/models');

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
        // QWEN models
        "qwen2-7b-instruct",
        "qwen2-72b-instruct",
        "qwen2-1.5b-instruct",
        "qwen2.5-7b-instruct",
        "qwen2.5-32b-instruct",
        "qwen2.5-72b-instruct"
      ],
      default_model: "qwen2-7b-instruct" // Default to QWEN 2 7B Instruct
    };
  }
};

// Create a named export object to satisfy ESLint
const qwenApiExports = {
  generateQuestion,
  analyzeResponse,
  sendChatMessage,
  getAvailableModels
};

export default qwenApiExports;
