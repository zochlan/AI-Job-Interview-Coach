import os
import sys
import tempfile
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from werkzeug.security import generate_password_hash

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.backend import create_app
from app.backend.db.models import Base, User

@pytest.fixture
def app(db_session):
    """Create and configure a new app instance for each test."""
    app = create_app({
        'TESTING': True,
        'DATABASE_URL': 'sqlite:///:memory:',
        'SECRET_KEY': 'test',
        'TRANSFORMERS_CACHE': None,
        'SPACY_MODEL': 'en_core_web_sm',
        'MAX_SUMMARY_LENGTH': 1024,
        'MIN_PROFESSIONAL_TONE': 0.6,
        'MIN_CONFIDENCE_TONE': 0.5,
        'MAX_SENTENCE_LENGTH': 25,
        'MAX_READABILITY_SCORE': 30,
        'MIN_ENTITY_DENSITY': 0.1,
        'SESSION_TYPE': 'filesystem',
        'SESSION_PERMANENT': False
    })
    
    # Store db session in app context
    app.extensions['sqlalchemy'] = {
        'session': db_session,
        'engine': db_session.bind
    }
    
    return app

@pytest.fixture
def engine():
    """Create a test database engine."""
    engine = create_engine(
        'sqlite:///:memory:',
        connect_args={'check_same_thread': False}
    )
    Base.metadata.create_all(engine)
    return engine

@pytest.fixture
def db_session(engine):
    """Create a new database session for a test."""
    connection = engine.connect()
    transaction = connection.begin()
    session_factory = sessionmaker(bind=connection)
    session = scoped_session(session_factory)
    
    # Create tables
    Base.metadata.create_all(connection)
    
    yield session
    
    # Clean up
    session.remove()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()

@pytest.fixture
def auth_client(client, db_session):
    """Create an authenticated test client."""
    # Create a test user
    user = User(
        username='test_user',
        email='test@example.com',
        password_hash=generate_password_hash('test_password')
    )
    db_session.add(user)
    db_session.commit()
    
    # Log in
    with client.session_transaction() as sess:
        sess['user_id'] = user.id
    
    return client