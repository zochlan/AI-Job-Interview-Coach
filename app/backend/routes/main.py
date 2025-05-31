import logging
import time
import re
import sys
import os
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

# Add the project root to the Python path to import groq_client
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))
import groq_client

# Define common variables used throughout the file
greetings = ['hi', 'hello', 'hey', 'greetings', 'howdy', 'hola']
question_requests = ['question', 'ask me', 'next question', 'another', 'continue']

bp = Blueprint('main', __name__)

@bp.route('/api/analyze', methods=['POST'])
def analyze_interview_response():
    """
    Analyze an interview response using NLP
    """
    data = request.get_json()

    if not data or 'response' not in data or 'question' not in data:
        return jsonify({
            'error': 'Missing required fields: response and question'
        }), 400

    response_text = data['response']
    question = data['question']
    session_id = data.get('session_id')

    # Analyze the response
    analysis = analyze_response(response_text, question)

    # Store the response and analysis if session_id is provided
    if session_id:
        db = get_db()
        try:
            db.execute(
                'INSERT INTO responses (session_id, question, response_text, star_score, '
                'sentiment_score, completeness_score) VALUES (?, ?, ?, ?, ?, ?)',
                (session_id, question, response_text,
                 analysis['completeness_score'],
                 analysis['sentiment']['score'],
                 analysis['completeness_score'])
            )
            db.commit()
        except sqlite3.Error as e:
            return jsonify({'error': str(e)}), 500

    return jsonify(analysis)

@bp.route('/api/sessions', methods=['POST'])
def create_session():
    """
    Create a new interview session
    """
    data = request.get_json()

    if not data or 'user_id' not in data or 'session_type' not in data:
        return jsonify({
            'error': 'Missing required fields: user_id and session_type'
        }), 400

    db = get_db()
    try:
        cursor = db.execute(
            'INSERT INTO interview_sessions (user_id, session_type) VALUES (?, ?)',
            (data['user_id'], data['session_type'])
        )
        db.commit()
        session_id = cursor.lastrowid
        return jsonify({'session_id': session_id}), 201
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/sessions/<int:session_id>', methods=['GET'])
def get_session(session_id):
    """
    Get session details including all responses and feedback
    """
    db = get_db()
    try:
        session = db.execute(
            'SELECT * FROM interview_sessions WHERE id = ?',
            (session_id,)
        ).fetchone()

        if session is None:
            return jsonify({'error': 'Session not found'}), 404

        responses = db.execute(
            'SELECT * FROM responses WHERE session_id = ?',
            (session_id,)
        ).fetchall()

        feedback = db.execute(
            'SELECT f.* FROM feedback f '
            'JOIN responses r ON f.response_id = r.id '
            'WHERE r.session_id = ?',
            (session_id,)
        ).fetchall()

        return jsonify({
            'session': dict(session),
            'responses': [dict(r) for r in responses],
            'feedback': [dict(f) for f in feedback]
        })
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/feedback', methods=['POST'])
def create_feedback():
    """
    Create feedback for a response
    """
    data = request.get_json()

    if not data or 'response_id' not in data or 'feedback_type' not in data or 'feedback_text' not in data:
        return jsonify({
            'error': 'Missing required fields'
        }), 400

    db = get_db()
    try:
        cursor = db.execute(
            'INSERT INTO feedback (response_id, feedback_type, feedback_text, improvement_suggestions) '
            'VALUES (?, ?, ?, ?)',
            (data['response_id'], data['feedback_type'], data['feedback_text'],
             data.get('improvement_suggestions'))
        )
        db.commit()
        return jsonify({'feedback_id': cursor.lastrowid}), 201
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({'status': 'healthy'})

@bp.route('/api/time', methods=['GET'])
@cross_origin(origins="http://localhost:3000", supports_credentials=True)
def get_server_time():
    """
    Get the current server time
    Used to synchronize client and server clocks
    """
    return jsonify({
        'timestamp': int(time.time() * 1000),  # Current time in milliseconds
        'iso': datetime.now().isoformat()
    })

