"""
Groq API Client for Flask Backend

This module provides functions to interact with the Groq API for generating
interview questions and analyzing responses.

This implementation uses the OpenAI-compatible API interface provided by Groq.
"""

import os
import json
import time
import uuid
import random
import logging
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Import the OpenAI library for interacting with the Groq API
try:
    from openai import OpenAI
except ImportError:
    print("OpenAI library not found. Installing...")
    try:
        import subprocess
        subprocess.check_call(["pip", "install", "openai", "--user"])
        from openai import OpenAI
    except Exception as e:
        print(f"Error installing openai: {e}")
        print("Please install openai manually using: pip install openai --user")

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get API key from environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_BASE = os.getenv("GROQ_API_BASE", "https://api.groq.com/openai/v1")
DEFAULT_MODEL = os.getenv("GROQ_DEFAULT_MODEL", "llama3-8b-8192")

# Log API key and default model (partially masked for security)
if GROQ_API_KEY:
    masked_key = GROQ_API_KEY[:5] + "..." + GROQ_API_KEY[-5:] if len(GROQ_API_KEY) > 10 else "***"
    logger.info(f"GROQ_API_KEY: {masked_key}")
else:
    logger.warning("GROQ_API_KEY not set")

logger.info(f"GROQ_API_BASE: {GROQ_API_BASE}")
logger.info(f"DEFAULT_MODEL: {DEFAULT_MODEL}")

# Create OpenAI client for Groq API
def get_client():
    """Get an OpenAI client configured for Groq API"""
    if not GROQ_API_KEY:
        logger.warning("No Groq API key found")
        return None

    return OpenAI(
        api_key=GROQ_API_KEY,
        base_url=GROQ_API_BASE
    )

# Available Groq models
AVAILABLE_MODELS = [
    {"id": "llama3-8b-8192", "name": "Llama 3 8B"},
    {"id": "llama3-70b-8192", "name": "Llama 3 70B"},
    {"id": "mixtral-8x7b-32768", "name": "Mixtral 8x7B"},
    {"id": "gemma-7b-it", "name": "Gemma 7B"},
    {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus"},
    {"id": "claude-3-sonnet-20240229", "name": "Claude 3 Sonnet"},
    {"id": "claude-3-haiku-20240307", "name": "Claude 3 Haiku"}
]

def get_available_models():
    """
    Get available Groq models

    Returns:
        List of available models
    """
    return AVAILABLE_MODELS

def send_message(
    message: str,
    model: str = DEFAULT_MODEL,
    context: List[Dict[str, str]] = None
) -> str:
    """
    Send a message to Groq API and get a response

    Args:
        message: The user message to send
        model: The model to use (defaults to DEFAULT_MODEL)
        context: Optional previous messages for context

    Returns:
        The AI response as a string
    """
    logger.info(f"Groq API: Sending message to model {model}")

    # Check if we have a valid API key
    if not GROQ_API_KEY:
        logger.warning("No Groq API key found. Using mock response.")
        return generate_mock_response(message, model)

    try:
        client = get_client()

        # Prepare the messages in the format expected by the OpenAI API
        messages = []

        # Add context messages if provided
        if context:
            for msg in context:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                messages.append({"role": role, "content": content})

        # Add the current message
        messages.append({"role": "user", "content": message})

        # Call the API
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
            max_tokens=1024
        )

        # Extract the response text
        response_text = response.choices[0].message.content

        # Clean up the response
        cleaned_response = response_text.strip()

        return cleaned_response

    except Exception as e:
        logger.error(f"Error using Groq API: {str(e)}")
        logger.info("Falling back to mock response")
        return generate_mock_response(message, model)

