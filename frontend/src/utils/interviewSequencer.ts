/**
 * Interview Sequencer
 *
 * This utility provides structured interview question sequences based on:
 * 1. Initial randomized questions (warm-up phase)
 * 2. Previous answers (adaptive questioning)
 * 3. CV/profile data (personalized questioning)
 * 4. Interview stage (progressive questioning)
 *
 * Research-based approach:
 * - Uses the STAR framework (Situation, Task, Action, Result) for evaluating responses
 *   (Ref: Bangerter, A., Corvalan, P., & Cavin, C. (2014). Storytelling in the selection interview. Journal of Applied Psychology)
 * - Implements behavioral interviewing techniques as described by Janz et al.
 *   (Ref: Janz, T., Hellervik, L., & Gilmore, D. C. (1986). Behavior description interviewing)
 * - Technical question approach based on McDowell's framework
 *   (Ref: McDowell, G. (2015). Cracking the coding interview: 189 programming questions and solutions)
 * - Adaptive questioning based on Latham & Saari's guided interview technique
 *   (Ref: Latham, G. P., & Saari, L. M. (1984). Do people do what they say? Journal of Applied Psychology)
 */

import { ChatMessage } from '../types/chatTypes';

// Question categories
export enum QuestionCategory {
  INTRODUCTORY = 'introductory',
  BEHAVIORAL = 'behavioral',
  TECHNICAL = 'technical',
  SITUATIONAL = 'situational',
  CLOSING = 'closing'
}

// Question difficulty levels
export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

// Question object structure
export interface InterviewQuestion {
  id: string;
  text: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  followUpQuestions?: string[];
  keywords?: string[];
  requiresExperience?: boolean;
  isAIGenerated?: boolean;
  isComplete?: boolean; // Indicates if this is the final question (interview complete)
}

