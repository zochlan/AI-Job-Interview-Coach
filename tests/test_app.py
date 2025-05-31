import os
import tempfile
import pytest
from datetime import datetime
from app.backend.db.models import User, InterviewSession, Response, Feedback, QuestionType
from app.backend import create_app

@pytest.fixture
def app():
    """Create and configure a new app instance for testing."""
    app = create_app()
    
    with app.app_context():
        # init_db(app)
        
    yield app
    
    # Clean up
    with app.app_context():
        # db = get_db()
        # db.drop_all()

@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create a test runner for the app."""
    return app.test_cli_runner()

@pytest.fixture
def test_user(app):
    """Create a test user."""
    with app.app_context():
        # db = get_db()
        user = User(
            username='testuser',
            email='test@example.com',
            password_hash='hashed_password'
        )
        # db.add(user)
        # db.commit()
        return user

@pytest.fixture
def test_session(test_user):
    """Create a test interview session."""
    with test_user.app_context():
        # db = get_db()
        session = InterviewSession(
            user_id=test_user.id,
            session_type='behavioral'
        )
        # db.add(session)
        # db.commit()
        return session

@pytest.fixture
def test_response(test_session):
    """Create a test response."""
    with test_session.app_context():
        # db = get_db()
        response = Response(
            session_id=test_session.id,
            response_text='Test response'
        )
        # db.add(response)
        # db.commit()
        return response

@pytest.fixture
def test_feedback(test_response):
    """Create test feedback."""
    with test_response.app_context():
        # db = get_db()
        feedback = Feedback(
            response_id=test_response.id,
            feedback_text='Great response!',
            improvement_suggestions='None needed',
            professional_tone=0.9,
            clarity=0.85,
            completeness_score=0.95
        )
        # db.add(feedback)
        # db.commit()
        return feedback

def test_health_check(client):
    """Test health check endpoint."""
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json == {'status': 'healthy'}

def test_register(client, db_session):
    """Test user registration."""
    response = client.post('/auth/register', json={
        'username': 'new_user',
        'email': 'new@example.com',
        'password': 'test_password'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert 'user_id' in data
    
    # Verify user was created in database
    user = db_session.get(User, data['user_id'])
    assert user is not None
    assert user.email == 'new@example.com'

def test_login(client, db_session):
    """Test user login."""
    # First register a user
    client.post('/auth/register', json={
        'username': 'test_user',
        'email': 'test@example.com',
        'password': 'test_password'
    })
    
    # Try to log in
    response = client.post('/auth/login', json={
        'username': 'test_user',
        'password': 'test_password'
    })
    assert response.status_code == 200
    data = response.get_json()
    assert 'user_id' in data

def test_create_session(auth_client, db_session):
    """Test interview session creation."""
    response = auth_client.post('/api/sessions', json={
        'session_type': 'TECHNICAL'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert 'session_id' in data
    
    # Verify session was created in database
    session = db_session.get(InterviewSession, data['session_id'])
    assert session is not None
    assert session.session_type.name == 'TECHNICAL'

def test_analyze_response(auth_client, db_session):
    """Test response analysis."""
    # First create a session
    session_response = auth_client.post('/api/sessions', json={
        'session_type': 'TECHNICAL'
    })
    session_id = session_response.get_json()['session_id']
    
    # Submit a response for analysis
    response = auth_client.post(f'/api/sessions/{session_id}/responses', json={
        'response_text': 'I implemented a new feature using Python and React.'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert 'response_id' in data
    
    # Verify response was created
    response_record = db_session.get(Response, data['response_id'])
    assert response_record is not None
    assert response_record.response_text == 'I implemented a new feature using Python and React.'

def test_get_sessions(auth_client, db_session):
    """Test retrieving user sessions."""
    # Create a few sessions
    for session_type in ['TECHNICAL', 'BEHAVIORAL']:
        auth_client.post('/api/sessions', json={
            'session_type': session_type
        })
    
    # Get all sessions
    response = auth_client.get('/api/sessions')
    assert response.status_code == 200
    data = response.get_json()
    assert 'sessions' in data
    assert len(data['sessions']) == 2
    
    # Verify session types
    session_types = {s['session_type'] for s in data['sessions']}
    assert session_types == {'TECHNICAL', 'BEHAVIORAL'}

def test_get_session_responses(auth_client, db_session):
    """Test retrieving session responses."""
    # Create a session and add some responses
    session_response = auth_client.post('/api/sessions', json={
        'session_type': 'TECHNICAL'
    })
    session_id = session_response.get_json()['session_id']
    
    # Add responses
    responses = [
        'I implemented a new feature.',
        'I fixed a critical bug.'
    ]
    for text in responses:
        auth_client.post(f'/api/sessions/{session_id}/responses', json={
            'response_text': text
        })
    
    # Get all responses
    response = auth_client.get(f'/api/sessions/{session_id}/responses')
    assert response.status_code == 200
    data = response.get_json()
    assert 'responses' in data
    assert len(data['responses']) == 2

def test_get_response_feedback(auth_client, db_session):
    """Test retrieving feedback for a response."""
    # Create a session and response
    session_response = auth_client.post('/api/sessions', json={
        'session_type': 'TECHNICAL'
    })
    session_id = session_response.get_json()['session_id']
    
    # Add a response
    response = auth_client.post(f'/api/sessions/{session_id}/responses', json={
        'response_text': 'I implemented a new feature.'
    })
    response_id = response.get_json()['response_id']
    
    # Get feedback
    feedback_response = auth_client.get(f'/api/responses/{response_id}/feedback')
    assert feedback_response.status_code == 200
    data = feedback_response.get_json()
    assert 'feedback' in data
    assert 'feedback_text' in data['feedback']
    assert 'improvement_suggestions' in data['feedback']

def test_create_feedback(auth_client, db_session):
    """Test creating feedback for a response."""
    # Create a session and response
    session_response = auth_client.post('/api/sessions', json={
        'session_type': 'TECHNICAL'
    })
    session_id = session_response.get_json()['session_id']
    
    # Add a response
    response = auth_client.post(f'/api/sessions/{session_id}/responses', json={
        'response_text': 'I implemented a new feature.'
    })
    response_id = response.get_json()['response_id']
    
    # Delete existing feedback if it exists
    feedback = db_session.query(Feedback).filter_by(response_id=response_id).first()
    if feedback:
        db_session.delete(feedback)
        db_session.commit()
    
    # Create feedback
    feedback_response = auth_client.post(f'/api/responses/{response_id}/feedback')
    assert feedback_response.status_code == 201
    data = feedback_response.get_json()
    assert 'feedback' in data
    assert 'feedback_text' in data['feedback']
    assert 'improvement_suggestions' in data['feedback']

def test_rate_limiting(auth_client, db_session):
    """Test rate limiting."""
    # Make multiple requests to trigger rate limiting
    for _ in range(50):
        response = auth_client.get('/api/sessions')
        if response.status_code == 429:  # Too Many Requests
            break
    
    assert response.status_code == 429
    assert 'error' in response.json

def test_error_handling(auth_client, db_session):
    """Test error handling."""
    # Test invalid session ID
    response = auth_client.get('/api/sessions/99999')
    assert response.status_code == 404
    assert 'error' in response.json
    
    # Test invalid response
    response = auth_client.post('/api/sessions/1/responses', json={
        'response_text': ''
    })
    assert response.status_code == 400
    assert 'error' in response.json