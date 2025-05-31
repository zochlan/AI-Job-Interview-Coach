/**
 * AI Question Generator
 * 
 * This utility provides functions to generate interview questions using the Llama3 model.
 * It complements the structured question bank by providing dynamic, contextual questions.
 */

import { ChatMessage } from '../types/chatTypes';
import { QuestionCategory, QuestionDifficulty, InterviewQuestion } from './interviewSequencer';

// Simple prompt templates for different question categories
const PROMPT_TEMPLATES = {
  [QuestionCategory.INTRODUCTORY]: 
    "Generate a professional job interview question that helps understand a candidate's background and experience. The question should be open-ended and conversational.",
  
  [QuestionCategory.BEHAVIORAL]: 
    "Generate a behavioral interview question that asks about past experiences and how the candidate handled specific situations. Use the STAR framework (Situation, Task, Action, Result).",
  
  [QuestionCategory.TECHNICAL]: 
    "Generate a technical interview question related to software development, programming concepts, or problem-solving approaches. The question should assess technical knowledge and thinking.",
  
  [QuestionCategory.SITUATIONAL]: 
    "Generate a situational interview question that presents a hypothetical scenario and asks how the candidate would handle it. Focus on workplace challenges.",
  
  [QuestionCategory.CLOSING]: 
    "Generate a closing interview question that wraps up the interview and gives the candidate a chance to add final thoughts or ask questions."
};

// Difficulty modifiers for prompts
const DIFFICULTY_MODIFIERS = {
  [QuestionDifficulty.EASY]: "Make this an introductory-level question suitable for entry-level candidates.",
  [QuestionDifficulty.MEDIUM]: "Make this a moderately challenging question that requires some experience to answer well.",
  [QuestionDifficulty.HARD]: "Make this a challenging question that would test even experienced professionals."
};

/**
 * Generate a question using a simulated AI approach
 * Note: In a real implementation, this would call an API to generate the question
 */
export const generateAIQuestion = async (
  category: QuestionCategory,
  difficulty: QuestionDifficulty,
  chatHistory: ChatMessage[],
  cvData: any = null
): Promise<InterviewQuestion> => {
  // In a real implementation, this would call an API with the Llama3 model
  // For now, we'll simulate it with predefined templates and some randomization
  
  // Create a unique ID for the question
  const id = `ai-${category}-${Date.now()}`;
  
  // Get the base prompt for the category
  let prompt = PROMPT_TEMPLATES[category];
  
  // Add difficulty modifier
  prompt += " " + DIFFICULTY_MODIFIERS[difficulty];
  
  // Add context from chat history (last 2 user messages)
  const userMessages = chatHistory
    .filter(msg => msg.id === 0)
    .slice(-2)
    .map(msg => msg.message);
  
  if (userMessages.length > 0) {
    prompt += " The candidate previously mentioned: " + userMessages.join(". ");
  }
  
  // Add CV context if available
  if (cvData && cvData.skills && cvData.skills.length > 0) {
    prompt += " The candidate's skills include: " + cvData.skills.join(", ");
  }
  
  // Generate question text (simulated)
  const questionText = await simulateAIGeneration(prompt, category, difficulty);
  
  // Return the question in the same format as the question bank
  return {
    id,
    text: questionText,
    category,
    difficulty,
    isAIGenerated: true
  };
};

/**
 * Simulate AI generation with templates and randomization
 * This is a placeholder for the actual API call to Llama3
 */
const simulateAIGeneration = async (
  prompt: string, 
  category: QuestionCategory,
  difficulty: QuestionDifficulty
): Promise<string> => {
  // In a real implementation, this would call the Llama3 API
  // For now, we'll use predefined questions with some variations
  
  // Sample questions by category
  const sampleQuestions = {
    [QuestionCategory.INTRODUCTORY]: [
      "Could you walk me through your professional journey and how it led you to this role?",
      "What aspects of your background make you particularly suited for this position?",
      "How would you describe your professional identity and the values that drive your work?"
    ],
    [QuestionCategory.BEHAVIORAL]: [
      "Tell me about a time when you had to adapt quickly to a significant change at work. How did you handle it?",
      "Describe a situation where you had to resolve a conflict within your team. What approach did you take?",
      "Can you share an example of a project that didn't go as planned? How did you respond to the challenges?"
    ],
    [QuestionCategory.TECHNICAL]: [
      "How do you approach debugging a complex issue in a large codebase you're not familiar with?",
      "What strategies do you use to ensure your code is maintainable and scalable?",
      "How do you balance technical debt against the need to deliver features quickly?"
    ],
    [QuestionCategory.SITUATIONAL]: [
      "How would you handle a situation where you're assigned a project with unclear requirements and a tight deadline?",
      "What would you do if you strongly disagreed with a decision made by your team lead?",
      "How would you approach working with a team member who consistently misses deadlines?"
    ],
    [QuestionCategory.CLOSING]: [
      "Based on our conversation today, what aspects of this role are you most excited about?",
      "Is there anything about your experience or skills that we haven't covered that you'd like to share?",
      "What questions do you have about the team or the company culture?"
    ]
  };
  
  // Select a random question from the appropriate category
  const questions = sampleQuestions[category];
  const baseQuestion = questions[Math.floor(Math.random() * questions.length)];
  
  // Add difficulty-specific phrasing
  let finalQuestion = baseQuestion;
  if (difficulty === QuestionDifficulty.HARD) {
    finalQuestion = "I'd like to ask you a more challenging question: " + baseQuestion;
  } else if (difficulty === QuestionDifficulty.EASY) {
    finalQuestion = "Let's start with something straightforward: " + baseQuestion;
  }
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return finalQuestion;
};

/**
 * In a real implementation, this would call the backend API
 * This is where you would integrate with your Llama3 model
 */
export const callLlama3API = async (prompt: string): Promise<string> => {
  // This would be replaced with an actual API call
  console.log("Would call Llama3 API with prompt:", prompt);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return a placeholder response
  return "This would be a response from the Llama3 API.";
};