// Question bank - organized by category
export const questionBank: Record<QuestionCategory, InterviewQuestion[]> = {
  [QuestionCategory.INTRODUCTORY]: [
    {
      id: 'intro-1',
      text: 'Could you tell me a bit about yourself and your background?',
      category: QuestionCategory.INTRODUCTORY,
      difficulty: QuestionDifficulty.EASY,
      followUpQuestions: [
        'What aspects of your education or experience are most relevant to this role?',
        'How did you become interested in this field?'
      ]
    },
    {
      id: 'intro-2',
      text: 'What interests you about this position/field?',
      category: QuestionCategory.INTRODUCTORY,
      difficulty: QuestionDifficulty.EASY,
      followUpQuestions: [
        'What specific aspects of this field do you find most exciting?',
        'How do you see yourself contributing to this field?'
      ]
    },
    {
      id: 'intro-3',
      text: 'How would you describe your ideal work environment?',
      category: QuestionCategory.INTRODUCTORY,
      difficulty: QuestionDifficulty.EASY
    },
    {
      id: 'intro-4',
      text: 'What are your key strengths that make you suitable for this role?',
      category: QuestionCategory.INTRODUCTORY,
      difficulty: QuestionDifficulty.MEDIUM
    }
  ],
  [QuestionCategory.BEHAVIORAL]: [
    {
      id: 'behav-1',
      text: 'Could you tell me about a time when you had to solve a complex technical problem? What approach did you take?',
      category: QuestionCategory.BEHAVIORAL,
      difficulty: QuestionDifficulty.MEDIUM,
      requiresExperience: true,
      keywords: ['problem-solving', 'technical', 'analytical'],
      followUpQuestions: [
        'What specific tools or methodologies did you use to solve that problem?',
        'What would you do differently if you faced a similar problem today?',
        'How did this experience change your approach to problem-solving?'
      ]
    },
    {
      id: 'behav-2',
      text: 'Tell me about a situation where you had to learn a new skill quickly. How did you approach it?',
      category: QuestionCategory.BEHAVIORAL,
      difficulty: QuestionDifficulty.MEDIUM,
      keywords: ['learning', 'adaptability', 'growth']
    },
    {
      id: 'behav-3',
      text: 'Can you describe a time when you received constructive criticism? How did you respond to it?',
      category: QuestionCategory.BEHAVIORAL,
      difficulty: QuestionDifficulty.MEDIUM,
      keywords: ['feedback', 'growth', 'self-improvement']
    },
    {
      id: 'behav-4',
      text: 'What\'s your approach to prioritizing tasks when you have multiple deadlines?',
      category: QuestionCategory.BEHAVIORAL,
      difficulty: QuestionDifficulty.MEDIUM,
      keywords: ['time-management', 'organization', 'prioritization']
    },
    {
      id: 'behav-5',
      text: 'Could you share an example of how you\'ve dealt with a difficult colleague or stakeholder?',
      category: QuestionCategory.BEHAVIORAL,
      difficulty: QuestionDifficulty.HARD,
      requiresExperience: true,
      keywords: ['conflict-resolution', 'communication', 'interpersonal']
    },
    {
      id: 'behav-6',
      text: 'Tell me about a project where you had to work with a diverse team. How did you ensure effective collaboration?',
      category: QuestionCategory.BEHAVIORAL,
      difficulty: QuestionDifficulty.MEDIUM,
      requiresExperience: true,
      keywords: ['teamwork', 'collaboration', 'diversity']
    },
    {
      id: 'behav-7',
      text: 'Describe a situation where you had to make a difficult decision with limited information.',
      category: QuestionCategory.BEHAVIORAL,
      difficulty: QuestionDifficulty.HARD,
      keywords: ['decision-making', 'judgment', 'uncertainty']
    },
    {
      id: 'behav-8',
      text: 'Can you tell me about a time when you failed at something? What did you learn from it?',
      category: QuestionCategory.BEHAVIORAL,
      difficulty: QuestionDifficulty.HARD,
      keywords: ['failure', 'resilience', 'learning']
    },
    {
      id: 'behav-9',
      text: 'Tell me about a time when you had to adapt to a significant change at work or school.',
      category: QuestionCategory.BEHAVIORAL,
      difficulty: QuestionDifficulty.MEDIUM,
      keywords: ['adaptability', 'flexibility', 'change-management']
    }
  ],
  [QuestionCategory.TECHNICAL]: [
    {
      id: 'tech-1',
      text: 'What programming languages are you most comfortable with and why?',
      category: QuestionCategory.TECHNICAL,
      difficulty: QuestionDifficulty.EASY,
      keywords: ['programming', 'technical-skills'],
      followUpQuestions: [
        'How do you decide which programming language to use for a specific project?',
        'What language would you like to learn next and why?',
        'Can you describe a project where you had to use multiple programming languages together?'
      ]
    },
    {
      id: 'tech-2',
      text: 'Describe a challenging technical project you worked on. What technologies did you use?',
      category: QuestionCategory.TECHNICAL,
      difficulty: QuestionDifficulty.MEDIUM,
      requiresExperience: true,
      keywords: ['project', 'technical-skills']
    },
    {
      id: 'tech-3',
      text: 'How do you approach debugging a complex issue in your code?',
      category: QuestionCategory.TECHNICAL,
      difficulty: QuestionDifficulty.MEDIUM,
      keywords: ['debugging', 'problem-solving']
    },
    {
      id: 'tech-4',
      text: 'Tell me about your experience with version control systems.',
      category: QuestionCategory.TECHNICAL,
      difficulty: QuestionDifficulty.EASY,
      keywords: ['git', 'version-control']
    },
    {
      id: 'tech-5',
      text: 'How do you ensure your code is maintainable and readable for other developers?',
      category: QuestionCategory.TECHNICAL,
      difficulty: QuestionDifficulty.MEDIUM,
      keywords: ['code-quality', 'best-practices']
    },
    {
      id: 'tech-6',
      text: 'Describe your approach to testing your code.',
      category: QuestionCategory.TECHNICAL,
      difficulty: QuestionDifficulty.MEDIUM,
      keywords: ['testing', 'quality-assurance']
    },
    {
      id: 'tech-7',
      text: 'How do you stay updated with the latest developments in your technical field?',
      category: QuestionCategory.TECHNICAL,
      difficulty: QuestionDifficulty.EASY,
      keywords: ['continuous-learning', 'professional-development']
    }
  ],
  [QuestionCategory.SITUATIONAL]: [
    {
      id: 'sit-1',
      text: 'How would you handle a situation where you\'re assigned a task with unclear requirements?',
      category: QuestionCategory.SITUATIONAL,
      difficulty: QuestionDifficulty.MEDIUM,
      keywords: ['communication', 'clarification', 'initiative'],
      followUpQuestions: [
        'What specific questions would you ask to clarify the requirements?',
        'How would you prioritize your work when requirements are still evolving?',
        'How do you balance asking for clarification versus taking initiative?'
      ]
    },
    {
      id: 'sit-2',
      text: 'What would you do if you disagreed with a team member about a technical approach?',
      category: QuestionCategory.SITUATIONAL,
      difficulty: QuestionDifficulty.MEDIUM,
      keywords: ['conflict-resolution', 'communication', 'teamwork']
    },
    {
      id: 'sit-3',
      text: 'How would you manage your time if you were given multiple high-priority tasks with the same deadline?',
      category: QuestionCategory.SITUATIONAL,
      difficulty: QuestionDifficulty.MEDIUM,
      keywords: ['time-management', 'prioritization', 'stress-management']
    },
    {
      id: 'sit-4',
      text: 'How would you handle a situation where you identified a critical bug just before a major release?',
      category: QuestionCategory.SITUATIONAL,
      difficulty: QuestionDifficulty.HARD,
      keywords: ['problem-solving', 'communication', 'pressure']
    }
  ],
  [QuestionCategory.CLOSING]: [
    {
      id: 'close-1',
      text: 'Do you have any questions for me about the role or company?',
      category: QuestionCategory.CLOSING,
      difficulty: QuestionDifficulty.EASY
    },
    {
      id: 'close-2',
      text: 'Is there anything else you\'d like to share that we haven\'t covered?',
      category: QuestionCategory.CLOSING,
      difficulty: QuestionDifficulty.EASY
    }
  ]
};