def generate_mock_response(message: str, model: str = DEFAULT_MODEL) -> str:
    """
    Generate a mock response when the API is unavailable

    Args:
        message: The user message
        model: The model that would have been used

    Returns:
        A simulated response
    """
    logger.warning(f"Using mock response for model {model}")

    # If the message is asking for a question, return a mock interview question
    if "interview question" in message.lower():
        questions = [
            "Can you tell me about a time when you had to work under pressure to meet a deadline?",
            "When you have multiple deadlines, how do you typically prioritize your work?",
            "What would you say is your greatest professional achievement so far?",
            "Have you ever had to deal with a conflict in your team? How did you handle it?",
            "I'm curious about how you keep your skills up to date. What do you do to stay current?",
            "Tell me about a challenging project you worked on recently.",
            "What aspects of this field are you most passionate about?",
            "How do you approach learning new technologies or methodologies?",
            "What's your approach to solving complex problems?",
            "Can you share an example of how you've handled feedback in the past?"
        ]
        return random.choice(questions)
    else:
        # Generic response
        responses = [
            f"I understand you're asking about {message[:30]}... This is a simulated response since we're using a mock API.",
            "That's an interesting question. In a real implementation, this would connect to the Groq API to generate a response.",
            "I'm currently running in mock mode. To get real responses, you'll need to implement a proper Groq API client.",
            f"Your question about {message[:20]}... would normally be processed by the Groq API with the {model} model."
        ]
        return random.choice(responses)