@bp.route('/groq/question', methods=['POST'])
@cross_origin(origins="http://localhost:3000", supports_credentials=True)
@track_performance(slow_threshold=2.0)  # Track performance, consider slow if > 2 seconds
@cache_route(ttl=300)  # Cache responses for 5 minutes to reduce API calls
def generate_groq_question():
    """
    Generate an interview question using Groq API with fallback mechanisms for rate limiting
    """
    print("[REQUEST] POST /api/groq/question")
    data = request.get_json()
    print(f"Request data: {json.dumps(data)}")

    # Extract parameters from request
    job_role = data.get('jobRole', 'software developer')
    previous_questions = data.get('previousQuestions', [])
    previous_answers = data.get('previousAnswers', [])
    cv_data = data.get('cvData')
    model = data.get('model')
    is_new_session = data.get('isNewSession', False)

    # Extract additional parameters for enhanced variety
    stage = data.get('stage')
    difficulty = data.get('difficulty')
    cache_buster = data.get('cacheBuster', {})
    variety_boost = data.get('varietyBoost', random.random())
    session_id = data.get('sessionId', 'unknown')
    force_initial_question = data.get('forceInitialQuestion', False)

    # Check for isNewSession in questionMetadata (from frontend)
    question_metadata = data.get('questionMetadata', {})
    if isinstance(question_metadata, dict) and question_metadata.get('isNewSession'):
        is_new_session = True
        print("Setting is_new_session=True based on questionMetadata.isNewSession")

    # If forceInitialQuestion is true, override is_new_session
    if force_initial_question:
        is_new_session = True
        print("Forcing initial question mode based on forceInitialQuestion flag")

    # If this is the first question (no previous questions), always treat as new session
    if len(previous_questions) == 0:
        is_new_session = True
        print("Setting is_new_session=True because this is the first question")

    # Create a unique ID that incorporates all randomness factors
    timestamp = int(time.time())
    random_component = random.randint(1, 1000000)
    session_component = hash(session_id) % 10000 if session_id else 0
    variety_component = int(variety_boost * 1000000) if variety_boost else random.randint(1, 1000000)

    # Combine all components into a unique ID
    unique_id = f"{timestamp}-{random_component}-{session_component}-{variety_component}"

    print(f"Using model: {model}")
    print(f"Job role: {job_role}")
    print(f"Previous questions count: {len(previous_questions)}")
    print(f"Is new session: {is_new_session}")
    print(f"Force initial question: {force_initial_question}")
    print(f"Unique ID: {unique_id}")
    print(f"Interview stage: {stage}")
    print(f"Question difficulty: {difficulty}")
    print(f"Session ID: {session_id}")
    print(f"Variety boost: {variety_boost}")
    print(f"CV data: {json.dumps(cv_data, indent=2) if cv_data else 'None'}")

    # Check if we're already at the rate limit
    from flask_limiter.util import get_remote_address
    from app.backend.utils.rate_limit_tracker import is_rate_limited, mark_rate_limited

    client_ip = get_remote_address()
    if is_rate_limited(client_ip, 'groq_api'):
        logging.warning(f"Rate limit already known to be exceeded for {client_ip}, using fallback")
        return generate_fallback_question(job_role, previous_questions, previous_answers, cv_data, is_new_session)

    try:
        # Generate question using Groq API
        question = groq_client.generate_interview_question(
            job_role=job_role,
            previous_questions=previous_questions,
            previous_answers=previous_answers,
            cv_data=cv_data,
            model=model,
            is_new_session=is_new_session,
            unique_id=unique_id
        )

        print(f"Generated question: {question}")

        response_data = {
            'success': True,
            'question': question,
            'metadata': {
                'model': model,
                'timestamp': datetime.now().isoformat()
            }
        }

        print(f"Returning response: {json.dumps(response_data)}")
        return jsonify(response_data)
    except Exception as e:
        error_message = f"Error generating question with Groq API: {str(e)}"
        print(error_message)
        logging.error(error_message)

        # Check if this is a rate limit error
        if "429" in str(e) or "rate limit" in str(e).lower() or "too many requests" in str(e).lower():
            logging.warning(f"Rate limit exceeded for {client_ip}, marking as rate limited")
            mark_rate_limited(client_ip, 'groq_api')
            return generate_fallback_question(job_role, previous_questions, previous_answers, cv_data, is_new_session)

        # For other errors, return a fallback but don't mark as rate limited
        return generate_fallback_question(job_role, previous_questions, previous_answers, cv_data, is_new_session)

