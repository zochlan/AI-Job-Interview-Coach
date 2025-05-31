/**
 * API Utilities
 *
 * This module provides functions for interacting with the backend API.
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
interface QuestionResponse {
  success: boolean;
  question: string;
  metadata?: {
    model: string;
    timestamp: string;
  };
}

interface AnalysisResponse {
  success: boolean;
  analysis: {
    completeness: 'complete' | 'partial' | 'incomplete';
    confidence: 'high' | 'medium' | 'low';
    strengths: string[];
    weaknesses: string[];
    improvement_tips: string[];
    star_rating: number;
  };
  metadata?: {
    model: string;
    timestamp: string;
  };
}

interface ChatResponse {
  success: boolean;
  response: string;
  metadata?: {
    model: string;
    timestamp: string;
  };
}

/**
 * Generate an interview question
 *
 * @param previousMessages Previous chat messages for context
 * @param cvData CV analysis data for personalization
 * @returns Generated question with metadata
 */
export const generateQuestion = async (
  previousMessages: ChatMessage[],
  cvData: any = null
): Promise<any> => {
  try {
    // Extract previous questions and answers for context
    const previousQuestions = previousMessages
      .filter(msg => msg.id === 1)
      .map(msg => msg.message);

    const previousAnswers = previousMessages
      .filter(msg => msg.id === 0)
      .map(msg => msg.message);

    // Make API request
    const response = await api.post<QuestionResponse>('/interview/question', {
      jobRole: cvData?.jobRole || 'software developer',
      previousQuestions,
      previousAnswers,
      cvData
    });

    const data = response.data as QuestionResponse;

    return {
      text: data.question,
      id: `question-${Date.now()}`,
      category: 'interview',
      difficulty: 'medium',
      isAIGenerated: true
    };
  } catch (error) {
    console.error('Error generating question:', error);
    throw new Error('Failed to generate interview question');
  }
};

/**
 * Analyze a candidate's response
 *
 * @param question The interview question
 * @param answer The candidate's answer
 * @returns Analysis of the response
 */
export const analyzeResponse = async (
  question: string,
  answer: string
): Promise<any> => {
  try {
    const response = await api.post<AnalysisResponse>('/interview/analyze', {
      question,
      answer
    });

    const data = response.data as AnalysisResponse;
    return data.analysis;
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
 * Send a chat message and get a response
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
    const response = await api.post<ChatResponse>('/interview/chat', {
      message,
      context
    });

    const data = response.data as ChatResponse;
    return data.response;
  } catch (error) {
    console.error('Error in chat:', error);
    throw new Error('Failed to get chat response');
  }
};

// Create a named export object to satisfy ESLint
const apiExports = {
  generateQuestion,
  analyzeResponse,
  sendChatMessage
};

export default apiExports;
