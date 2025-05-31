import os
import logging
import time
import re
from datetime import datetime
from flask import Blueprint, request, jsonify, session
from werkzeug.utils import secure_filename
from app.backend.nlp.advanced_analysis import parse_cv
from app.backend.middleware import track_performance
from app.backend.db import get_db
from app.backend.db.models import InterviewSession, Response, Feedback

bp = Blueprint('cv', __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@bp.route('/api/upload-cv', methods=['POST'])
@track_performance(slow_threshold=5.0)  # CV parsing can be slow, so set a higher threshold
def upload_cv():
    """
    Upload and analyze a CV (PDF or DOCX). Returns a structured profile with section-by-section analysis, skills, ATS/bias checks, and actionable recommendations.
    Response includes: name, email, skills, education, experience, target_job, sections, section_scores, ats_report, bias_report, language_report, summary, recommendations.
    """

    # Track request timing for performance monitoring
    start_time = time.time()

    try:
        # Validate request
        if 'cv' not in request.files:
            return jsonify({'error': 'No file uploaded.', 'details': 'Please select a file to upload.'}), 400

        file = request.files['cv']
        if file.filename == '':
            return jsonify({'error': 'No selected file.', 'details': 'The selected file has no name.'}), 400

        # Check file extension
        allowed_extensions = ['.pdf', '.doc', '.docx', '.txt']
        file_ext = os.path.splitext(file.filename.lower())[1]
        if file_ext not in allowed_extensions:
            return jsonify({
                'error': 'Invalid file type.',
                'details': f'Please upload a file with one of these extensions: {", ".join(allowed_extensions)}'
            }), 400

        # Create a unique filename to prevent overwriting
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = secure_filename(f"{timestamp}_{file.filename}")
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        # Ensure upload directory exists
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        # Save the file
        try:
            file.save(filepath)
            logging.info(f"CV saved to {filepath}")
        except Exception as e:
            logging.error(f"Failed to save file: {e}")
            return jsonify({'error': 'Failed to save file.', 'details': str(e)}), 500

        # Process the CV
        try:
            # Parse the CV
            profile = parse_cv(filepath)

            # Check if user is authenticated
            user_id = session.get('user_id')

            # Save to session
            session['profile'] = profile
            session['cv_filepath'] = filepath  # Store filepath in session for potential reuse

            # If user is authenticated, also store with user-specific prefix
            if user_id:
                session[f'profile_{user_id}'] = profile
                session[f'cv_filepath_{user_id}'] = filepath

            # Store CV analysis data separately for chatbot context
            cv_analysis = {
                'target_job': profile.get('target_job', ''),
                'skills': profile.get('skills', []),
                'summary': profile.get('summary', ''),
                'recommendations': profile.get('recommendations', []),
                'ats_report': profile.get('ats_report', {}),
                'section_scores': profile.get('section_scores', {})
            }

            session['cv_analysis'] = cv_analysis

            # If user is authenticated, also store with user-specific prefix
            if user_id:
                session[f'cv_analysis_{user_id}'] = cv_analysis

            session.modified = True

            # Clean up the file after successful processing
            try:
                os.remove(filepath)
            except Exception as e:
                logging.warning(f"Failed to remove temporary file {filepath}: {e}")

            # Log processing time
            processing_time = time.time() - start_time
            logging.info(f"CV processed in {processing_time:.2f} seconds")

            # Explicitly return all fields for frontend clarity
            return jsonify({
                'name': profile.get('name'),
                'email': profile.get('email'),
                'phone': profile.get('phone', ''),
                'location': profile.get('location', ''),
                'skills': profile.get('skills', []),
                'education': profile.get('education', ''),
                'experience': profile.get('experience', ''),
                'target_job': profile.get('target_job', ''),
                'sections': profile.get('sections', {}),
                'section_scores': profile.get('section_scores', {}),
                'ats_report': profile.get('ats_report', {}),
                'bias_report': profile.get('bias_report', {}),
                'language_report': profile.get('language_report', {}),
                'summary': profile.get('summary', ''),
                'recommendations': profile.get('recommendations', []),
                'complex_format_detected': profile.get('complex_format_detected', False),
                'lastUpdated': profile.get('lastUpdated', datetime.now().isoformat()),
                'processing_time': f"{processing_time:.2f} seconds"
            })

        except ImportError as e:
            logging.error(f"Dependency error in CV parsing: {e}")
            return jsonify({
                'error': 'Required library missing for CV parsing.',
                'details': 'Please ensure all dependencies are installed.',
                'technical_details': str(e)
            }), 500

        except ValueError as e:
            logging.error(f"Value error in CV parsing: {e}")

            # Try to extract basic information even if full parsing fails
            try:
                # Create a minimal profile with whatever we can extract
                minimal_profile = create_minimal_profile(filepath)
                session['profile'] = minimal_profile

                # Check if user is authenticated
                user_id = session.get('user_id')

                # If user is authenticated, also store with user-specific prefix
                if user_id:
                    session[f'profile_{user_id}'] = minimal_profile

                # Store minimal CV analysis data for chatbot context
                cv_analysis = {
                    'skills': minimal_profile.get('skills', []),
                    'education': minimal_profile.get('education', ''),
                    'experience': minimal_profile.get('experience', '')
                }

                session['cv_analysis'] = cv_analysis

                # If user is authenticated, also store with user-specific prefix
                if user_id:
                    session[f'cv_analysis_{user_id}'] = cv_analysis

                session.modified = True

                return jsonify({
                    'name': minimal_profile.get('name', 'User'),
                    'email': minimal_profile.get('email', ''),
                    'phone': minimal_profile.get('phone', ''),
                    'location': minimal_profile.get('location', ''),
                    'skills': minimal_profile.get('skills', []),
                    'education': minimal_profile.get('education', []),
                    'experience': minimal_profile.get('experience', []),
                    'summary': minimal_profile.get('summary', ''),
                    'complex_format_detected': minimal_profile.get('complex_format_detected', False),
                    'lastUpdated': minimal_profile.get('lastUpdated', datetime.now().isoformat()),
                    'warning': 'Your CV was partially processed. Some features may be limited.',
                    'error_details': str(e)
                })
            except:
                return jsonify({
                    'error': 'Invalid CV file.',
                    'details': 'The file could not be processed. Please check the format and try again.',
                    'technical_details': str(e)
                }), 400

        except Exception as e:
            logging.error(f"Unexpected error in CV parsing: {e}")
            return jsonify({
                'error': 'Failed to parse CV.',
                'details': 'An unexpected error occurred while processing your CV.',
                'technical_details': str(e),
                'suggestions': [
                    'Try uploading a different file format (PDF, DOCX, or TXT)',
                    'Ensure your CV is not password protected',
                    'Check if the file is corrupted by opening it in another application'
                ]
            }), 500

    except Exception as e:
        processing_time = time.time() - start_time
        logging.error(f"Fatal error in upload_cv after {processing_time:.2f} seconds: {e}")
        return jsonify({
            'error': 'Internal server error',
            'details': 'A server error occurred while processing your request.',
            'technical_details': str(e)
        }), 500

def create_minimal_profile(filepath):
    """Create a minimal profile from a CV file when full parsing fails."""
    import re
    import spacy
    import traceback
    from app.backend.nlp.advanced_analysis import extract_name, extract_skills, extract_education, extract_experience, extract_text_from_document, create_minimal_profile_from_text
    from app.backend.nlp.skill_keywords import ALL_SKILLS, SKILL_CATEGORIES

    try:
        # First try to use the specialized extraction functions
        try:
            from app.backend.nlp.specialized_extraction import (
                detect_complex_resume,
                extract_spaced_name,
                extract_contact_info_complex,
                extract_education_complex,
                extract_experience_complex,
                extract_summary_complex,
                extract_skills_complex
            )

            # Extract text from document
            text = extract_text_from_document(filepath)

            # Check if this is a complex resume format
            is_complex_format = detect_complex_resume(text)

            if is_complex_format:
                logging.info("Detected complex resume format. Using specialized extraction functions.")

                # Extract name
                name = extract_spaced_name(text)

                # Extract contact info
                contact_info = extract_contact_info_complex(text)

                # Extract education
                education = extract_education_complex(text)

                # Extract experience
                experience = extract_experience_complex(text)

                # Extract summary
                summary = extract_summary_complex(text)

                # Extract skills
                skills = extract_skills_complex(text)

                # Create profile
                profile = {
                    'name': name,
                    'email': contact_info.get('email', ''),
                    'phone': contact_info.get('phone', ''),
                    'location': contact_info.get('location', ''),
                    'skills': skills,
                    'education': education,
                    'experience': experience,
                    'summary': summary,
                    'uploaded': True,
                    'complex_format_detected': True,
                    'lastUpdated': datetime.now().isoformat(),
                    'raw_text': text[:5000]  # Limit text size
                }

                return profile
        except Exception as e:
            logging.error(f"Error using specialized extraction: {e}")
            logging.error(f"Traceback: {traceback.format_exc()}")
            # Fall back to standard extraction

        # Extract text from document using our improved function
        text = extract_text_from_document(filepath)

        # Load NLP model
        try:
            nlp = spacy.load("en_core_web_sm")
            doc = nlp(text[:100000])  # Limit to 100K chars to prevent memory issues
        except Exception as e:
            logging.error(f"Error loading spaCy model: {e}")
            doc = None

        # Extract name using our improved function
        name = extract_name(text, doc) if doc else ""

        # Extract contact information
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        email = emails[0] if emails else ""

        # Extract phone numbers
        phone_patterns = [
            r'\b(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',  # (123) 456-7890, 123-456-7890
            r'\b\d{3}[-.\s]?\d{4}\b',  # 123-4567
            r'\b\+\d{1,3}[-.\s]?\d{9,10}\b',  # +1 1234567890
            r'\+\d{1,3}\s\d{2,3}\s\d{3}\s\d{4}'  # +971 50 886 9024
        ]

        phone = ""
        for pattern in phone_patterns:
            phones = re.findall(pattern, text)
            if phones:
                phone = phones[0]
                break

        # Extract location
        location_patterns = [
            r'(?:[A-Z][a-z]+(?:[-\s]+[A-Z][a-z]+)*),\s*(?:[A-Z][a-z]+(?:[-\s]+[A-Z][a-z]+)*)',  # City, Country
            r'(?:Location|Address|City|Country):\s*([^,\n]+(?:,\s*[^,\n]+)*)',  # Location: City, Country
            r'(?:residing in|based in|located in)\s+([^,\n]+(?:,\s*[^,\n]+)*)'  # residing in City, Country
        ]

        location = ""
        for pattern in location_patterns:
            location_matches = re.findall(pattern, text, re.IGNORECASE)
            if location_matches:
                location = location_matches[0]
                break

        # Extract sections
        sections = {}
        section_headers = {
            "summary": ["summary", "profile", "objective", "professional summary", "about me"],
            "experience": ["experience", "work experience", "professional experience", "employment history", "work history"],
            "education": ["education", "academic background", "educational background", "academic history", "qualifications"],
            "skills": ["skills", "technical skills", "core competencies", "key skills", "expertise"]
        }

        for section_name, headers in section_headers.items():
            for header in headers:
                pattern = re.compile(rf"(?i)\b{re.escape(header)}\b.*?(?:\n|:)(.*?)(?:\n\n|\n[A-Z][A-Za-z\s]+:|\Z)", re.DOTALL)
                match = pattern.search(text)
                if match:
                    sections[section_name] = match.group(1).strip()
                    break

        # Extract skills using our improved function
        skills_section = sections.get("skills", "")
        skills = extract_skills(text, skills_section, doc) if doc else []

        # If no skills found, use a simpler approach
        if not skills:
            # Scan the entire document for skills
            skills = []
            for skill in ALL_SKILLS:
                if len(skill) >= 4 and re.search(r'\b' + re.escape(skill) + r'\b', text.lower()):
                    skills.append(skill.title())

            # Limit to top 20 skills
            if len(skills) > 20:
                skills = skills[:20]

        # Extract education and experience
        education_text = sections.get("education", "")
        experience_text = sections.get("experience", "")

        education_entries = extract_education(education_text, doc) if doc else []
        experience_entries = extract_experience(experience_text, doc) if doc else []

        # If structured extraction failed, use simpler approach
        if not education_entries:
            education_keywords = ["bachelor", "master", "phd", "doctorate", "degree", "diploma", "certificate", "high school"]
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            for line in lines:
                if any(kw in line.lower() for kw in education_keywords):
                    education_text = line
                    break

        if not experience_entries:
            job_keywords = ["engineer", "developer", "manager", "analyst", "specialist", "director", "assistant", "intern"]
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            for i, line in enumerate(lines):
                if any(kw in line.lower() for kw in job_keywords):
                    experience_text = line
                    if i + 1 < len(lines):
                        experience_text += "\n" + lines[i + 1]
                    break

        # Extract summary
        summary = sections.get("summary", "")
        if not summary:
            # Try to extract the first paragraph that looks like a summary
            paragraphs = text.split('\n\n')
            for i, para in enumerate(paragraphs):
                # Skip very short paragraphs
                if len(para) < 30:
                    continue

                # Skip paragraphs that look like headers or contact info
                if re.search(r'@|www|\+\d|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}', para):
                    continue

                # Skip paragraphs that start with common section headers
                if re.match(r'^(EDUCATION|EXPERIENCE|SKILLS|PROJECTS|CERTIFICATIONS|AWARDS)', para, re.IGNORECASE):
                    continue

                # This might be a summary paragraph
                summary = para.strip()
                break

        # Create the profile
        profile = {
            'name': name or 'User',
            'email': email,
            'phone': phone,
            'location': location,
            'skills': skills,
            'education': education_entries if education_entries else education_text,
            'experience': experience_entries if experience_entries else experience_text,
            'summary': summary,
            'raw_text': text[:5000],  # Limit text size
            'uploaded': True,
            'complex_format_detected': False,
            'lastUpdated': datetime.now().isoformat()
        }

        return profile

    except Exception as e:
        logging.error(f"Error in create_minimal_profile: {e}")
        logging.error(f"Traceback: {traceback.format_exc()}")

        # Try to use the minimal profile function from advanced_analysis
        try:
            text = extract_text_from_document(filepath)
            return create_minimal_profile_from_text(text)
        except Exception as e2:
            logging.error(f"Error in fallback to create_minimal_profile_from_text: {e2}")

            # Return a very minimal profile if everything fails
            return {
                'name': 'User',
                'email': '',
                'phone': '',
                'location': '',
                'skills': [],
                'education': [],
                'experience': [],
                'summary': '',
                'uploaded': True,
                'lastUpdated': datetime.now().isoformat(),
                'complex_format_detected': False
            }

@bp.route('/api/save-profile', methods=['POST'])
@track_performance()
def save_profile():
    """
    Save user profile and CV analysis to session.

    Expected JSON body:
    {
        "profile": {...},  // User profile data
        "cvAnalysis": {...}  // CV analysis data (optional)
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Check if user is authenticated
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401

        # Save profile to session with user ID prefix to isolate data
        if 'profile' in data:
            session[f'profile_{user_id}'] = data['profile']
            # Keep the unprefixed key for backward compatibility
            session['profile'] = data['profile']

        # Save CV analysis to session if provided
        if 'cvAnalysis' in data:
            session[f'cv_analysis_{user_id}'] = data['cvAnalysis']
            # Keep the unprefixed key for backward compatibility
            session['cv_analysis'] = data['cvAnalysis']

        # Mark session as modified
        session.modified = True

        return jsonify({'message': 'Profile saved successfully'}), 200
    except Exception as e:
        logging.error(f"Error saving profile: {str(e)}")
        return jsonify({'error': 'Failed to save profile', 'details': str(e)}), 500

@bp.route('/api/clear-profile', methods=['POST'])
@track_performance()
def clear_profile():
    """
    Clear user profile and CV analysis from session.
    """
    try:
        # Check if user is authenticated
        user_id = session.get('user_id')

        # Remove profile and CV analysis from session
        session.pop('profile', None)
        session.pop('cv_analysis', None)
        session.pop('cv_filepath', None)

        # Also remove user-specific prefixed data if user is authenticated
        if user_id:
            session.pop(f'profile_{user_id}', None)
            session.pop(f'cv_analysis_{user_id}', None)

        return jsonify({'message': 'Profile cleared successfully'}), 200
    except Exception as e:
        logging.error(f"Error clearing profile: {str(e)}")
        return jsonify({'error': 'Failed to clear profile', 'details': str(e)}), 500

@bp.route('/sessions', methods=['GET'])
@track_performance()
def get_sessions():
    """
    Get all interview sessions for the current user.
    """
    try:
        # Get user ID from session
        user_id = session.get('user_id')

        if not user_id:
            return jsonify({
                'sessions': [],
                'message': 'No authenticated user found. Returning empty sessions list.'
            }), 200

        # Get database connection
        db = get_db()

        # Query sessions for the user
        sessions = db.query(InterviewSession).filter_by(user_id=user_id).all()

        # Convert sessions to dictionaries
        sessions_data = []
        for s in sessions:
            session_dict = {
                'id': s.id,
                'user_id': s.user_id,
                'start_time': s.start_time.isoformat() if s.start_time else None,
                'end_time': s.end_time.isoformat() if s.end_time else None,
                'session_type': s.session_type,
                'responses_count': db.query(Response).filter_by(session_id=s.id).count()
            }
            sessions_data.append(session_dict)

        return jsonify({'sessions': sessions_data}), 200
    except Exception as e:
        logging.error(f"Error retrieving sessions: {str(e)}")
        return jsonify({'error': 'Failed to retrieve sessions', 'details': str(e)}), 500

@bp.route('/sessions', methods=['POST'])
@track_performance()
def create_session():
    """
    Create a new interview session for the current user.

    Expected JSON body:
    {
        "session_type": "interview" or "coach"
    }
    """
    try:
        # Get user ID from session
        user_id = session.get('user_id')

        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401

        # Get request data
        data = request.get_json()

        if not data or 'session_type' not in data:
            return jsonify({'error': 'Missing required field: session_type'}), 400

        session_type = data['session_type']

        # Validate session type
        if session_type not in ['interview', 'coach']:
            return jsonify({'error': 'Invalid session type. Must be "interview" or "coach"'}), 400

        # Get database connection
        db = get_db()

        # Create new session
        new_session = InterviewSession(
            user_id=user_id,
            session_type=session_type,
            start_time=datetime.now()
        )

        db.add(new_session)
        db.commit()

        # Generate first question if it's an interview session
        first_question = None
        if session_type == 'interview':
            # Get profile from session for context
            profile = session.get('profile', {})
            cv_analysis = session.get('cv_analysis', {})

            # Generate a default first question with a more conversational, human-like tone
            first_question = {
                'id': 1,
                'message': "Hi there! I'm Sarah, your interview coach for today. I'll be guiding you through some questions similar to what you might face in a real job interview. Let's start with something simple - could you tell me a bit about your professional background and the kind of role you're preparing for?",
                'timestamp': datetime.now().isoformat(),
                'isInterviewQuestion': True
            }

        return jsonify({
            'session_id': new_session.id,
            'first_question': first_question
        }), 201
    except Exception as e:
        logging.error(f"Error creating session: {str(e)}")
        return jsonify({'error': 'Failed to create session', 'details': str(e)}), 500

@bp.route('/sessions/<int:session_id>', methods=['GET'])
@track_performance()
def get_session_details(session_id):
    """
    Get details of a specific interview session including responses and feedback.
    """
    try:
        # Get user ID from session
        user_id = session.get('user_id')

        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401

        # Get database connection
        db = get_db()

        # Find the session
        interview_session = db.query(InterviewSession).filter_by(id=session_id, user_id=user_id).first()

        if not interview_session:
            return jsonify({'error': 'Session not found or not authorized'}), 404

        # Get responses for this session
        responses = db.query(Response).filter_by(session_id=session_id).all()

        # Get feedback for these responses
        feedback_items = []
        for response in responses:
            feedback = db.query(Feedback).filter_by(response_id=response.id).all()
            feedback_items.extend(feedback)

        # Convert to dictionaries
        session_dict = {
            'id': interview_session.id,
            'user_id': interview_session.user_id,
            'start_time': interview_session.start_time.isoformat() if interview_session.start_time else None,
            'end_time': interview_session.end_time.isoformat() if interview_session.end_time else None,
            'session_type': interview_session.session_type
        }

        responses_list = []
        for r in responses:
            response_dict = {
                'id': r.id,
                'session_id': r.session_id,
                'question_text': r.question_text,
                'response_text': r.response_text,
                'timestamp': r.timestamp.isoformat() if r.timestamp else None,
                'question_type': r.question_type
            }
            responses_list.append(response_dict)

        feedback_list = []
        for f in feedback_items:
            feedback_dict = {
                'id': f.id,
                'response_id': f.response_id,
                'feedback_text': f.feedback_text,
                'score': f.score,
                'category': f.category,
                'timestamp': f.timestamp.isoformat() if f.timestamp else None
            }
            feedback_list.append(feedback_dict)

        return jsonify({
            'session': session_dict,
            'responses': responses_list,
            'feedback': feedback_list
        }), 200
    except Exception as e:
        logging.error(f"Error retrieving session details: {str(e)}")
        return jsonify({'error': 'Failed to retrieve session details', 'details': str(e)}), 500

@bp.route('/sessions/<int:session_id>/responses', methods=['POST'])
@track_performance()
def add_response(session_id):
    """
    Add a response to an interview session.

    Expected JSON body:
    {
        "response_text": "User's response text",
        "question_text": "Optional question text"
    }
    """
    try:
        # Get user ID from session
        user_id = session.get('user_id')

        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401

        # Get request data
        data = request.get_json()

        if not data or 'response_text' not in data:
            return jsonify({'error': 'Missing required field: response_text'}), 400

        # Get database connection
        db = get_db()

        # Find the session
        interview_session = db.query(InterviewSession).filter_by(id=session_id, user_id=user_id).first()

        if not interview_session:
            return jsonify({'error': 'Session not found or not authorized'}), 404

        # Create new response
        new_response = Response(
            session_id=session_id,
            response_text=data['response_text'],
            question_text=data.get('question_text', ''),
            timestamp=datetime.now(),
            question_type='behavioral'  # Default type
        )

        db.add(new_response)
        db.commit()

        # Return the created response
        response_dict = {
            'id': new_response.id,
            'session_id': new_response.session_id,
            'question_text': new_response.question_text,
            'response_text': new_response.response_text,
            'timestamp': new_response.timestamp.isoformat() if new_response.timestamp else None,
            'question_type': new_response.question_type
        }

        return jsonify(response_dict), 201
    except Exception as e:
        db.rollback()
        logging.error(f"Error adding response: {str(e)}")
        return jsonify({'error': 'Failed to add response', 'details': str(e)}), 500

@bp.route('/sessions/<int:session_id>/end', methods=['POST'])
@track_performance()
def end_session(session_id):
    """
    End an interview session.
    """
    try:
        # Get user ID from session
        user_id = session.get('user_id')

        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401

        # Get database connection
        db = get_db()

        # Find the session
        interview_session = db.query(InterviewSession).filter_by(id=session_id, user_id=user_id).first()

        if not interview_session:
            return jsonify({'error': 'Session not found or not authorized'}), 404

        # Update end time
        interview_session.end_time = datetime.now()
        db.commit()

        return jsonify({'message': 'Session ended successfully'}), 200
    except Exception as e:
        db.rollback()
        logging.error(f"Error ending session: {str(e)}")
        return jsonify({'error': 'Failed to end session', 'details': str(e)}), 500

@bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@track_performance()
def delete_session(session_id):
    """
    Delete an interview session.
    """
    try:
        # Get user ID from session
        user_id = session.get('user_id')

        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401

        # Get database connection
        db = get_db()

        # Find the session
        interview_session = db.query(InterviewSession).filter_by(id=session_id, user_id=user_id).first()

        if not interview_session:
            return jsonify({'error': 'Session not found or not authorized'}), 404

        # Delete associated responses and feedback
        responses = db.query(Response).filter_by(session_id=session_id).all()
        for response in responses:
            # Delete feedback for this response
            db.query(Feedback).filter_by(response_id=response.id).delete()

        # Delete responses
        db.query(Response).filter_by(session_id=session_id).delete()

        # Delete the session
        db.delete(interview_session)
        db.commit()

        return jsonify({'message': 'Session deleted successfully'}), 200
    except Exception as e:
        db.rollback()
        logging.error(f"Error deleting session: {str(e)}")
        return jsonify({'error': 'Failed to delete session', 'details': str(e)}), 500