def generate_fallback_question(job_role, previous_questions, previous_answers, cv_data, is_new_session):
    """
    Generate a fallback question when the Groq API is unavailable or rate limited
    """
    logging.info(f"Generating fallback question (is_new_session: {is_new_session})")

    # Force is_new_session to True if this is the first question
    if len(previous_questions) == 0:
        is_new_session = True
        logging.info("Forcing is_new_session to True for first question")

    try:
        # First try to use the local LLM if available
        from app.backend.utils.ollama_client import ollama_client
        from app.backend.utils.check_ollama import check_ollama_status

        # Check if Ollama is running
        ollama_status = check_ollama_status()
        if ollama_status.get('running', False):
            # Determine which model to use based on what's available
            available_models = ollama_status.get('available_models', [])
            model_to_use = None

            # Prefer smaller models for faster response
            for model in ['phi3:mini', 'llama3:8b', 'llama3', 'gemma:2b']:
                if model in available_models:
                    model_to_use = model
                    break

            if model_to_use:
                logging.info(f"Using local Ollama model {model_to_use} for fallback")

                # Construct a simple prompt
                prompt = f"""You are an expert job interview coach. Generate a thoughtful interview question for a {job_role} position.

                Previous questions asked:
                {chr(10).join(previous_questions) if previous_questions else "None"}

                Previous answers:
                {chr(10).join(previous_answers) if previous_answers else "None"}

                Generate a new question that doesn't overlap with previous questions.
                """

                # Add CV data if available
                if cv_data:
                    prompt += f"\n\nCandidate CV information:\n"
                    if "skills" in cv_data and cv_data["skills"]:
                        prompt += f"Skills: {', '.join(cv_data['skills'])}\n"
                    if "experience" in cv_data and cv_data["experience"]:
                        prompt += f"Experience: {cv_data['experience']}\n"
                    if "education" in cv_data and cv_data["education"]:
                        prompt += f"Education: {cv_data['education']}\n"
                    prompt += "\nPersonalize the question based on this background if relevant."

                # Add instruction for new session
                if is_new_session:
                    prompt += "\n\nThis is a new interview session, so start with an appropriate introductory question."

                # Generate response with Ollama
                response, success = ollama_client.generate(
                    prompt=prompt,
                    model=model_to_use,
                    temperature=0.7,
                    max_tokens=256,
                    timeout=30
                )

                if success:
                    # Clean up the response
                    response = response.strip()

                    # Return the generated question
                    return jsonify({
                        'success': True,
                        'question': response,
                        'metadata': {
                            'model': f"fallback:{model_to_use}",
                            'timestamp': datetime.now().isoformat()
                        }
                    })

        # If Ollama is not available or failed, use pre-defined questions
        logging.info("Using pre-defined questions for fallback")

        # Determine the stage based on the number of previous questions
        question_count = len(previous_questions)

        # Main question selection logic based on question count
        if question_count == 0 or is_new_session:
            # First question - introductory with more variety
            # Always treat as a new session if question_count is 0 or is_new_session is True
            if cv_data and (cv_data.get('skills') or cv_data.get('experience')):
                # Personalized first questions with CV - more variety
                skills = cv_data.get('skills', [])
                experience = cv_data.get('experience', [])

                # Create a pool of personalized questions
                personalized_questions = []

                # Add skill-based questions if skills are available
                if skills and len(skills) > 0:
                    # Get a random skill from the top 3 skills
                    skill_count = min(3, len(skills))
                    skill_index = random.randint(0, skill_count - 1)
                    skill = skills[skill_index]

                    personalized_questions.extend([
                        f"Hello! I've reviewed your CV and noticed your experience with {skill}. Could you tell me about a specific challenging project where you applied this skill and what obstacles you had to overcome?",
                        f"I see from your CV that you have experience with {skill}. Could you share how you've developed this skill throughout your career?",
                        f"Your CV mentions {skill} as one of your skills. Could you tell me about a situation where this skill was particularly valuable in your work?",
                        f"I noticed {skill} listed in your CV. How do you stay current with developments in this area?",
                        f"Based on your CV, I see you have experience with {skill}. How have you applied this in your recent work?"
                    ])

                # Add experience-based questions if experience is available
                if experience and len(experience) > 0:
                    personalized_questions.extend([
                        f"I've reviewed your CV and I'm interested in your professional journey. Could you walk me through your experience and what led you to pursue a career in {job_role}?",
                        f"Your CV shows an interesting career path. What aspects of your experience do you think are most relevant to the {job_role} position?",
                        f"Based on your CV, I'd like to hear more about your professional background. What experiences have been most formative in your career development?",
                        f"I've had a chance to review your CV. Could you tell me about a recent project you've worked on and what your role was?",
                        f"Looking at your experience in your CV, what would you say has been your most significant professional achievement so far?"
                    ])

                # If we have personalized questions, choose one randomly
                if personalized_questions:
                    # Use multiple sources of randomness for better variety
                    random_seed = random.randint(0, 10000) + int(time.time() % 100)
                    random.seed(random_seed)
                    question = random.choice(personalized_questions)
                else:
                    # Fallback if no personalized questions could be created
                    question = f"Hello! I've reviewed your CV. Could you tell me about a challenging project you've worked on recently and how it relates to the {job_role} position you're applying for?"
            else:
                # Generic first questions without CV - more variety
                generic_questions = [
                    f"Hello! Thank you for joining this interview. To get started, could you please tell me a bit about yourself and your background in {job_role}?",
                    f"Welcome to our interview. I'd love to hear about your professional journey and what led you to pursue a career in {job_role}.",
                    f"Thank you for taking the time to interview with us today. To begin, could you share a bit about your experience and what interests you most about the {job_role} field?",
                    f"It's great to meet you. To start our conversation, I'd like to hear about your professional background and what aspects of {job_role} you're most passionate about.",
                    f"Welcome! To kick things off, could you tell me about your career path so far and what attracted you to the {job_role} field?",
                    f"Thank you for joining us today. I'd like to start by learning more about your professional experience and what you're looking for in your next role.",
                    f"Hello and welcome! To begin, I'd love to hear about your professional journey and the skills you've developed that are relevant to the {job_role} position."
                ]

                # Use multiple sources of randomness for better variety
                random_seed = random.randint(0, 10000) + int(time.time() % 100)
                random.seed(random_seed)
                question = random.choice(generic_questions)
        elif question_count < 3:
            # Early questions with more variety
            questions = [
                f"What aspects of being a {job_role} do you find most engaging and why?",
                f"How do you stay updated with the latest trends and developments in the {job_role} field?",
                f"What do you consider to be your greatest strength as a {job_role}?",
                f"Could you describe your approach to problem-solving in your role as a {job_role}?",
                f"What initially attracted you to a career in {job_role}?",
                f"How would you describe your work style when collaborating with others?",
                f"What do you find most challenging about working in the {job_role} field?",
                f"How do you approach learning new skills relevant to your role?",
                f"What professional achievement are you most proud of so far?",
                f"How do you maintain a good work-life balance in your role as a {job_role}?"
            ]
            # Use a combination of question count and random selection for more variety
            random_index = (question_count + random.randint(0, len(questions) - 1)) % len(questions)
            question = questions[random_index]
        elif question_count < 7:
            # Middle questions - behavioral with more variety
            questions = [
                f"Tell me about a time when you had to adapt quickly to a significant change at work. How did you handle it?",
                f"Describe a situation where you had to resolve a conflict within your team. What approach did you take?",
                f"Can you share an example of a project that didn't go as planned? How did you respond to the challenges?",
                f"Tell me about a time when you had to work under pressure to meet a deadline. How did you manage it?",
                f"Describe a situation where you had to make a difficult decision with limited information.",
                f"Can you tell me about a time when you had to learn a new skill quickly for a project? How did you approach it?",
                f"Describe a situation where you had to persuade others to adopt your idea or approach.",
                f"Tell me about a time when you received constructive criticism. How did you respond to it?",
                f"Can you share an example of when you had to prioritize multiple important tasks? How did you decide what to focus on?",
                f"Describe a situation where you had to work with someone whose working style was very different from yours.",
                f"Tell me about a time when you identified a problem before others noticed it. What did you do?",
                f"Can you share an experience where you had to step outside your comfort zone professionally?",
                f"Describe a situation where you had to deliver difficult news to a team member or stakeholder.",
                f"Tell me about a time when you had to motivate a team during a challenging period."
            ]
            # Use a combination of question count and random selection for more variety
            random_index = (question_count + random.randint(0, len(questions) - 1)) % len(questions)
            question = questions[random_index]

        elif question_count < 11:
            # Later middle questions - technical/situational with more variety
            questions = [
                f"How do you approach learning new skills or technologies required for your role as a {job_role}?",
                f"What strategies do you use to ensure your work is of high quality?",
                f"How do you prioritize tasks when you have multiple deadlines to meet?",
                f"Describe your approach to collaborating with team members who have different working styles.",
                f"How do you handle feedback, both positive and constructive?",
                f"What methods do you use to stay organized and manage your time effectively?",
                f"How do you approach troubleshooting complex problems in your work?",
                f"What tools or frameworks do you find most valuable in your role as a {job_role}?",
                f"How do you ensure that you're communicating effectively with stakeholders from different backgrounds?",
                f"What's your approach to documenting your work and sharing knowledge with your team?",
                f"How do you balance attention to detail with the need to meet deadlines?",
                f"What strategies do you use to maintain focus during challenging or repetitive tasks?",
                f"How do you approach making technical decisions when there are multiple valid solutions?",
                f"What methods do you use to measure the success or impact of your work?",
                f"How do you stay motivated when working on long-term projects with distant outcomes?"
            ]
            # Use a combination of question count and timestamp for more variety
            timestamp_factor = int(time.time()) % len(questions)
            random_index = (question_count + timestamp_factor + random.randint(0, 3)) % len(questions)
            question = questions[random_index]

        elif question_count < 14:
            # Late questions - strategic with more variety
            questions = [
                f"Where do you see the {job_role} field evolving in the next few years, and how are you preparing for these changes?",
                f"What do you consider to be the most significant challenge facing professionals in the {job_role} field today?",
                f"How do you balance technical considerations with business requirements in your role?",
                f"What approach would you take if asked to lead a project with team members who have more experience than you?",
                f"How would you handle a situation where you strongly disagreed with a decision made by your manager?",
                f"What strategies would you implement to foster innovation in a team that's resistant to change?",
                f"How would you approach scaling a successful small project to a larger audience or user base?",
                f"What methods would you use to evaluate the effectiveness of a new process or technology in your team?",
                f"How would you handle a situation where you need to implement significant changes with limited resources?",
                f"What approach would you take to build consensus among stakeholders with competing priorities?",
                f"How do you think about balancing short-term deliverables with long-term strategic goals?",
                f"What strategies would you use to maintain team morale during a challenging project or organizational change?",
                f"How would you approach mentoring junior team members while managing your own workload?",
                f"What methods would you use to stay aligned with business objectives while working on technical projects?",
                f"How would you handle a situation where you need to deliver bad news to senior leadership?"
            ]
            # Use a combination of session ID, question count, and random selection for more variety
            session_factor = hash(str(data.get('sessionId', ''))) % len(questions)
            random_index = (question_count + session_factor + random.randint(0, 5)) % len(questions)
            question = questions[random_index]

        else:
            # Final questions - closing with more variety
            questions = [
                f"What aspects of the {job_role} position are you most excited about?",
                f"What are you looking for in your next role that your current or previous position doesn't offer?",
                f"How do you see your career evolving in the next few years?",
                f"What do you think would be your biggest challenge in this role?",
                f"What questions do you have about the role or the company that I haven't addressed?",
                f"What would you hope to accomplish in your first 90 days in this {job_role} position?",
                f"How would your previous colleagues or managers describe your work style?",
                f"What aspects of company culture are most important to you?",
                f"What do you think sets you apart from other candidates for this {job_role} position?",
                f"How do you define success in your role as a {job_role}?",
                f"What motivates you to perform at your best in your professional life?",
                f"What additional skills or experiences are you hoping to gain in your next role?",
                f"How do you approach maintaining a healthy work-life balance?",
                f"What would you like me to know about you that we haven't discussed yet?",
                "Thank you for completing this interview session. You've provided valuable insights throughout our conversation. This concludes our interview. I hope you found this practice helpful for your upcoming interviews."
            ]

            # Special case for the very last question (15th question)
            if question_count >= 14:
                # Use the thank you message as the final question
                question = questions[-1]
            else:
                # Use a combination of multiple factors for more variety
                timestamp_factor = int(time.time() / 100) % (len(questions) - 1)  # Exclude the thank you message
                session_factor = hash(str(data.get('sessionId', ''))) % (len(questions) - 1)
                random_factor = random.randint(0, len(questions) - 2)  # Exclude the thank you message

                # Combine factors for a more varied selection
                random_index = (question_count + timestamp_factor + session_factor + random_factor) % (len(questions) - 1)
                question = questions[random_index]

        return jsonify({
            'success': True,
            'question': question,
            'metadata': {
                'model': 'fallback:predefined',
                'timestamp': datetime.now().isoformat()
            }
        })

    except Exception as e:
        logging.error(f"Error generating fallback question: {str(e)}")

        # Ultimate fallback - return a more realistic greeting for new sessions
        if is_new_session:
            question = f"Hello! I'm Sarah, and I'll be conducting your interview today. Thank you for joining us. To get started, could you please tell me a bit about yourself and what position you're interviewing for?"
        else:
            question = f"Thank you for sharing that. Could you tell me more about your specific experience in the {job_role} field? I'm particularly interested in any challenges you've faced and how you've overcome them."

        return jsonify({
            'success': True,
            'question': question,
            'metadata': {
                'model': 'fallback:generic',
                'timestamp': datetime.now().isoformat()
            }
        })

