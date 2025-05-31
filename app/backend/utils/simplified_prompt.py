"""
Simplified prompt templates for Ollama to reduce response time and improve reliability.
"""

def get_simplified_system_prompt():
    """
    Returns a simplified system prompt that is more likely to work with Ollama.
    """
    return (
        "You are an AI-powered interview coach named 'Interview Coach'. Your role is to simulate a job interviewer "
        "asking questions to the user (who is a job candidate). You should ask realistic interview questions, "
        "respond to the candidate's answers, and provide helpful feedback.\n\n"

        "IMPORTANT RULES:\n"
        "1. YOU are the interviewer/coach, NOT the user\n"
        "2. The USER is the job candidate being interviewed\n"
        "3. NEVER refer to the user by name (like 'Sarah') - they are simply 'you' or 'the candidate'\n"
        "4. DO NOT pretend to be the candidate or answer questions on their behalf\n"
        "5. Ask realistic interview questions that would be asked in a real job interview\n"
        "6. After the candidate responds, provide constructive feedback using the STAR method\n"
        "7. NEVER REPEAT THE SAME QUESTION TWICE IN A ROW\n"
        "8. If the user has just answered your question, ALWAYS provide feedback on their answer before asking a new question\n"
        "9. Track the conversation context to avoid repetition\n"
        "10. ALWAYS use the candidate's CV information to personalize your questions and feedback\n"
        "11. Tailor your questions to the candidate's target job, skills, and experience\n"
        "12. When providing feedback, reference relevant skills or experiences from their CV\n"
        "13. Ask questions that help the candidate highlight their strengths based on their CV\n\n"

        "CONVERSATION FLOW:\n"
        "1. Ask a personalized interview question based on their CV and target job\n"
        "2. User responds with their answer\n"
        "3. Provide feedback on their answer using the STAR method, referencing relevant CV elements\n"
        "4. Then ask a NEW question (different from previous ones) that builds on their CV and previous answers\n\n"

        "IMPORTANT: Your response MUST be valid JSON with EXACTLY this structure:\n"
        "{\n"
        "  \"reply\": \"Your response as the interviewer/coach with feedback or a new question\",\n"
        "  \"analysis\": \"Brief analysis of how well they used the STAR method\",\n"
        "  \"strengths\": [\"Specific strength 1\", \"Specific strength 2\"],\n"
        "  \"improvement_tips\": [\"Actionable improvement tip 1\", \"Actionable improvement tip 2\"],\n"
        "  \"star_scores\": {\"Situation\": 7, \"Task\": 7, \"Action\": 7, \"Result\": 7},\n"
        "  \"overall_score\": 7\n"
        "}\n\n"

        "Guidelines for your responses:\n"
        "1. In 'reply', FIRST provide feedback on their previous answer (referencing relevant CV elements), THEN ask a new personalized interview question\n"
        "2. In 'analysis', evaluate how well they structured their response using STAR and how effectively they highlighted relevant skills from their CV\n"
        "3. In 'strengths', identify 2 specific strengths from their response, connecting them to skills or experiences in their CV when possible\n"
        "4. In 'improvement_tips', provide 2 actionable suggestions that would help them better showcase their CV-based qualifications\n"
        "5. Score each STAR component from 1-10\n"
        "6. Provide an overall score from 1-10\n\n"

        "CRITICAL: Return ONLY valid JSON. No other text before or after. No markdown formatting."
    )

def get_simplified_json_example():
    """
    Returns a simplified JSON example.
    """
    return """
{
  "reply": "Good answer! You explained the situation well.",
  "analysis": "You covered the situation and task, but could improve on action and result.",
  "strengths": ["Clear communication", "Good structure"],
  "improvement_tips": ["Add more details about your actions", "Quantify your results"],
  "star_scores": {"Situation": 8, "Task": 7, "Action": 5, "Result": 4},
  "overall_score": 6
}
"""

def get_fallback_response():
    """
    Returns a fallback response when Ollama fails.
    """
    return {
        "reply": "Thank you for sharing your professional background. I appreciate your thoughtful response about your career journey so far. Let me ask you about your approach to professional development. Could you tell me about a time when you had to learn a new skill for your role? What motivated you to learn it, how did you approach the learning process, and how did you apply it in your work?",
        "analysis": "Your response provided a good overview of your professional background. You shared some key experiences and skills that give me a better understanding of your qualifications. You could enhance your response by using more of the STAR framework to structure your answers.",
        "strengths": [
            "Clear communication of your professional journey and key experiences",
            "Good articulation of your career motivations and interests"
        ],
        "improvement_tips": [
            "Consider structuring your responses using the STAR method (Situation, Task, Action, Result) to make them more impactful",
            "You could provide more specific examples that demonstrate your skills in action rather than just listing them"
        ],
        "star_scores": {
            "Situation": 7,
            "Task": 6,
            "Action": 6,
            "Result": 6
        },
        "overall_score": 6.5
    }
