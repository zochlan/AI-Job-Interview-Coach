import logging

def llama3_generate(prompt, model="llama3", temperature=0.7, max_tokens=2048):
    """
    Generate text using the Ollama API with improved error handling and performance.

    Args:
        prompt: The prompt to send to the model
        model: The model to use (default: "llama3")
        temperature: Temperature for generation (0.0 to 1.0)
        max_tokens: Maximum tokens to generate

    Returns:
        str: Generated text or error message
    """
    from app.backend.utils.ollama_client import ollama_client

    # Generate response using our enhanced client
    response, success = ollama_client.generate(
        prompt=prompt,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens
    )

    # If generation was successful, return the response
    if success:
        return response

    # If generation failed, log the error and return the error message
    logging.error(f"Failed to generate response: {response}")
    return f"I'm having trouble generating a response. {response}"

def build_chat_prompt(system_prompt, user_profile, history, user_message):
    """
    Build a chat-style prompt for Llama 3 Chat variant.
    system_prompt: str
    user_profile: str (optional)
    history: list of (role, content) tuples
    user_message: str
    """
    prompt = f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n{system_prompt}\n<|eot_id|>"
    if user_profile:
        prompt += f"<|start_header_id|>user<|end_header_id|>\nProfile:\n{user_profile}\n<|eot_id|>"
    if history:
        for role, content in history:
            prompt += f"<|start_header_id|>{role}<|end_header_id|>\n{content}\n<|eot_id|>"
    prompt += f"<|start_header_id|>user<|end_header_id|>\n{user_message}\n<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n"
    return prompt


def format_history(history):
    # history: list of dicts with keys 'question', 'answer', 'feedback'
    if not history:
        return ""
    formatted = "\n".join([
        f"Previous Q: {h['question']}\nPrevious A: {h['answer']}\nPrevious Feedback: {h.get('feedback', '')}" for h in history[-3:]
    ])
    return formatted + "\n"

def generate_interview_question(context: str = "", history=None, role: str = "", difficulty: str = "easy", cv_data: dict = None) -> str:
    history_str = format_history(history) if history else ""

    if difficulty == "easy":
        diff_prompt = "Ask a simple, introductory, behavioral interview question."
    elif difficulty == "medium":
        diff_prompt = "Ask a moderately challenging interview question that requires some thought."
    else:
        diff_prompt = "Ask a technical or advanced interview question that tests depth of knowledge."

    # Add CV-specific context if available
    cv_context = ""
    if cv_data:
        # Add skills information
        if cv_data.get('skills'):
            cv_context += f"Candidate skills: {', '.join(cv_data.get('skills', []))}\n"

        # Add target job information
        if cv_data.get('target_job'):
            cv_context += f"Target job: {cv_data.get('target_job')}\n"

        # Add missing keywords if available
        if cv_data.get('ats_report') and isinstance(cv_data.get('ats_report'), dict):
            ats_report = cv_data.get('ats_report')
            if ats_report.get('keywords_missing'):
                cv_context += f"Missing keywords: {', '.join(ats_report.get('keywords_missing')[:5])}\n"

    prompt = (
        "You are an expert AI interview coach. ONLY output a single interview question for the candidate. "
        f"{diff_prompt} Do NOT provide feedback, instructions, or commentary. "
        f"Role: {role}\n"
        f"{cv_context}"
        f"Context: {context}\n"
        f"Conversation history:\n{history_str}"
        "Question:"
    )
    return llama3_generate(prompt)

def generate_feedback(user_answer: str, question: str, history=None, role: str = "") -> str:
    history_str = format_history(history) if history else ""

    # Check for filler words
    filler_words = ["um", "uh", "like", "you know", "actually", "basically", "literally", "sort of", "kind of"]
    filler_word_count = sum(user_answer.lower().count(word) for word in filler_words)

    # Estimate speaking pace (words per minute)
    word_count = len(user_answer.split())
    estimated_time = max(1, word_count / 150)  # Assuming average speaking pace of 150 wpm
    speaking_pace = word_count / estimated_time

    # Add analysis hints
    pace_analysis = ""
    if speaking_pace > 180:
        pace_analysis = "The candidate appears to be speaking too quickly. Suggest slowing down for clarity."
    elif speaking_pace < 120:
        pace_analysis = "The candidate appears to be speaking quite slowly. Suggest a more energetic pace."

    filler_analysis = ""
    if filler_word_count > 3:
        filler_analysis = f"The candidate used approximately {filler_word_count} filler words. Suggest reducing these for more confident delivery."

    # Build the prompt with conditional sections
    analysis_section = ""
    if pace_analysis:
        analysis_section += pace_analysis + "\n"
    if filler_analysis:
        analysis_section += filler_analysis + "\n"

    prompt = (
        "You are an expert AI interview coach with years of experience. The candidate answered the following question. "
        "Provide detailed, constructive, actionable feedback on their answer using the STAR framework. "
        "Focus on both content and delivery. Be specific and personalized. Do NOT ask another question.\n\n"

        "ANALYSIS GUIDELINES:\n"
        "1. Evaluate how well they structured their answer (Situation, Task, Action, Result)\n"
        "2. Assess relevance to the question and role they're applying for\n"
        "3. Note specific strengths in their communication style\n"
        "4. Identify areas for improvement with actionable suggestions\n"
        "5. Comment on specificity, use of examples, and quantifiable results\n"
        f"{analysis_section}\n"

        f"Role: {role}\n"
        f"Question: {question}\n"
        f"Candidate's answer: {user_answer}\n"
        f"Conversation history:\n{history_str}"
        "Feedback:"
    )
    return llama3_generate(prompt)