@bp.route('/groq/analyze', methods=['POST'])
@cross_origin(origins="http://localhost:3000", supports_credentials=True)
def analyze_groq_response():
    """
    Analyze a candidate's response using Groq API with STAR framework
    """
    data = request.get_json()

    # Extract parameters from request
    question = data.get('question')
    answer = data.get('answer')
    model = data.get('model')
    previous_questions = data.get('previousQuestions', [])
    previous_answers = data.get('previousAnswers', [])

    if not question or not answer:
        return jsonify({
            'success': False,
            'error': 'Question and answer are required'
        }), 400

    try:
        # Analyze response using Groq API with enhanced STAR framework
        analysis = groq_client.analyze_response(
            question=question,
            answer=answer,
            model=model,
            previous_questions=previous_questions,
            previous_answers=previous_answers
        )

        # Log analysis for debugging
        logging.info(f"Analysis completed for question: {question[:50]}...")

        # Add metadata about the analysis context
        analysis_metadata = {
            'model': model,
            'timestamp': datetime.now().isoformat(),
            'question_type': 'behavioral' if analysis.get('is_behavioral_question', False) else 'general',
            'context_size': len(previous_questions)
        }

        return jsonify({
            'success': True,
            'analysis': analysis,
            'metadata': analysis_metadata
        })
    except Exception as e:
        logging.error(f"Error analyzing response with Groq API: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/groq/models', methods=['GET'])
@cross_origin(origins="http://localhost:3000", supports_credentials=True)
def get_groq_models():
    """
    Get available Groq models
    """
    try:
        models_data = groq_client.get_available_models()
        default_model = os.getenv("GROQ_DEFAULT_MODEL", "llama3-8b-8192")

        # Extract just the model IDs from the model objects
        model_ids = [model["id"] for model in models_data]

        return jsonify({
            'success': True,
            'models': model_ids,
            'default_model': default_model
        })
    except Exception as e:
        logging.error(f"Error getting Groq models: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/groq/chat', methods=['POST'])
@cross_origin(origins="http://localhost:3000", supports_credentials=True)
def groq_chat():
    """
    General chat endpoint using Groq API
    """
    data = request.get_json()

    # Extract parameters from request
    message = data.get('message')
    context = data.get('context', [])
    model = data.get('model')

    if not message:
        return jsonify({
            'success': False,
            'error': 'Message is required'
        }), 400

    try:
        # Send message to Groq API
        response = groq_client.send_message(
            message=message,
            model=model,
            context=context
        )

        return jsonify({
            'success': True,
            'response': response,
            'metadata': {
                'model': model,
                'timestamp': datetime.now().isoformat()
            }
        })
    except Exception as e:
        logging.error(f"Error in chat with Groq API: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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
    # Using llama3 for better quality responses
    model_name = "llama3"  # Better quality model
    # Fallback to phi3:mini if llama3 is not available
    from app.backend.utils.check_ollama import check_ollama_status, fix_ollama_issues

    # Check Ollama status
    status = check_ollama_status(model_name)
    if not (status["installed"] and status["running"] and status["model_available"]):
        logging.error(f"Ollama status check failed: {status['status']}")

        # If llama3 is not available, try phi3:mini as fallback
        if model_name == "llama3" and not status["model_available"] and status["installed"] and status["running"]:
            logging.info("Llama3 not available, falling back to phi3:mini")
            model_name = "phi3:mini"
            status = check_ollama_status(model_name)

            # If phi3:mini is available, continue with that
            if status["model_available"]:
                logging.info("Successfully switched to phi3:mini")
            else:
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

    # We no longer need to handle first messages specially since the frontend handles this
    # The frontend already displays an initial message

    # Get CV analysis from request if available
    frontend_cv_analysis = data.get('cvAnalysis') if data else None
    if frontend_cv_analysis and not session.get('cv_analysis'):
        # Store CV analysis in session if not already there
        session['cv_analysis'] = frontend_cv_analysis
        session.modified = True

    # Get the conversation mode from the request
    conversation_mode = data.get('mode', 'interview')  # Default to interview mode

    # Initialize chat history if not present
    if 'chat_history' not in session:
        session['chat_history'] = []

    # Get the last question asked to prevent repetition
    last_questions = []
    for role, message in session.get('chat_history', []):
        if role == "assistant" and any(q in message.lower() for q in ["tell me about", "could you describe", "how would you", "what is your"]):
            last_questions.append(message)

    # Use profile and CV analysis from session for context-aware, job-specific prompts
    profile = session.get('profile')
    cv_analysis = session.get('cv_analysis')

    if profile:
        # Get target job from profile or CV analysis
        target_job = profile.get('target_job', 'N/A')
        if target_job == 'N/A' and cv_analysis and cv_analysis.get('target_job'):
            target_job = cv_analysis.get('target_job')

        # Build detailed profile string - WITHOUT including the candidate's name
        profile_str = (
            f"Candidate Profile (for context only - do not address candidate by name):\n"
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

        # Add conversation history context (last 4 exchanges maximum)
        chat_history = session.get('chat_history', [])
        history_context = ""
        if chat_history:
            # Only include the last 4 exchanges to keep context manageable
            recent_history = chat_history[-8:] if len(chat_history) > 8 else chat_history
            history_context = "\nConversation history (most recent):\n"
            for role, message in recent_history:
                role_name = "User" if role == "user" else "Interview Coach"
                history_context += f"{role_name}: {message}\n"

        # Add information about previous questions to avoid repetition
        previous_questions_context = ""
        if last_questions:
            previous_questions_context = "\nPrevious questions asked (DO NOT REPEAT THESE):\n"
            for question in last_questions[-3:]:  # Only include the last 3 questions
                previous_questions_context += f"- {question}\n"

        # Add conversation mode context
        mode_context = f"\nCurrent mode: {conversation_mode.upper()} mode"

        # Construct the full prompt with all context
        full_prompt = f"{profile_str}{cv_context}{mode_context}{previous_questions_context}{history_context}\n\n{system_prompt}\n\nUser: {user_message}\nInterview Coach:"
    else:
        # Use simplified prompt to reduce response time
        system_prompt = get_simplified_system_prompt()

        # Add conversation history context (last 4 exchanges maximum)
        chat_history = session.get('chat_history', [])
        history_context = ""
        if chat_history:
            # Only include the last 4 exchanges to keep context manageable
            recent_history = chat_history[-8:] if len(chat_history) > 8 else chat_history
            history_context = "\nConversation history (most recent):\n"
            for role, message in recent_history:
                role_name = "User" if role == "user" else "Interview Coach"
                history_context += f"{role_name}: {message}\n"

        # Add information about previous questions to avoid repetition
        previous_questions_context = ""
        if last_questions:
            previous_questions_context = "\nPrevious questions asked (DO NOT REPEAT THESE):\n"
            for question in last_questions[-3:]:  # Only include the last 3 questions
                previous_questions_context += f"- {question}\n"

        # Add conversation mode context
        mode_context = f"\nCurrent mode: {conversation_mode.upper()} mode"

        # Construct the full prompt with all context
        full_prompt = f"{mode_context}{previous_questions_context}{history_context}\n\n{system_prompt}\n\nUser: {user_message}\nInterview Coach:"

    try:
        # Use our enhanced Ollama client
        from app.backend.utils.ollama_client import ollama_client

        # Track request timing for performance monitoring
        start_time = time.time()

        # Add debug logging
        logging.info(f"Attempting to generate response with model: {model_name}")
        logging.info(f"Prompt length: {len(full_prompt)} characters")

        try:
            # Generate response with optimized parameters for Llama3
            # Note: Using only parameters supported by the generate method
            llama_raw, success = ollama_client.generate(
                prompt=full_prompt,
                model=model_name,
                temperature=0.7,  # Higher temperature for more creative outputs
                max_tokens=500,   # Increased token limit for more detailed responses
                timeout=60        # Increased timeout for larger model
            )
        except Exception as e:
            logging.error(f"Error during ollama_client.generate: {str(e)}")
            # Return a simple fallback response
            return jsonify({
                'reply': "I'm having trouble connecting to the AI model. Please try again in a moment.",
                'analysis': "Error connecting to model",
                'strengths': ["Your patience"],
                'improvement_tips': ["Please try again"],
                'star_scores': {"Situation": 0, "Task": 0, "Action": 0, "Result": 0},
                'overall_score': 0,
                'error': str(e)
            })

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

                # Try multiple parsing strategies with improved handling
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

                        # Fix trailing commas in arrays and objects
                        fixed_json = re.sub(r',\s*}', '}', fixed_json)
                        fixed_json = re.sub(r',\s*]', ']', fixed_json)

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
                                fixed_full = re.sub(r',\s*}', '}', fixed_full)
                                fixed_full = re.sub(r',\s*]', ']', fixed_full)

                                try:
                                    parsed = json.loads(fixed_full)
                                    logging.info("Successfully parsed JSON after fixing full response")
                                except json.JSONDecodeError:
                                    logging.error("All JSON parsing attempts failed")
                                    # Return fallback response
                                    fallback = get_fallback_response()
                                    return jsonify(fallback)
                else:
                    try:
                        parsed = json.loads(cleaned_response)
                        logging.info("Successfully parsed JSON from full response")
                    except json.JSONDecodeError:
                        logging.error("Failed to parse JSON from full response")
                        # Return fallback response
                        fallback = get_fallback_response()
                        return jsonify(fallback)

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