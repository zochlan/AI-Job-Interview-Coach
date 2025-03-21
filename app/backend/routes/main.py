from flask import Blueprint, request, jsonify, g
from ..nlp import analyze_response
from ..db import get_db
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3

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