/**
 * Analyzes a user's response to extract key information
 */
export const analyzeResponse = (response: string): {
  keywords: string[],
  sentiment: 'positive' | 'neutral' | 'negative',
  confidence: 'high' | 'medium' | 'low',
  completeness: 'complete' | 'partial' | 'incomplete'
} => {
  // This is a simplified analysis - in a real implementation,
  // you would use NLP or send this to your backend for analysis

  // Extract potential keywords (simplified)
  const keywords: string[] = [];
  const keywordPatterns = [
    { pattern: /problem.?solv(ed|ing)/i, keyword: 'problem-solving' },
    { pattern: /team(work|mate|member)/i, keyword: 'teamwork' },
    { pattern: /communicat(e|ion)/i, keyword: 'communication' },
    { pattern: /lead(er|ership)/i, keyword: 'leadership' },
    { pattern: /adapt(ed|able|ability)/i, keyword: 'adaptability' },
    { pattern: /learn(ed|ing)/i, keyword: 'learning' },
    { pattern: /challeng(e|ing)/i, keyword: 'challenge' },
    { pattern: /technical/i, keyword: 'technical' },
    { pattern: /code|programming|develop(er|ment)/i, keyword: 'coding' },
    { pattern: /test(ing|ed)/i, keyword: 'testing' },
    { pattern: /debug(ging|ged)/i, keyword: 'debugging' },
    { pattern: /project/i, keyword: 'project' },
    { pattern: /deadline/i, keyword: 'deadline' },
    { pattern: /priorit(y|ize|ization)/i, keyword: 'prioritization' },
    { pattern: /conflict/i, keyword: 'conflict-resolution' },
  ];

  keywordPatterns.forEach(({ pattern, keyword }) => {
    if (pattern.test(response)) {
      keywords.push(keyword);
    }
  });

  // Determine sentiment (simplified)
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  const positivePatterns = /success|accomplish|achiev|happy|proud|excit|enjoy|great|excellent/i;
  const negativePatterns = /difficult|hard|challeng|fail|struggle|problem|issue|conflict/i;

  if (positivePatterns.test(response) && !negativePatterns.test(response)) {
    sentiment = 'positive';
  } else if (negativePatterns.test(response) && !positivePatterns.test(response)) {
    sentiment = 'negative';
  }

  // Determine confidence level (simplified)
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  const highConfidencePatterns = /definitely|absolutely|certainly|confident|sure|know|expert/i;
  const lowConfidencePatterns = /maybe|perhaps|might|try|not sure|guess|think/i;

  if (highConfidencePatterns.test(response)) {
    confidence = 'high';
  } else if (lowConfidencePatterns.test(response)) {
    confidence = 'low';
  }

  // Determine completeness (simplified)
  let completeness: 'complete' | 'partial' | 'incomplete' = 'partial';

  // Check if response has STAR elements (Situation, Task, Action, Result)
  const hasSituation = /situation|context|background|when|where|while/i.test(response);
  const hasTask = /task|goal|objective|aim|needed to|had to/i.test(response);
  const hasAction = /action|did|implement|execut|step|approach|method/i.test(response);
  const hasResult = /result|outcome|impact|success|accomplish|achiev|learn|finish/i.test(response);

  if (hasSituation && hasTask && hasAction && hasResult) {
    completeness = 'complete';
  } else if (!hasSituation && !hasTask && !hasAction && !hasResult) {
    completeness = 'incomplete';
  }

  return { keywords, sentiment, confidence, completeness };
};