def generate_interview_question(
    job_role: str,
    previous_questions: List[str] = None,
    previous_answers: List[str] = None,
    cv_data: Dict[str, Any] = None,
    model: str = DEFAULT_MODEL,
    is_new_session: bool = False,
    unique_id: str = None
) -> str:
    """
    Generate an interview question based on context and research-based sequencing

    Args:
        job_role: The job role being interviewed for
        previous_questions: Array of previous questions asked
        previous_answers: Array of previous answers given
        cv_data: Optional CV data for personalization
        model: The model to use
        is_new_session: Whether this is a new session or continuing one
        unique_id: Unique identifier to prevent duplicate questions

    Returns:
        Generated interview question
    """
    # Initialize previous questions and answers if None
    if previous_questions is None:
        previous_questions = []
    if previous_answers is None:
        previous_answers = []

    # Determine the current interview stage based on the number of questions
    question_count = len(previous_questions)

    # Define interview stages
    if question_count == 0:
        stage = "initial"
    elif question_count < 3:
        stage = "early"
    elif question_count < 7:
        stage = "middle"
    elif question_count < 12:
        stage = "late"
    else:
        stage = "closing"

    # Force initial stage if this is explicitly a new session, regardless of question count
    if is_new_session:
        stage = "initial"
        logger.info(f"Forcing initial stage because is_new_session=True")

    # Double-check: if this is the first question (no previous questions), always use initial stage
    if len(previous_questions) == 0:
        stage = "initial"
        logger.info(f"Forcing initial stage because this is the first question (no previous questions)")

    logger.info(f"Current interview stage: {stage} (question count: {question_count}, is_new_session: {is_new_session})")

    # Construct a prompt for the model
    prompt = f"""You are an expert AI job interview coach conducting a natural, conversational interview. Generate ONE interview question that sounds like it's coming from a human interviewer.

"""

    # Add CV data if available for personalization
    if cv_data:
        # Extract relevant information from CV data without dumping the entire JSON
        skills = cv_data.get('skills', [])
        experience = cv_data.get('experience', [])
        education = cv_data.get('education', [])
        target_job = cv_data.get('target_job', job_role)
        projects = cv_data.get('projects', [])
        achievements = cv_data.get('achievements', [])
        
        # Format skills as a comma-separated list
        skills_str = ', '.join(skills[:7]) if skills else 'Not specified'
        
        # Format experience more readably
        if isinstance(experience, list):
            exp_str = "\n".join([f"- {exp}" for exp in experience[:3]])
        else:
            exp_str = str(experience)[:300]
            
        # Format education more readably
        if isinstance(education, list):
            edu_str = "\n".join([f"- {edu}" for edu in education[:2]])
        else:
            edu_str = str(education)[:200]
            
        # Format projects if available
        if projects and isinstance(projects, list):
            proj_str = "\n".join([f"- {proj}" for proj in projects[:2]])
        else:
            proj_str = str(projects)[:200] if projects else "Not specified"

        # Use the target job from CV if available, otherwise use the provided job_role
        actual_job_role = target_job if target_job else job_role

        prompt += f"""
The candidate is interviewing for a {actual_job_role} position.

Detailed CV information:
- Target Position: {actual_job_role}
- Skills: {skills_str}
- Experience: 
{exp_str}
- Education: 
{edu_str}
- Projects: 
{proj_str}
- Achievements: {str(achievements)[:200] if achievements else 'Not specified'}

IMPORTANT: After the initial introductory question, you should use this CV information to personalize your questions. Refer to specific elements from their CV in your questions, but do so naturally without explicitly mentioning "from your CV" or "I see in your CV". 

For example, instead of saying "I see from your CV that you have experience with Python", say "Could you tell me about a challenging project where you applied your Python skills?"

Frame the question naturally as a human interviewer would, incorporating their background information subtly into your questions.
"""
    else:
        # If no CV data, still use the job role if provided
        if job_role:
            prompt += f"""
The candidate is interviewing for a {job_role} position.

Please ask a natural question that a human interviewer would ask. Do NOT mention the specific position in the question itself or state that this is a personalized question.
"""

    # Add a unique identifier for this specific question to ensure variety
    question_unique_id = f"{unique_id}-{random.randint(1, 10000)}"
    prompt += f"\nUnique question identifier: {question_unique_id}\n"

    # Add stage-specific instructions
    if stage == "initial":
        # Initial stage - safe first questions
        if is_new_session:
            if cv_data:
                prompt += f"""
This is the start of a new interview session. Ask a natural, conversational opening question that helps establish rapport and sets the tone for the interview. Make it sound like a human interviewer starting a conversation, not an AI.

IMPORTANT CONTEXT TO FOLLOW:
1. Initially let the system ask questions in a random fashion and get the answers so that we can be sure about the interface
2. Think of a strategy for sequencing the questions, getting the answers and think whether the n+1 the question (2nd) is based on the answer of the nth question
3. Look into the literature; how they have addressed the issue
4. Look into the literature, how they have addressed the issue for technical questions
5. Will the first question be safe for all candidates?

Since you have the candidate's CV data, DO NOT immediately jump to technical questions. Instead, start with a general, safe opening question that would be appropriate for any candidate regardless of their background. The first question should be introductory and help establish rapport.

IMPORTANT: Be creative and varied in your questions. Do not use the same template or structure as previous questions. Create a unique, personalized question that hasn't been asked before.

To ensure variety, use this random seed value to guide your creativity: {random.randint(1, 10000)}

Here are some appropriate approaches for the FIRST question (but don't limit yourself to these):
- Ask about their professional journey and what led them to this field
- Ask about what aspects of their work they find most rewarding or challenging
- Ask about their approach to professional development and growth
- Ask about their ideal work environment or team dynamics
- Ask about what motivates them in their professional life

DO NOT ask technical questions in the first interaction, even if you have CV data. Technical questions should come later in the interview sequence.

IMPORTANT: Return ONLY the question itself. DO NOT include phrases like "Here's a conversational opening question" or "This question helps establish rapport". Just give the actual question a human interviewer would ask.
"""
            else:
                prompt += f"""
This is the start of a new interview session. You are a professional interviewer. Begin with a warm, professional introduction and a natural opening question.

Your first question should:
1. Sound warm and professional
2. Be universally appropriate for any candidate regardless of background
3. Be open-ended to encourage detailed responses
4. Not assume any specific background or experience
5. Sound completely natural, as if a real human recruiter is speaking

IMPORTANT: Be creative and varied in your questions. Do not use the same template or structure as previous questions. Create a unique, engaging question that hasn't been asked before.

To ensure variety, use this random seed value to guide your creativity: {random.randint(1, 10000)}

Here are some diverse approaches for opening questions (but don't limit yourself to these):
- Ask about their professional journey and what led them to this field
- Ask about what aspects of their work they find most rewarding or challenging
- Ask about their approach to professional development and growth
- Ask about their ideal work environment or team dynamics
- Ask about what motivates them in their professional life
- Ask about how they approach new challenges or problems
- Ask about their professional strengths and how they leverage them
- Ask about their perspective on important trends in their industry
- Ask about what they're looking for in their next role or opportunity
- Ask about a professional achievement they're particularly proud of

IMPORTANT: Return ONLY the question itself. DO NOT include phrases like "Here's a conversational opening question" or "This question helps establish rapport". Just give the actual question a human interviewer would ask.
"""
    elif stage == "early":
        # Early stage - build rapport and gather background
        prompt += f"""
You are in the EARLY stage of the interview (question {question_count+1} of approximately 15).

IMPORTANT CONTEXT TO FOLLOW:
1. Questions should follow a logical sequence based on previous answers
2. The n+1 question (current) should be based on the answer of the nth question (previous)
3. If CV data is available, start incorporating specific elements from their CV into your questions

At this stage, focus on:
1. Building rapport with the candidate
2. Understanding their background and motivations
3. Asking about their general approach to work
4. Learning about their career goals
5. Beginning to reference specific elements from their CV (if available)

IMPORTANT: Be creative and varied in your questions. Do not use the same template or structure as previous questions. Create a unique question that hasn't been asked before.

To ensure variety, use this random seed value to guide your creativity: {random.randint(1, 10000)}

Here are some diverse approaches for early-stage questions (but don't limit yourself to these):
- Ask about a specific skill or experience mentioned in their CV
- Ask about their professional philosophy or work ethic
- Ask about how they approach collaboration or teamwork
- Ask about their communication style or preferences
- Ask about what they consider their most valuable professional skill
- Ask about how they handle feedback or criticism
- Ask about their approach to work-life balance
- Ask about their experience with remote/hybrid work environments
- Ask about their preferred management style
- Ask about their approach to continuous learning
- Ask about their experience with diverse teams or inclusive workplaces

Your question should flow naturally from their previous answers while moving the interview forward. If CV data is available, subtly incorporate elements from their CV into your questions without explicitly mentioning "from your CV" or "I see in your CV".
"""
    elif stage == "middle":
        # Middle stage - behavioral and situational questions
        prompt += f"""
You are in the MIDDLE stage of the interview (question {question_count+1} of approximately 15).

IMPORTANT CONTEXT TO FOLLOW:
1. Questions should follow a logical sequence based on previous answers
2. The n+1 question (current) should be based on the answer of the nth question (previous)
3. Follow research-based interview techniques from the literature
4. Technical questions should only be introduced gradually, not abruptly

At this stage, focus on:
1. Behavioral questions using the STAR framework (Situation, Task, Action, Result)
2. Situational scenarios relevant to the role
3. Probing deeper into specific experiences mentioned earlier
4. Assessing problem-solving abilities

IMPORTANT: Be creative and varied in your questions. Do not use the same template or structure as previous questions. Create a unique, challenging question that hasn't been asked before.

To ensure variety, use this random seed value to guide your creativity: {random.randint(1, 10000)}

Here are some diverse approaches for middle-stage behavioral questions (but don't limit yourself to these):
- Ask about a time they had to resolve a conflict within a team
- Ask about a situation where they had to adapt to unexpected changes
- Ask about a project that didn't go as planned and how they handled it
- Ask about a time they had to make a difficult decision with limited information
- Ask about an experience working with a difficult stakeholder or client
- Ask about a situation where they had to prioritize competing demands
- Ask about a time they had to learn a new skill or technology quickly
- Ask about an experience where they had to give difficult feedback
- Ask about a situation where they demonstrated leadership
- Ask about a time they had to persuade others to adopt their idea or approach

Your question should be more specific and challenging than earlier questions, while still flowing naturally from the conversation. If you're introducing technical questions, do so gradually and based on their previous responses.
"""
    elif stage == "late":
        # Late stage - technical and role-specific questions
        prompt += f"""
You are in the LATE stage of the interview (question {question_count+1} of approximately 15).

IMPORTANT CONTEXT TO FOLLOW:
1. Questions should follow a logical sequence based on previous answers
2. The n+1 question (current) should be based on the answer of the nth question (previous)
3. Follow research-based interview techniques from the literature
4. Technical questions should be appropriate to the candidate's background

At this stage, focus on:
1. Technical competencies relevant to the role (if appropriate based on their background)
2. Strategic thinking and decision-making
3. Leadership and teamwork scenarios
4. More challenging behavioral questions

IMPORTANT: Be creative and varied in your questions. Do not use the same template or structure as previous questions. Create a unique, challenging question that hasn't been asked before.

To ensure variety, use this random seed value to guide your creativity: {random.randint(1, 10000)}

Here are some diverse approaches for late-stage questions (but don't limit yourself to these):
- Ask about their approach to a specific challenge relevant to the role
- Ask about how they would implement a particular solution or strategy
- Ask about their experience with specific methodologies or frameworks
- Ask about how they would handle a complex strategic scenario
- Ask about their approach to measuring success or performance
- Ask about how they stay current with industry developments
- Ask about their experience with cross-functional collaboration
- Ask about how they would approach scaling a team or project
- Ask about their experience with mentoring or developing others
- Ask about how they balance quality with business constraints

Your question should assess deeper competencies while building on information already shared. Make sure your questions are appropriate to the candidate's background and experience level as revealed in their previous answers.
"""
    else:
        # Closing stage - final assessment and wrap-up
        prompt += f"""
You are in the CLOSING stage of the interview (question {question_count+1} of approximately 15).

At this stage, focus on:
1. Final assessment questions
2. Forward-looking questions about career aspirations
3. Questions about fit with the organization
4. Giving the candidate a chance to highlight anything not yet covered

IMPORTANT: Be creative and varied in your questions. Do not use the same template or structure as previous questions. Create a unique, thoughtful closing question that hasn't been asked before.

To ensure variety, use this random seed value to guide your creativity: {random.randint(1, 10000)}

Here are some diverse approaches for closing-stage questions (but don't limit yourself to these):
- Ask about their long-term career aspirations or goals
- Ask about what they're looking for in their next role or company culture
- Ask about how they see their field evolving in the coming years
- Ask about what they would hope to accomplish in their first few months in the role
- Ask about what aspects of the role they find most exciting or challenging
- Ask about how they would describe their ideal team or manager
- Ask about what questions they have about the role or organization
- Ask about what they feel sets them apart from other candidates
- Ask about what they've learned from their career journey so far
- Ask about what they would like to add that hasn't been covered in the interview

If this is likely to be the final question (question 14 or 15), consider a wrap-up question that gives the candidate a chance to leave a strong final impression.
"""

    # Add previous questions and answers for context and adaptive questioning
    if previous_questions and previous_answers:
        # Limit to the last 3 exchanges to keep context manageable
        context_limit = min(3, len(previous_questions), len(previous_answers))

        prompt += "\nHere are the most recent questions and answers:\n"

        for i in range(context_limit):
            q_idx = len(previous_questions) - context_limit + i
            a_idx = len(previous_answers) - context_limit + i

            if q_idx >= 0 and a_idx >= 0:
                prompt += f"Q: {previous_questions[q_idx]}\n"
                prompt += f"A: {previous_answers[a_idx]}\n\n"

        # Add adaptive questioning instructions
        prompt += """
Based on this context, ask a natural follow-up question that:
1. Flows conversationally from their previous answer
2. Explores interesting points they mentioned that deserve further discussion
3. Addresses any gaps or areas they didn't fully explain
4. Builds on their strengths or probes areas for development
5. Sounds like a human interviewer continuing a conversation, not an AI following a script

If their previous answer was incomplete or vague, consider asking a follow-up question that helps them provide more specific details or examples.
"""

        # Add specific adaptive logic based on the last answer
        if len(previous_answers) > 0:
            last_answer = previous_answers[-1].lower()

            # Check if the answer mentioned specific achievements
            if any(term in last_answer for term in ["achieve", "success", "accomplish", "proud", "impact"]):
                prompt += "\nTheir answer mentioned achievements or successes. Consider asking for specific metrics, outcomes, or what they learned from the experience.\n"

            # Check if the answer mentioned challenges
            if any(term in last_answer for term in ["challenge", "difficult", "problem", "obstacle", "struggle"]):
                prompt += "\nTheir answer mentioned challenges or problems. Consider asking how they overcame these challenges or what they learned from the experience.\n"

            # Check if the answer mentioned teamwork
            if any(term in last_answer for term in ["team", "colleague", "collaborate", "group", "work together"]):
                prompt += "\nTheir answer mentioned teamwork or collaboration. Consider asking about their specific role in the team or how they handle team conflicts.\n"

            # Check if the answer was very brief
            if len(last_answer.split()) < 30:
                prompt += "\nTheir previous answer was quite brief. Ask a question that encourages them to elaborate and provide more details.\n"

    # Add guidelines for question generation
    prompt += """
Guidelines for the question:
1. Make it sound natural and conversational, as if a human interviewer is asking it
2. Ensure it's different from any previous questions
3. Focus on behavioral or situational aspects when appropriate
4. Keep it concise and clear
5. Make it open-ended to encourage detailed responses
6. Avoid yes/no questions
7. CRITICAL: Return ONLY the question itself with NO explanations, meta-commentary, or additional text
8. DO NOT include phrases like "Here's a question" or "Here's the opening question" or "This is a conversational opening question"
9. DO NOT include any prefixes like "Question:" or "Interview Question:"
10. DO NOT start with "I would like to ask" or "Let me ask you" or "For my first question"
11. Keep your question concise and focused - aim for 1-2 sentences maximum
12. NEVER mention that this is a "personalized question" or refer to the specific job position in the question itself
13. Use natural language that a human interviewer would use (e.g., "Can you tell me about..." instead of "Describe a situation where...")
14. Avoid overly formal or robotic phrasing
15. DO NOT include phrases like "to establish rapport" or "to set the tone" - just ask the question directly
16. JUST GIVE THE QUESTION ITSELF, nothing more - as if you are the interviewer speaking directly to the candidate
17. WRONG: "Here's the opening question: What's been your experience with..."
18. RIGHT: "What's been your experience with..."
"""

    # Send the prompt to the API
    response = send_message(prompt, model)

    # Clean up the response - remove any unwanted text and formatting
    # Split by newlines and remove empty lines
    lines = [line.strip() for line in response.split('\n') if line.strip()]

    # If we have multiple lines, join them with spaces
    if len(lines) > 1:
        # Join all lines with spaces
        cleaned_response = ' '.join(lines)
        logger.info(f"Joined multiple lines. Original had {len(lines)} lines.")
    else:
        cleaned_response = response.strip()

    # Remove any prefixes like "Question:" or "Interview Question:"
    prefixes = [
        "question:", "interview question:", "q:",
        "here's a", "here is a", "here's an", "here is an",
        "this is a", "this is an",
        "here's a conversational opening question",
        "here's a natural", "here is a natural",
        "here's a warm", "here is a warm",
        "here's the opening question:", "here is the opening question:",
        "opening question:", "first question:"
    ]

    for prefix in prefixes:
        if cleaned_response.lower().startswith(prefix):
            # Find the first occurrence of "that" or "which" after the prefix, which often indicates
            # the start of the actual question content
            lower_response = cleaned_response.lower()
            prefix_end = len(prefix)

            # Look for transition words that often appear between the meta-commentary and the actual question
            transition_indices = []
            for word in ["that", "which", ":"]:
                idx = lower_response.find(word, prefix_end)
                if idx > -1:
                    transition_indices.append(idx + len(word))

            # If we found any transition words, use the earliest one
            if transition_indices:
                earliest_transition = min(transition_indices)
                cleaned_response = cleaned_response[earliest_transition:].strip()
                logger.info(f"Removed prefix and meta-commentary: '{cleaned_response[:earliest_transition]}'")
            else:
                # If no transition words found, just remove the prefix
                cleaned_response = cleaned_response[len(prefix):].strip()
                logger.info(f"Removed prefix: '{prefix}'")

    # Remove any leading punctuation that might remain after prefix removal
    cleaned_response = cleaned_response.lstrip(",:;-– ")

    # Capitalize the first letter if it's not already capitalized
    if cleaned_response and not cleaned_response[0].isupper():
        cleaned_response = cleaned_response[0].upper() + cleaned_response[1:]

    # Remove duplicated questions (sometimes the model repeats the question)
    cleaned_response = remove_duplicated_questions(cleaned_response)

    # Additional check for meta-commentary phrases embedded in the question
    meta_phrases = [
        "as a first question",
        "to start our interview",
        "to begin our conversation",
        "to get started",
        "to kick things off",
        "to begin with",
        "to start with",
        "to establish rapport",
        "to set the tone",
        "as an opening question",
        "here's a conversational",
        "here's a natural",
        "here's the opening",
        "here is the opening",
        "here's my first",
        "here is my first",
        "for my first question",
        "for the first question",
        "this is a question",
        "this question helps",
        "this question is designed",
        "this question aims",
        "this question will help",
        "this question allows",
        "this question gives",
        "this question focuses",
        "this question explores",
        "i would like to ask",
        "i'd like to ask",
        "i would ask",
        "i'd ask",
        "let me ask",
        "let's start with"
    ]

    for phrase in meta_phrases:
        if phrase in cleaned_response.lower():
            # Split at the phrase and keep only what comes after
            parts = cleaned_response.lower().split(phrase)
            if len(parts) > 1 and len(parts[1].strip()) > 20:  # Ensure we have substantial content after the phrase
                cleaned_response = parts[1].strip().capitalize()
                logger.info(f"Removed embedded meta-commentary containing: '{phrase}'")
                break

    # Final check for common patterns of meta-commentary
    # Pattern: "Here's a [adjective] question: [actual question]"
    pattern1 = re.compile(r"^here'?s\s+an?\s+\w+\s+question:?\s+(.+)$", re.IGNORECASE)
    match = pattern1.match(cleaned_response)
    if match:
        cleaned_response = match.group(1).strip()
        logger.info("Removed 'Here's a [adjective] question:' pattern")

    # Pattern: "I would ask: [actual question]"
    pattern2 = re.compile(r"^i\s+would\s+(?:like\s+to\s+)?ask:?\s+(.+)$", re.IGNORECASE)
    match = pattern2.match(cleaned_response)
    if match:
        cleaned_response = match.group(1).strip()
        logger.info("Removed 'I would ask:' pattern")

    # Pattern: "A good question would be: [actual question]"
    pattern3 = re.compile(r"^a\s+(?:\w+\s+)question\s+would\s+be:?\s+(.+)$", re.IGNORECASE)
    match = pattern3.match(cleaned_response)
    if match:
        cleaned_response = match.group(1).strip()
        logger.info("Removed 'A good question would be:' pattern")

    # Capitalize the first letter again after all processing
    if cleaned_response and not cleaned_response[0].isupper():
        cleaned_response = cleaned_response[0].upper() + cleaned_response[1:]
    
    # Final check for any remaining meta-commentary
    # Look for common patterns like "Here's a question about..." or "I'd like to ask you about..."
    meta_patterns = [
        r"^(here'?s\s+(?:a|an|the|my)\s+(?:question|inquiry)\s+(?:about|regarding|on|for|to)\s+.+?:\s*)(.*)",
        r"^(i'?(?:d|would)\s+like\s+to\s+(?:ask|know|inquire)\s+(?:about|regarding|on|for|to)\s+.+?:\s*)(.*)",
        r"^(let'?s\s+(?:talk|discuss|start)\s+(?:about|with|by)\s+.+?:\s*)(.*)",
        r"^(for\s+(?:my|the|this|our)\s+(?:first|next|opening|initial)\s+(?:question|inquiry),\s*)(.*)",
        r"^(to\s+(?:begin|start|open)\s+(?:with|our|the)\s+(?:interview|conversation|discussion),\s*)(.*)"
    ]
    
    for pattern in meta_patterns:
        match = re.match(pattern, cleaned_response, re.IGNORECASE)
        if match and match.group(2):
            cleaned_response = match.group(2).strip()
            # Capitalize first letter if needed
            if cleaned_response and not cleaned_response[0].isupper():
                cleaned_response = cleaned_response[0].upper() + cleaned_response[1:]
            logger.info(f"Removed complex meta-commentary using pattern matching")
            break

    return cleaned_response

