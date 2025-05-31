import logging
import time
import re
from datetime import datetime
from flask import Blueprint, jsonify, request, g
from flask import session
from functools import wraps
from ..db import get_db
from ..ai_local_llm import generate_interview_question, generate_feedback, llama3_generate
from ..db.models import InterviewSession, Response, Feedback, QuestionType
from ..nlp import get_nlp
from sqlalchemy.exc import SQLAlchemyError
from flask import abort
from werkzeug.exceptions import HTTPException
import json
import random
from app.backend.utils.question_serving import get_random_question
from app.backend.nlp.answer_classifier import predict_answer_quality
from flask_cors import cross_origin
from app.backend.middleware import cache_route, track_performance
from app.backend.utils.simplified_prompt import get_simplified_system_prompt, get_fallback_response

# Define common variables used throughout the file
greetings = ['hi', 'hello', 'hey', 'greetings', 'howdy', 'hola']
question_requests = ['question', 'ask me', 'next question', 'another', 'continue']

bp = Blueprint('main', __name__)

@bp.route('/chat', methods=['POST', 'OPTIONS'])
@cross_origin(origins="http://localhost:3000", supports_credentials=True)
@track_performance(slow_threshold=2.0)  # Track performance, consider slow if > 2 seconds
def chat_api():
    import logging
    import json
    import random
    import time
    from app.backend.utils.ollama_client import ollama_client, ensure_ollama_running_with_model
    from app.backend.nlp import get_nlp
    from app.backend.utils.question_serving import get_random_question, get_next_question

    # Track request timing for performance monitoring
    start_time = time.time()

    # First, ensure Ollama is running with the correct model
    model_name = "llama3"
    from app.backend.utils.check_ollama import check_ollama_status, fix_ollama_issues

    # Check Ollama status
    status = check_ollama_status(model_name)
    if not (status["installed"] and status["running"] and status["model_available"]):
        logging.error(f"Ollama status check failed: {status['status']}")

        # Try to fix issues automatically
        success, message = fix_ollama_issues(model_name)
        if not success:
            # If we couldn't fix the issues, return a helpful error message
            return jsonify({
                'reply': f"I'm having trouble connecting to my AI backend. {status['status']}",
                'analysis': '',
                'strengths': [],
                'improvement_tips': [
                    f"{status['action']}",
                    "Make sure Ollama is properly installed and running.",
                    f"You can run the check_ollama.py script to diagnose issues."
                ],
                'error': 'ollama_not_running',
                'status_details': status
            })
        else:
            logging.info(f"Ollama issues fixed automatically: {message}")

    data = request.get_json()
    user_message = data.get('message', '').strip() if data else ''
    # Convert message to lowercase for easier pattern matching
    lower_msg = user_message.lower()

    # Get CV analysis from request if available
    frontend_cv_analysis = data.get('cvAnalysis') if data else None
    if frontend_cv_analysis and not session.get('cv_analysis'):
        # Store CV analysis in session if not already there
        session['cv_analysis'] = frontend_cv_analysis
        session.modified = True

    # Use profile and CV analysis from session for context-aware, job-specific prompts
    profile = session.get('profile')
    cv_analysis = session.get('cv_analysis')

    if profile:
        # Get target job from profile or CV analysis
        target_job = profile.get('target_job', 'N/A')
        if target_job == 'N/A' and cv_analysis and cv_analysis.get('target_job'):
            target_job = cv_analysis.get('target_job')

        # Build detailed profile string
        profile_str = (
            f"Candidate Profile:\n"
            f"Name: {profile.get('name', 'N/A')}\n"
            f"Target Job: {target_job}\n"
            f"Skills: {', '.join(profile.get('skills', []))}\n"
            f"Education: {profile.get('education', 'N/A')}\n"
            f"Experience: {profile.get('experience', 'N/A')}\n"
        )

        # Add CV analysis if available
        cv_context = ""
        if cv_analysis:
            # Add CV summary if available
            if cv_analysis.get('summary'):
                cv_context += f"\nCV Summary: {cv_analysis.get('summary')}\n"

            # Add key recommendations from CV analysis
            if cv_analysis.get('recommendations'):
                cv_context += f"\nKey CV Recommendations: {', '.join(cv_analysis.get('recommendations')[:3])}\n"

            # Add ATS report insights if available
            if cv_analysis.get('ats_report') and isinstance(cv_analysis.get('ats_report'), dict):
                ats_report = cv_analysis.get('ats_report')
                if ats_report.get('keywords_missing'):
                    cv_context += f"\nMissing Keywords: {', '.join(ats_report.get('keywords_missing')[:5])}\n"

        # Use simplified prompt to reduce response time
        system_prompt = get_simplified_system_prompt()
        full_prompt = f"{profile_str}{cv_context}\n\n{system_prompt}\n\nUser: {user_message}\nInterview Coach:"
    else:
        # Use simplified prompt to reduce response time
        system_prompt = get_simplified_system_prompt()
        full_prompt = f"{system_prompt}\n\nUser: {user_message}\nInterview Coach:"

    try:
        # Use our enhanced Ollama client
        from app.backend.utils.ollama_client import ollama_client

        # Track request timing for performance monitoring
        start_time = time.time()

        # Generate response with improved error handling and reduced parameters
        llama_raw, success = ollama_client.generate(
            prompt=full_prompt,
            model=model_name,
            temperature=0.7,
            max_tokens=512,  # Reduced from 2048 to 512 for faster response
            timeout=60  # Reduced from 180 to 60 seconds
        )

        if not success:
            # If generation failed, return a fallback response
            logging.error(f"Failed to generate response: {llama_raw}")
            fallback = get_fallback_response()
            return jsonify(fallback)

        try:
            # First try to parse as JSON with improved handling
            try:
                # Clean up the response to help with JSON parsing
                cleaned_response = llama_raw.strip()

                # Try to extract JSON if it's embedded in text
                json_start = cleaned_response.find('{')
                json_end = cleaned_response.rfind('}')

                # Log the raw response for debugging
                logging.debug(f"Raw LLM response: {cleaned_response[:200]}...")

                parsed = None

                # Try multiple parsing strategies
                if json_start >= 0 and json_end > json_start:
                    potential_json = cleaned_response[json_start:json_end+1]
                    try:
                        # First try the extracted JSON
                        parsed = json.loads(potential_json)
                        logging.info("Successfully parsed JSON from extracted portion")
                    except json.JSONDecodeError as e:
                        logging.warning(f"Failed to parse extracted JSON: {e}")

                        # Try to fix common JSON errors
                        fixed_json = potential_json.replace("'", '"')  # Replace single quotes with double quotes
                        fixed_json = re.sub(r'([{,])\s*(\w+):', r'\1"\2":', fixed_json)  # Add quotes to keys

                        try:
                            parsed = json.loads(fixed_json)
                            logging.info("Successfully parsed JSON after fixing format issues")
                        except json.JSONDecodeError:
                            # If that fails, try the original response
                            try:
                                parsed = json.loads(cleaned_response)
                                logging.info("Successfully parsed JSON from full response")
                            except json.JSONDecodeError:
                                # Last resort: try to fix the full response
                                fixed_full = cleaned_response.replace("'", '"')
                                fixed_full = re.sub(r'([{,])\s*(\w+):', r'\1"\2":', fixed_full)
                                try:
                                    parsed = json.loads(fixed_full)
                                    logging.info("Successfully parsed JSON after fixing full response")
                                except json.JSONDecodeError:
                                    logging.error("All JSON parsing attempts failed")
                else:
                    try:
                        parsed = json.loads(cleaned_response)
                        logging.info("Successfully parsed JSON from full response")
                    except json.JSONDecodeError:
                        logging.error("Failed to parse JSON from full response")

                # Only accept if reply is not empty, not a format/example, and not just a JSON template
                if parsed and parsed.get('reply') and 'example' not in parsed.get('reply').lower() and 'format' not in parsed.get('reply').lower():
                    # Update chat history
                    if 'chat_history' not in session:
                        session['chat_history'] = []
                    session['chat_history'].append(("user", user_message))
                    session['chat_history'].append(("assistant", parsed.get('reply', '')))
                    session.modified = True

                    # Ensure all fields are properly formatted
                    strengths = parsed.get('strengths', [])
                    if isinstance(strengths, str):
                        strengths = [s.strip() for s in strengths.split(',') if s.strip()]

                    improvement_tips = parsed.get('improvement_tips', [])
                    if isinstance(improvement_tips, str):
                        improvement_tips = [t.strip() for t in improvement_tips.split(',') if t.strip()]

                    star_scores = parsed.get('star_scores', {})
                    if isinstance(star_scores, str):
                        # Try to parse string into dict
                        try:
                            scores = {}
                            score_matches = re.findall(r'(\w+):\s*(\d+)', star_scores)
                            for key, value in score_matches:
                                scores[key] = int(value)
                            star_scores = scores
                        except:
                            star_scores = {}

                    # Log processing time for performance monitoring
                    processing_time = time.time() - start_time
                    logging.info(f"Chat request processed in {processing_time:.2f} seconds")

                    return jsonify({
                        'reply': parsed.get('reply', ''),
                        'analysis': parsed.get('analysis', ''),
                        'strengths': strengths,
                        'improvement_tips': improvement_tips,
                        'star_scores': star_scores,
                        'overall_score': parsed.get('overall_score'),
                        'processing_time': f"{processing_time:.2f}"
                    })
                else:
                    # If parsing succeeded but the result is invalid, return a fallback response
                    fallback = get_fallback_response()
                    return jsonify(fallback)
            except json.JSONDecodeError:
                # If JSON parsing failed, return a fallback response
                fallback = get_fallback_response()
                return jsonify(fallback)
        except Exception as e:
            logging.error(f"Error processing Ollama response: {str(e)}")
            # Return a fallback response
            fallback = get_fallback_response()
            return jsonify(fallback)
    except Exception as e:
        return jsonify({'reply': f"Sorry, there was an error connecting to the interview coach: {str(e)}"}), 500