/**
 * Gets the next question based on conversation history and user profile
 *
 * Implements a research-based approach to question sequencing:
 * 1. Initial phase: Randomized safe questions (warm-up)
 * 2. Middle phase: Adaptive questioning based on previous responses
 * 3. Final phase: Closing questions
 *
 * Based on Campion et al.'s structured interview methodology
 * (Ref: Campion, M. A., Palmer, D. K., & Campion, J. E. (1997). A review of structure in the selection interview. Personnel Psychology)
 *
 * @param useAI Optional parameter to force using AI generation (true) or question bank (false)
 */
export const getNextQuestion = async (
  chatHistory: ChatMessage[],
  profile: any,
  cvAnalysis: any,
  currentStage: number = 0,
  useAI?: boolean,
  selectedModel?: string
): Promise<InterviewQuestion> => {
  // Always use AI generation with Poe API when a model is selected
  // Only fall back to alternating if no model is selected
  const shouldUseAI = useAI !== undefined
    ? useAI
    : selectedModel ? true : chatHistory.length % 2 === 0; // If model selected, always use AI

  // If using AI, generate a question using the Poe API
  if (shouldUseAI) {
    try {
      // Determine the current category based on conversation length
      const messageCount = chatHistory.length;

      // Check if we've reached the maximum number of questions (15)
      // Each exchange is 2 messages (user + bot), so 30 messages = 15 exchanges
      const questionCount = Math.floor(messageCount / 2);
      if (questionCount >= 15) {
        console.log('Maximum question count reached (15). Interview is complete.');
        return {
          id: 'interview-complete',
          text: 'Thank you for completing this interview session. You\'ve provided valuable insights throughout our conversation. This concludes our interview. I hope you found this practice helpful for your upcoming interviews. I\'ll now prepare a detailed analysis of your performance.',
          category: QuestionCategory.CLOSING,
          difficulty: QuestionDifficulty.EASY,
          isComplete: true
        };
      }

      let stage = 0;

      if (messageCount < 6) {
        stage = 0; // Introductory
      } else if (messageCount < 12) {
        stage = 1; // Behavioral
      } else if (messageCount < 18) {
        stage = 2; // Technical
      } else if (messageCount < 24) {
        stage = 3; // Situational
      } else {
        stage = 4; // Closing
      }

      // Define the sequence of categories
      // Check if we have any user responses to analyze for job context
      const userResponses = chatHistory.filter(msg => msg.id === 0);
      let hasTechnicalBackground = false;

      if (userResponses.length > 0) {
        // Check the first user response for technical keywords
        const firstResponse = userResponses[0].message.toLowerCase();
        const technicalKeywords = [
          'software', 'developer', 'programming', 'code', 'engineer', 'technical',
          'computer science', 'development', 'coding', 'algorithm', 'data structure'
        ];

        // Check for retail/management keywords
        const retailKeywords = [
          'retail', 'store', 'manager', 'management', 'customer service', 'sales',
          'operations', 'team lead', 'supervisor', 'merchandising', 'inventory'
        ];

        // Determine if the user has a technical background
        hasTechnicalBackground = technicalKeywords.some(keyword => firstResponse.includes(keyword));

        // If user has retail background, log it
        if (retailKeywords.some(keyword => firstResponse.includes(keyword))) {
          console.log('Detected retail/management background, will avoid technical questions');
        }
      }

      // Customize the question sequence based on background
      const categories = hasTechnicalBackground ?
        [
          QuestionCategory.INTRODUCTORY,
          QuestionCategory.BEHAVIORAL,
          QuestionCategory.TECHNICAL,  // Include technical questions for technical backgrounds
          QuestionCategory.SITUATIONAL,
          QuestionCategory.CLOSING
        ] :
        [
          QuestionCategory.INTRODUCTORY,
          QuestionCategory.BEHAVIORAL,
          QuestionCategory.BEHAVIORAL,  // Replace technical with more behavioral for non-technical
          QuestionCategory.SITUATIONAL,
          QuestionCategory.CLOSING
        ];

      // Determine the current category based on stage
      const currentCategory = categories[Math.min(stage, categories.length - 1)];

      // Import the Groq API module dynamically
      const groqApiModule = await import('./groqApi');

      // Determine if this is a new session (first question) or continuing session
      const isNewSession = chatHistory.length <= 1;

      // Log CV analysis data for debugging
      console.log('CV Analysis in interviewSequencer:', cvAnalysis);

      // Use the Groq API to generate a question
      // This will send the request to our Flask backend, which will use Groq's API
      const generatedQuestion = await groqApiModule.generateQuestion(
        chatHistory,
        cvAnalysis,
        selectedModel,
        isNewSession
      );

      // Return the generated question with proper metadata
      return {
        id: `groq-${currentCategory}-${Date.now()}`,
        text: generatedQuestion.text,
        category: currentCategory,
        difficulty: QuestionDifficulty.MEDIUM, // Default to medium difficulty
        isAIGenerated: true
      };
    } catch (error) {
      console.error('Error using Groq API to generate question:', error);

      // Fall back to the question bank if API fails
      console.log('Falling back to question bank due to API error');

      // Get a random question from the appropriate category based on conversation stage
      const messageCount = chatHistory.length;

      // Check if we've reached the maximum number of questions (15)
      const questionCount = Math.floor(messageCount / 2);
      if (questionCount >= 15) {
        console.log('Maximum question count reached (15). Interview is complete.');
        return {
          id: 'interview-complete',
          text: 'Thank you for completing this interview session. You\'ve provided valuable insights throughout our conversation. This concludes our interview. I hope you found this practice helpful for your upcoming interviews. I\'ll now prepare a detailed analysis of your performance.',
          category: QuestionCategory.CLOSING,
          difficulty: QuestionDifficulty.EASY,
          isComplete: true
        };
      }

      let category = QuestionCategory.INTRODUCTORY;

      // Check if we have any user responses to analyze for job context
      const userResponses = chatHistory.filter(msg => msg.id === 0);
      let hasTechnicalBackground = false;

      if (userResponses.length > 0) {
        // Check the first user response for technical keywords
        const firstResponse = userResponses[0].message.toLowerCase();
        const technicalKeywords = [
          'software', 'developer', 'programming', 'code', 'engineer', 'technical',
          'computer science', 'development', 'coding', 'algorithm', 'data structure'
        ];

        // Determine if the user has a technical background
        hasTechnicalBackground = technicalKeywords.some(keyword => firstResponse.includes(keyword));

        // Check for retail/management keywords
        const retailKeywords = [
          'retail', 'store', 'manager', 'management', 'customer service', 'sales',
          'operations', 'team lead', 'supervisor', 'merchandising', 'inventory'
        ];

        if (retailKeywords.some(keyword => firstResponse.includes(keyword))) {
          console.log('Detected retail/management background, will avoid technical questions');
        }
      }

      if (messageCount < 6) {
        category = QuestionCategory.INTRODUCTORY;
      } else if (messageCount < 12) {
        category = QuestionCategory.BEHAVIORAL;
      } else if (messageCount < 18) {
        // Use TECHNICAL category only if the user has a technical background
        // Otherwise, use more BEHAVIORAL questions
        category = hasTechnicalBackground ? QuestionCategory.TECHNICAL : QuestionCategory.BEHAVIORAL;
      } else if (messageCount < 24) {
        category = QuestionCategory.SITUATIONAL;
      } else {
        category = QuestionCategory.CLOSING;
      }

      // Get questions from the appropriate category
      const categoryQuestions = questionBank[category];

      // Get a random question
      const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
      const fallbackQuestion = categoryQuestions[randomIndex];

      return fallbackQuestion;
    }
  }

  // WARM-UP PHASE: Randomized safe questions for the start of the conversation
  if (chatHistory.length < 3) {
    // Safe introductory questions that work for all candidates
    // Research shows starting with non-threatening questions builds rapport
    // (Ref: Chapman, D. S., & Zweig, D. I. (2005). Developing a nomological network for interview structure. Personnel Psychology)
    const safeFirstQuestions = [
      questionBank[QuestionCategory.INTRODUCTORY][0], // "Could you tell me a bit about yourself and your background?"
      questionBank[QuestionCategory.INTRODUCTORY][1], // "What interests you about this position/field?"
      questionBank[QuestionCategory.INTRODUCTORY][2], // "How would you describe your ideal work environment?"
      questionBank[QuestionCategory.INTRODUCTORY][3]  // "What are your key strengths that make you suitable for this role?"
    ];

    // Randomize the first question for a more natural interview experience
    const randomIndex = Math.floor(Math.random() * safeFirstQuestions.length);
    return safeFirstQuestions[randomIndex];
  }

  // Get the last user response
  const userMessages = chatHistory.filter(msg => msg.id === 0);
  const lastUserResponse = userMessages.length > 0 ? userMessages[userMessages.length - 1].message : '';

  // ADAPTIVE PHASE: Questions based on previous answers

  // Analyze the response using STAR framework components
  // (Ref: Levashina, J., Hartwell, C. J., Morgeson, F. P., & Campion, M. A. (2014).
  // The structured employment interview: Narrative and quantitative review of the research literature. Personnel Psychology)
  const analysis = analyzeResponse(lastUserResponse);

  // Get the last question asked
  const botMessages = chatHistory.filter(msg => msg.id === 1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lastBotMessage = botMessages.length > 0 ? botMessages[botMessages.length - 1].message : '';
  const lastQuestionMetadata = botMessages.length > 0 ? botMessages[botMessages.length - 1].questionMetadata : null;

  // Determine the interview stage based on conversation length
  // Research shows progressive difficulty increases validity
  // (Ref: Huffcutt, A. I., & Arthur, W. (1994). Hunter and Hunter (1984) revisited:
  // Interview validity for entry-level jobs. Journal of Applied Psychology)
  const messageCount = chatHistory.length;
  let stage = 0;

  if (messageCount < 6) {
    stage = 0; // Introductory - establish rapport
  } else if (messageCount < 12) {
    stage = 1; // Behavioral - past performance predicts future behavior
  } else if (messageCount < 18) {
    stage = 2; // Technical - job-specific knowledge assessment
  } else if (messageCount < 24) {
    stage = 3; // Situational - hypothetical problem-solving
  } else {
    stage = 4; // Closing - wrap-up and final assessment
  }

  // Check if we should follow up on the previous question
  // Research shows follow-up questions improve interview validity
  // (Ref: Dipboye, R. L., & Gaugler, B. B. (1993). Cognitive and behavioral processes in the selection interview)
  if (lastQuestionMetadata && lastQuestionMetadata.id && analysis) {
    // If the answer was incomplete or low confidence, consider asking a follow-up
    if (analysis.completeness === 'incomplete' || analysis.confidence === 'low') {
      // Find the original question
      const categories = Object.values(QuestionCategory);
      for (const category of categories) {
        const questions = questionBank[category];
        const originalQuestion = questions.find(q => q.id === lastQuestionMetadata.id);

        // If we found the question and it has follow-up questions, use one
        if (originalQuestion && originalQuestion.followUpQuestions && originalQuestion.followUpQuestions.length > 0) {
          // Create a follow-up question based on the original
          return {
            id: `${originalQuestion.id}-followup`,
            text: `I'd like to explore that further. ${originalQuestion.followUpQuestions[0]}`,
            category: originalQuestion.category,
            difficulty: originalQuestion.difficulty
          };
        }
      }
    }
  }

  // Define the sequence of categories
  const categories = [
    QuestionCategory.INTRODUCTORY,
    QuestionCategory.BEHAVIORAL,
    QuestionCategory.TECHNICAL,
    QuestionCategory.SITUATIONAL,
    QuestionCategory.CLOSING
  ];

  // Determine the current category based on stage
  const currentCategory = categories[Math.min(stage, categories.length - 1)];

  // Get all questions from the current category
  const questions = questionBank[currentCategory];

  // PERSONALIZATION PHASE: Filter questions based on previous answers and profile
  // Research shows personalized questions increase interview effectiveness
  // (Ref: Bauer, T. N., Truxillo, D. M., Sanchez, R. J., Craig, J. M., Ferrara, P., & Campion, M. A. (2001).
  // Applicant reactions to selection: Development of the selection procedural justice scale. Personnel Psychology)

  let filteredQuestions = questions.filter(q => {
    // Check all previous bot messages to avoid repeating questions
    const previousBotMessages = chatHistory.filter(msg => msg.id === 1 && msg.message);

    // More robust check for duplicate questions:
    // 1. Check if the exact question ID has been used before (using questionMetadata)
    const questionIdUsedBefore = previousBotMessages.some(msg =>
      msg.questionMetadata && msg.questionMetadata.id === q.id
    );

    if (questionIdUsedBefore) {
      return false;
    }

    // 2. Check for text similarity as a backup with improved detection
    const isQuestionTextSimilar = previousBotMessages.some(msg => {
      // Get a significant portion of the question text for comparison
      const questionTextPortion = q.text.substring(0, Math.min(40, q.text.length)).toLowerCase();
      const msgTextPortion = msg.message.substring(0, Math.min(60, msg.message.length)).toLowerCase();

      // Check for common phrases that indicate similar questions
      const commonPhrases = [
        "tell me about yourself",
        "about yourself",
        "your background",
        "professional background",
        "tell me a bit about",
        "could you tell me"
      ];

      // If both texts contain the same common phrase, they're likely similar questions
      for (const phrase of commonPhrases) {
        if (questionTextPortion.includes(phrase) && msgTextPortion.includes(phrase)) {
          return true;
        }
      }

      // Also check direct inclusion as before
      return msgTextPortion.includes(questionTextPortion) ||
             questionTextPortion.includes(msgTextPortion.substring(0, Math.min(40, msgTextPortion.length)));
    });

    if (isQuestionTextSimilar) {
      return false;
    }

    // If the question requires experience and we know the user doesn't have it, skip
    if (q.requiresExperience && cvAnalysis && cvAnalysis.experience === 'none') {
      return false;
    }

    return true;
  });

  // Enhanced technical question handling based on CV data
  // Research shows domain-specific technical questions improve validity
  // (Ref: Schmidt, F. L., & Hunter, J. E. (1998). The validity and utility of selection methods in personnel psychology)
  if (currentCategory === QuestionCategory.TECHNICAL && cvAnalysis) {
    // Extract skills from CV analysis
    const userSkills = cvAnalysis.skills || [];
    const userEducation = cvAnalysis.education || '';
    const userExperience = cvAnalysis.experience || '';

    // Create a relevance score for each question based on CV match
    const scoredQuestions = filteredQuestions.map(question => {
      let relevanceScore = 1; // Base score

      // Increase score if question keywords match user skills
      if (question.keywords && userSkills.length > 0) {
        question.keywords.forEach(keyword => {
          if (userSkills.some((skill: string) =>
            skill.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(skill.toLowerCase())
          )) {
            relevanceScore += 2; // Strong match with skills
          }
        });
      }

      // Adjust score based on question difficulty and user experience
      if (question.difficulty === QuestionDifficulty.HARD && userExperience.includes('senior')) {
        relevanceScore += 1; // Senior candidates should get harder questions
      }

      // Adjust score based on education background
      if (question.keywords && question.keywords.some(keyword =>
        userEducation.toLowerCase().includes(keyword.toLowerCase())
      )) {
        relevanceScore += 1; // Education background matches question topic
      }

      return { question, relevanceScore };
    });

    // Sort by relevance score and take top 70% of questions
    scoredQuestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const topQuestions = scoredQuestions.slice(0, Math.max(2, Math.ceil(scoredQuestions.length * 0.7)));

    // Replace filtered questions with the top relevant ones
    if (topQuestions.length > 0) {
      filteredQuestions = topQuestions.map(sq => sq.question);
    }
  }

  // If no questions match our filters, fall back to all questions in the category
  if (filteredQuestions.length === 0) {
    filteredQuestions = questions;
  }

  // ADAPTIVE DIFFICULTY: Adjust based on previous answer quality
  // Research shows progressive difficulty improves candidate assessment
  // (Ref: Pulakos, E. D., & Schmitt, N. (1995). Experience-based and situational interview questions:
  // Studies of validity. Personnel Psychology)

  let targetDifficulty: QuestionDifficulty;

  // Calculate a performance score based on previous answers
  const userPerformanceScore = (() => {
    // Get all user messages
    const allUserMessages = chatHistory.filter(msg => msg.id === 0);
    if (allUserMessages.length < 2) return 0.5; // Default mid-level for new users

    // Analyze the last 3 responses (or fewer if not available)
    const recentMessages = allUserMessages.slice(-Math.min(3, allUserMessages.length));

    // Calculate average completeness and confidence
    let completenessScore = 0;
    let confidenceScore = 0;

    recentMessages.forEach(msg => {
      const msgAnalysis = analyzeResponse(msg.message);

      // Convert completeness to numeric score
      if (msgAnalysis.completeness === 'complete') completenessScore += 1;
      else if (msgAnalysis.completeness === 'partial') completenessScore += 0.5;

      // Convert confidence to numeric score
      if (msgAnalysis.confidence === 'high') confidenceScore += 1;
      else if (msgAnalysis.confidence === 'medium') confidenceScore += 0.5;
    });

    // Calculate average scores
    completenessScore /= recentMessages.length;
    confidenceScore /= recentMessages.length;

    // Combined performance score (0-1 range)
    return (completenessScore * 0.6) + (confidenceScore * 0.4); // Weigh completeness more
  })();

  // Set difficulty based on performance score
  // Research shows adaptive difficulty maintains engagement
  // (Ref: Campion, M. A., & Palmer, D. K. (1997). A review of structure in the selection interview)
  if (userPerformanceScore > 0.8) {
    // High performer - challenge them
    targetDifficulty = QuestionDifficulty.HARD;
  } else if (userPerformanceScore < 0.4) {
    // Struggling - make it easier
    targetDifficulty = QuestionDifficulty.EASY;
  } else {
    // Average performer - use medium difficulty
    targetDifficulty = QuestionDifficulty.MEDIUM;
  }

  // Progressive difficulty - as interview progresses, gradually increase difficulty
  // This follows research on structured interviews showing progressive difficulty improves assessment
  if (stage >= 3 && targetDifficulty === QuestionDifficulty.EASY) {
    // In later stages, avoid too easy questions
    targetDifficulty = QuestionDifficulty.MEDIUM;
  } else if (stage <= 1 && targetDifficulty === QuestionDifficulty.HARD) {
    // In early stages, avoid too hard questions
    targetDifficulty = QuestionDifficulty.MEDIUM;
  }

  // Try to find a question with the target difficulty
  const difficultyQuestions = filteredQuestions.filter(q => q.difficulty === targetDifficulty);

  // If we have questions matching the target difficulty, use those
  if (difficultyQuestions.length > 0) {
    // Randomize selection within the appropriate difficulty level
    return difficultyQuestions[Math.floor(Math.random() * difficultyQuestions.length)];
  }

  // Otherwise, fall back to a random question from the filtered list
  // Research shows some randomization prevents predictability
  // (Ref: Lievens, F., & De Soete, B. (2012). Simulations. In N. Schmitt (Ed.), The Oxford handbook of personnel assessment and selection)
  return filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
};