def remove_duplicated_questions(text: str) -> str:
    """
    Remove duplicated questions from the text

    Args:
        text: The text to clean

    Returns:
        Cleaned text without duplications
    """
    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)

    if len(sentences) <= 1:
        return text

    # Check for duplicated sentences
    unique_sentences = []
    for sentence in sentences:
        # Skip if this sentence is too similar to any we've already included
        if not any(similar_sentences(sentence, existing) for existing in unique_sentences):
            unique_sentences.append(sentence)

    # If we removed any sentences, log it
    if len(unique_sentences) < len(sentences):
        logger.info(f"Removed {len(sentences) - len(unique_sentences)} duplicated sentences")

    return ' '.join(unique_sentences)

def similar_sentences(s1: str, s2: str) -> bool:
    """
    Check if two sentences are similar

    Args:
        s1: First sentence
        s2: Second sentence

    Returns:
        True if sentences are similar, False otherwise
    """
    # Convert to lowercase and remove punctuation
    s1 = re.sub(r'[^\w\s]', '', s1.lower())
    s2 = re.sub(r'[^\w\s]', '', s2.lower())

    # If one is contained in the other, they're similar
    if s1 in s2 or s2 in s1:
        return True

    # Calculate word overlap
    words1 = set(s1.split())
    words2 = set(s2.split())

    if not words1 or not words2:
        return False

    overlap = len(words1.intersection(words2)) / min(len(words1), len(words2))

    # If more than 70% of words overlap, consider them similar
    return overlap > 0.7

