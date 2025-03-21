import pytest
from app.backend.nlp import initialize_nlp, analyze_response
from app.backend.nlp.advanced_analysis import AdvancedNLPAnalysis

@pytest.fixture(scope='module')
def nlp_models():
    initialize_nlp()

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
    
    # Check if all components are present
    assert 'star_components' in analysis
    assert 'key_points' in analysis
    assert 'sentiment' in analysis
    assert 'completeness_score' in analysis
    assert 'professional_tone' in analysis
    assert 'clarity_metrics' in analysis
    assert 'improvement_suggestions' in analysis
    
    # Check STAR components
    star = analysis['star_components']
    assert len(star['situation']) > 0
    assert len(star['task']) > 0
    assert len(star['action']) > 0
    assert len(star['result']) > 0
    
    # Check completeness score
    assert 0 <= analysis['completeness_score'] <= 1

def test_incomplete_response(nlp_models):
    # Response missing Result component
    response = """
    While working on a project, I had to meet tight deadlines.
    I was responsible for coordinating the team efforts.
    I created a detailed project plan and assigned tasks.
    """
    
    question = "Describe a challenging situation at work."
    analysis = analyze_response(response, question)
    
    # Check if missing components are identified
    assert len(analysis['star_components']['result']) == 0
    assert analysis['completeness_score'] < 1.0
    assert any('result' in suggestion.lower() for suggestion in analysis['improvement_suggestions'])

def test_professional_tone(nlp_models):
    # Test professional vs casual tone
    professional_response = """
    I successfully implemented a new automated testing framework that reduced testing time by 50%.
    The project involved careful planning and coordination with multiple stakeholders.
    """
    
    casual_response = """
    Yeah, I just threw together some code and it worked out pretty well.
    The boss was happy and stuff got done faster.
    """
    
    prof_analysis = analyze_response(professional_response, "Technical achievement?")
    casual_analysis = analyze_response(casual_response, "Technical achievement?")
    
    assert prof_analysis['professional_tone']['tone_classification']['professional'] > \
           casual_analysis['professional_tone']['tone_classification']['professional']

def test_clarity_metrics(nlp_models):
    clear_response = """
    I led a team of five developers. We implemented a new feature.
    The project was completed on time. Client satisfaction increased by 30%.
    """
    
    unclear_response = """
    Well, you know, we kind of had this thing we were working on, 
    and it was like, really complicated because there were all these 
    different parts and people involved, and somehow we managed to 
    get it done, which was great because everyone was worried about it.
    """
    
    clear_analysis = analyze_response(clear_response, "Leadership experience?")
    unclear_analysis = analyze_response(unclear_response, "Leadership experience?")
    
    assert clear_analysis['clarity_metrics']['avg_sentence_length'] < \
           unclear_analysis['clarity_metrics']['avg_sentence_length']

def test_sentiment_analysis(nlp_models):
    positive_response = """
    I'm proud of leading the project to success. We achieved all our goals
    and received excellent feedback from stakeholders.
    """
    
    negative_response = """
    The project was challenging and we struggled with numerous obstacles.
    We failed to meet several deadlines and faced constant criticism.
    """
    
    pos_analysis = analyze_response(positive_response, "Project outcome?")
    neg_analysis = analyze_response(negative_response, "Project outcome?")
    
    assert pos_analysis['sentiment']['label'] == 'POSITIVE'
    assert neg_analysis['sentiment']['label'] == 'NEGATIVE' 