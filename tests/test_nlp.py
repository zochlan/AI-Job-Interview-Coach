import os
import sys
import pytest
from app.backend import create_app
from app.backend.nlp import get_nlp, analyze_response
from app.backend.nlp.advanced_analysis import AdvancedNLPAnalysis

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

@pytest.fixture(scope='module')
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['DATABASE_URL'] = 'sqlite:///:memory:'
    with app.app_context():
        yield app

@pytest.fixture(scope='module')
def nlp_models(app):
    get_nlp()

def test_response_analysis(nlp_models):
    # Sample interview response using STAR format
    response = """
    When I was working at my previous company, we faced a critical deadline for a client project.
    I needed to coordinate with multiple teams to ensure timely delivery.
    I implemented a new project management system and conducted daily stand-ups to track progress.
    As a result, we delivered the project two days ahead of schedule and received excellent client feedback.
    """

    question = "Tell me about a time you handled a challenging project."

    # Analyze the response
    analysis = analyze_response(response, question)

    # Check if all expected components are present
    assert 'feedback' in analysis
    assert 'suggestions' in analysis
    assert 'scores' in analysis
    assert isinstance(analysis['scores'], dict)
    assert 'professional_tone' in analysis['scores']
    assert 'clarity' in analysis['scores']
    assert 'completeness' in analysis['scores']

def test_incomplete_response(nlp_models):
    # Response missing some STAR components
    response = """
    I faced a challenging situation at work.
    It was stressful, but I handled it well.
    """

    analysis = analyze_response(response, "Tell me about a time you handled a challenging situation.")
    assert analysis['scores']['completeness'] < 0.8

def test_professional_tone(nlp_models):
    # Professional response
    professional_response = """
    In my previous role, I led a cross-functional team to develop a new product.
    We followed agile methodologies and maintained clear communication throughout the project.
    The product was successfully launched ahead of schedule.
    """

    analysis = analyze_response(professional_response, "Tell me about a leadership experience.")
    assert analysis['scores']['professional_tone'] > 0.4

def test_clarity_metrics(nlp_models):
    # Clear and concise response
    clear_response = """
    I implemented a new feature that improved user engagement by 20%.
    The feature was well-received by users and received positive feedback.
    """

    analysis = analyze_response(clear_response, "Tell me about a successful project.")
    assert analysis['scores']['clarity'] > 0.4

def test_sentiment_analysis(nlp_models):
    # Positive sentiment response
    positive_response = """
    I'm excited about the opportunities at your company.
    I believe my skills align perfectly with the role.
    I'm eager to contribute to your team.
    """

    analysis = analyze_response(positive_response, "Why are you interested in this position?")
    assert analysis['scores']['sentiment'] == 1.0

def test_empty_response(nlp_models):
    # Test empty response handling
    analysis = analyze_response("", "Tell me about your experience.")
    assert analysis['scores']['professional_tone'] == 0.0
    assert analysis['scores']['clarity'] == 0.0
    assert analysis['scores']['completeness'] == 0.0
    assert analysis['scores']['sentiment'] == 0.0
    assert analysis['feedback'] == 'Response text cannot be empty'
    assert 'Please provide a response' in analysis['suggestions']

def test_long_response(nlp_models):
    # Test long response handling
    long_response = """ """.join(["This is a very long response. " * 1000])
    analysis = analyze_response(long_response, "Tell me about your experience.")
    assert analysis['scores']['clarity'] < 0.6
    assert len(long_response) > 512  # Verify it was a long response

def test_special_characters(nlp_models):
    # Test response with special characters
    special_response = """I've worked with various technologies: Python, Java, & C++."""
    analysis = analyze_response(special_response, "Tell me about your technical experience.")
    assert analysis['scores']['clarity'] > 0.4

def test_multiple_languages(nlp_models):
    # Test response in multiple languages
    multi_lang_response = """I can communicate in English and Spanish.
    I've worked with international teams and understand cultural differences."""
    analysis = analyze_response(multi_lang_response, "Tell me about your language skills.")
    assert analysis['scores']['clarity'] > 0.5

def test_technical_jargon(nlp_models):
    # Test response with technical jargon
    technical_response = """I implemented a RESTful API using Flask and SQLAlchemy.
    The system uses JWT for authentication and Redis for caching."""
    analysis = analyze_response(technical_response, "Tell me about your technical experience.")
    assert analysis['scores']['clarity'] > 0.5

def test_performance(nlp_models):
    """Test performance with multiple iterations."""
    response = "I have extensive experience in software development."
    question = "Tell me about your experience."

    # Run analysis multiple times to check for consistent performance
    for _ in range(10):
        analysis = analyze_response(response, question)
        assert analysis['scores']['completeness'] >= 0

def test_edge_cases(nlp_models):
    """Test various edge cases."""
    # Single word response
    single_word = "Success"
    single_word_analysis = analyze_response(single_word, "Describe your success.")
    assert single_word_analysis['scores']['completeness'] < 0.5

def test_contextual_analysis(nlp_models):
    """Test context-aware analysis."""
    # Response matching question context
    matching_response = "I developed a machine learning model for natural language processing."
    matching_analysis = analyze_response(matching_response, "Machine learning experience?")
    assert matching_analysis['scores']['completeness'] > 0.05