def analyze_response(
    question: str,
    answer: str,
    model: str = DEFAULT_MODEL,
    previous_questions: List[str] = None,
    previous_answers: List[str] = None
) -> Dict[str, Any]:
    """
    Analyze a candidate's response using Groq API with STAR framework

    Args:
        question: The interview question
        answer: The candidate's answer
        model: The model to use
        previous_questions: Optional list of previous questions for context
        previous_answers: Optional list of previous answers for context

    Returns:
        Analysis of the response with STAR framework components
    """
    # Initialize previous questions and answers if None
    if previous_questions is None:
        previous_questions = []
    if previous_answers is None:
        previous_answers = []

    # Determine if this is a behavioral question that should use STAR analysis
    is_behavioral = any(term in question.lower() for term in [
        "tell me about a time", "describe a situation", "give an example",
        "share an experience", "how did you handle", "when have you"
    ])

    # Construct a prompt for the model
    prompt = f"""You are an expert AI job interview coach. Analyze the following interview question and answer:

Question: {question}

Answer: {answer}

"""

    # Add context from previous exchanges if available
    if previous_questions and previous_answers and len(previous_questions) > 0:
        # Limit to the last 2 exchanges to keep context manageable
        context_limit = min(2, len(previous_questions), len(previous_answers))

        prompt += "\nContext from previous exchanges:\n"

        for i in range(context_limit):
            q_idx = len(previous_questions) - context_limit + i
            a_idx = len(previous_answers) - context_limit + i

            if q_idx >= 0 and a_idx >= 0:
                prompt += f"Previous Q: {previous_questions[q_idx]}\n"
                prompt += f"Previous A: {previous_answers[a_idx]}\n\n"

    # Add STAR framework analysis for behavioral questions
    if is_behavioral:
        prompt += """
Analyze the answer using the STAR framework (Situation, Task, Action, Result):
1. Did they describe the Situation clearly?
2. Did they explain the Task or challenge they faced?
3. Did they detail the Actions they took?
4. Did they share the Results they achieved?

"""

    prompt += """
Provide a detailed analysis in JSON format with the following structure:
{
  "completeness": "complete|partial|incomplete",
  "confidence": "high|medium|low",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "improvement_tips": ["tip1", "tip2", ...],
  "star_rating": 1-5,
  "key_topics": ["topic1", "topic2", ...],
  "follow_up_suggestions": ["suggestion1", "suggestion2", ...]
"""

    # Add STAR components for behavioral questions
    if is_behavioral:
        prompt += """,
  "star_analysis": {
    "situation": {"present": true|false, "score": 1-5, "feedback": "..."},
    "task": {"present": true|false, "score": 1-5, "feedback": "..."},
    "action": {"present": true|false, "score": 1-5, "feedback": "..."},
    "result": {"present": true|false, "score": 1-5, "feedback": "..."}
  }
"""

    # Close the JSON structure
    prompt += """
}

Return ONLY the JSON with no additional text.
"""

    try:
        response = send_message(prompt, model)
        # Apply deduplication to the response
        cleaned_response = remove_duplicated_questions(response)
        if cleaned_response != response:
            logger.info("Removed duplicated content from analysis response")
            response = cleaned_response

        # Parse the JSON response
        analysis = json.loads(response)

        # Add metadata about the analysis
        analysis["is_behavioral_question"] = is_behavioral
        analysis["analysis_timestamp"] = datetime.now().isoformat()

        return analysis
    except (ValueError, json.JSONDecodeError) as e:
        logger.error(f"Error analyzing response: {e}")
        # Return a default analysis if parsing fails
        default_analysis = {
            "completeness": "partial",
            "confidence": "medium",
            "strengths": ["Unable to analyze properly"],
            "weaknesses": ["Unable to analyze properly"],
            "improvement_tips": ["Try to be more specific and structured in your answer"],
            "star_rating": 3,
            "key_topics": [],
            "follow_up_suggestions": ["Could you elaborate more on your experience?"],
            "is_behavioral_question": is_behavioral,
            "analysis_timestamp": datetime.now().isoformat()
        }

        # Add STAR analysis for behavioral questions
        if is_behavioral:
            default_analysis["star_analysis"] = {
                "situation": {"present": False, "score": 2, "feedback": "Situation was not clearly described"},
                "task": {"present": False, "score": 2, "feedback": "Task or challenge was not clearly defined"},
                "action": {"present": False, "score": 2, "feedback": "Actions taken were not detailed"},
                "result": {"present": False, "score": 2, "feedback": "Results or outcomes were not shared"}
            }

        return default_analysis
