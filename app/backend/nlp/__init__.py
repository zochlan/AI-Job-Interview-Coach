import spacy
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification, AutoModelForQuestionAnswering
from sentence_transformers import SentenceTransformer, util as st_util
from rapidfuzz import fuzz
import os
import logging
from flask import current_app, g
from typing import Dict, List, Tuple, Any, Optional

_nlp_analyzer = None

class NLPAnalyzer:
    """NLP analyzer for interview responses."""

    def __init__(self, testing=False):
        """Initialize NLP components."""
        self.testing = testing
        if not testing:
            try:
                print("NLPAnalyzer: loading SpaCy model")
                model_name = current_app.config.get('SPACY_MODEL', 'en_core_web_sm')
                try:
                    self.nlp = spacy.load(model_name)
                except OSError:
                    logging.info(f"Downloading SpaCy model: {model_name}")
                    os.system(f"python -m spacy download {model_name}")
                    self.nlp = spacy.load(model_name)
                print("NLPAnalyzer: SpaCy model loaded")
                # The following large model/pipeline loads are DISABLED for memory stability:
                # print("NLPAnalyzer: loading Mistral-7B-Instruct for local feedback")
                # self.llm_generator = pipeline(
                #     "text-generation",
                #     model="gpt2",
                #     torch_dtype="auto",
                #     device_map="auto"
                # )
                # print("NLPAnalyzer: LLM loaded")
                # print("NLPAnalyzer: loading SentenceTransformer model for semantic similarity")
                # self.st_model = SentenceTransformer('all-MiniLM-L6-v2')
                # print("NLPAnalyzer: SentenceTransformer loaded")
                # cache_dir = current_app.config.get('TRANSFORMERS_CACHE')
                # os.environ['TRANSFORMERS_CACHE'] = cache_dir or os.path.join(os.getcwd(), 'models')
                # Initialize a simple sentiment analyzer
                try:
                    print("NLPAnalyzer: loading sentiment pipeline")
                    self.sentiment_analyzer = pipeline("sentiment-analysis")
                    print("NLPAnalyzer: sentiment pipeline loaded")
                except Exception as e:
                    print(f"NLPAnalyzer: failed to load sentiment pipeline: {e}")
                    # We'll handle this gracefully in the analyze_response method
                # print("NLPAnalyzer: sentiment pipeline loaded")
                # print("NLPAnalyzer: loading QA pipeline")
                # qa_model_name = "distilbert-base-cased-distilled-squad"
                # qa_tokenizer = AutoTokenizer.from_pretrained(qa_model_name)
                # qa_model = AutoModelForQuestionAnswering.from_pretrained(qa_model_name)
                # self.question_answering = pipeline("question-answering", model=qa_model, tokenizer=qa_tokenizer)
                # print("NLPAnalyzer: QA pipeline loaded")
                print("NLPAnalyzer: loading zero-shot pipeline")
                model_name = "facebook/bart-large-mnli"
                self.zero_shot_classifier = pipeline(
                    "zero-shot-classification",
                    model=model_name,
                    tokenizer=model_name
                )
                print("NLPAnalyzer: zero-shot pipeline loaded")
                # print("NLPAnalyzer: zero-shot pipeline loaded")
                # print("NLPAnalyzer: loading summarizer pipeline (distilbart-cnn-12-6)")
                # summary_model = "sshleifer/distilbart-cnn-12-6"
                # self.summarizer = pipeline(
                #     "summarization",
                #     model=summary_model,
                #     tokenizer=summary_model
                # )
                # print("NLPAnalyzer: summarizer pipeline loaded")
                # self.max_summary_length = current_app.config.get('MAX_SUMMARY_LENGTH', 1024)
                # self.min_professional_tone = current_app.config.get('MIN_PROFESSIONAL_TONE', 0.6)

                self.min_confidence_tone = current_app.config.get('MIN_CONFIDENCE_TONE', 0.5)
                self.max_sentence_length = current_app.config.get('MAX_SENTENCE_LENGTH', 25)
                self.max_readability_score = current_app.config.get('MAX_READABILITY_SCORE', 30)
                self.min_entity_density = current_app.config.get('MIN_ENTITY_DENSITY', 0.1)
                print("NLPAnalyzer: configuration loaded")

                logging.info("NLP components initialized successfully")

            except Exception as e:
                print(f"NLPAnalyzer: exception {e}")
                logging.error(f"Error initializing NLP components: {e}")
                raise

    def analyze_response(self, response_text: str, question_context: Optional[str] = None) -> Dict[str, Any]:
        """Analyze a response text."""
        if self.testing:
            return {
                'feedback': 'Your response was clear and professional.',
                'suggestions': 'Consider adding more specific examples.',
                'scores': {
                    'professional_tone': 0.8,
                    'clarity': 0.7,
                    'completeness': 0.9,
                    'sentiment': 0.5
                }
            }

        if not response_text.strip():
            return {
                'feedback': 'Response text cannot be empty',
                'suggestions': ['Please provide a response'],
                'scores': {
                    'professional_tone': 0.0,
                    'clarity': 0.0,
                    'completeness': 0.0,
                    'sentiment': 0.0
                }
            }

        try:
            # Process text with spaCy
            doc = self.nlp(response_text)
            # Identify STAR components
            star_components = self.identify_star_components(doc)
            # Extract key points
            key_points = self.extract_key_points(doc)
            # Calculate completeness
            completeness_score = self.calculate_completeness(star_components)
            # Analyze professional tone
            professional_tone = self.analyze_professional_tone(response_text)
            # Analyze clarity
            clarity = self.analyze_clarity(response_text)
            # Analyze sentiment (handle long responses)
            max_length = 512
            if len(response_text) > max_length:
                # Take the first 512 tokens
                tokens = response_text.split()
                response_text = ' '.join(tokens[:max_length])

            # Check if sentiment_analyzer is available
            if hasattr(self, 'sentiment_analyzer'):
                sentiment = self.sentiment_analyzer(response_text)[0]
                sentiment_score = 1.0 if sentiment['label'] == 'POSITIVE' else 0.0
            else:
                # Fallback if sentiment_analyzer is not available
                sentiment = {'label': 'NEUTRAL'}
                sentiment_score = 0.5

            # Generate feedback
            feedback = self.generate_feedback(star_components,
                                            professional_tone,
                                            clarity,
                                            {'label': sentiment['label']},
                                            completeness_score)

            # Soft skills & technical depth (zero-shot classification)
            soft_skill_labels = ["communication", "leadership", "problem solving", "teamwork", "adaptability", "initiative", "empathy"]
            technical_labels = ["technical depth", "domain expertise", "innovation"]
            soft_skills = self.zero_shot_classifier(response_text, soft_skill_labels)
            technical_skills = self.zero_shot_classifier(response_text, technical_labels)
            soft_skills_scores = dict(zip(soft_skills['labels'], soft_skills['scores']))
            technical_scores = dict(zip(technical_skills['labels'], technical_skills['scores']))

            # LLM-based feedback (if available)
            llm_feedback = None
            try:
                if hasattr(self, 'generate_llm_feedback'):
                    llm_feedback = self.generate_llm_feedback(question_context or '', response_text)
            except Exception as e:
                llm_feedback = None
                logging.warning(f"LLM feedback unavailable: {e}")

            return {
                'feedback': feedback['text'],
                'suggestions': feedback['suggestions'],
                'scores': {
                    'professional_tone': professional_tone['score'],
                    'clarity': clarity['score'],
                    'completeness': completeness_score,
                    'sentiment': sentiment_score
                },
                'star': star_components,
                'star_score': completeness_score,
                'soft_skills': soft_skills_scores,
                'technical_depth': technical_scores,
                'key_points': key_points,
                'llm_feedback': llm_feedback,
            }

        except Exception as e:
            logging.error(f"Error analyzing response: {e}")
            return {
                'feedback': 'Error analyzing response',
                'suggestions': ['Please try a different response'],
                'scores': {
                    'professional_tone': 0.0,
                    'clarity': 0.0,
                    'completeness': 0.0,
                    'sentiment': 0.0
                }
            }

    def identify_star_components(self, doc) -> Dict[str, List[str]]:
        """Identify STAR components in the response with improved accuracy."""
        components = {
            'situation': [],
            'task': [],
            'action': [],
            'result': []
        }

        # Enhanced indicators with more comprehensive keywords
        star_indicators = {
            'situation': [
                'when', 'context', 'background', 'situation', 'problem', 'faced', 'encountered',
                'challenge', 'previously', 'at my previous', 'while working', 'during my time',
                'in my role', 'scenario', 'circumstance', 'environment', 'setting', 'position',
                'issue', 'difficulty', 'obstacle', 'hurdle', 'dilemma', 'predicament'
            ],
            'task': [
                'goal', 'task', 'responsibility', 'required', 'needed', 'objective', 'assignment',
                'role', 'mission', 'duty', 'charge', 'asked to', 'had to', 'needed to', 'required to',
                'responsible for', 'accountable for', 'expected to', 'tasked with', 'aim', 'target',
                'purpose', 'intention', 'plan', 'strategy'
            ],
            'action': [
                'implemented', 'created', 'developed', 'led', 'managed', 'built', 'solved', 'executed',
                'coordinated', 'organized', 'conducted', 'performed', 'carried out', 'undertook',
                'initiated', 'established', 'arranged', 'facilitated', 'directed', 'guided', 'handled',
                'addressed', 'tackled', 'approached', 'dealt with', 'worked on', 'proceeded to',
                'took steps to', 'began by', 'started with', 'first i', 'then i', 'next i', 'i decided to'
            ],
            'result': [
                'resulted in', 'achieved', 'increased', 'improved', 'reduced', 'success', 'outcome',
                'accomplishment', 'achievement', 'attainment', 'benefit', 'consequence', 'effect',
                'impact', 'influence', 'output', 'product', 'culminated in', 'led to', 'produced',
                'generated', 'yielded', 'delivered', 'ultimately', 'finally', 'in the end', 'as a result',
                'consequently', 'therefore', 'hence', 'thus', 'eventually', 'percent', '%', 'increase',
                'decrease', 'growth', 'reduction', 'saving', 'profit', 'revenue', 'customer satisfaction'
            ]
        }

        # Weight sentences by position in the response
        total_sents = len(list(doc.sents))

        for i, sent in enumerate(doc.sents):
            sent_text = sent.text.lower()
            position_ratio = i / total_sents if total_sents > 0 else 0

            # Early sentences more likely to be Situation/Task
            # Later sentences more likely to be Action/Result
            position_weights = {
                'situation': max(0, 1.5 - 2 * position_ratio),  # Higher at beginning
                'task': max(0, 1.2 - 1.5 * position_ratio),     # Higher near beginning
                'action': min(1.5, 0.8 + position_ratio),       # Higher in middle
                'result': min(2.0, 0.5 + 2 * position_ratio)    # Higher at end
            }

            # Check each component with weighted scoring
            for component, indicators in star_indicators.items():
                # Base score from keyword matches
                indicator_matches = sum(1 for indicator in indicators if indicator in sent_text)
                if indicator_matches > 0:
                    # Apply position weighting
                    weighted_score = indicator_matches * position_weights[component]
                    if weighted_score >= 1.0:  # Threshold for inclusion
                        components[component].append(sent.text)

        # Ensure we don't have duplicate sentences in different components
        # If a sentence appears in multiple components, keep it only in the most likely one
        all_sentences = []
        for component in ['situation', 'task', 'action', 'result']:
            for sent in components[component]:
                if sent in all_sentences:
                    # Remove from this component if it's already in another
                    components[component].remove(sent)
                else:
                    all_sentences.append(sent)

        return components

    def extract_key_points(self, doc) -> Dict[str, List[Any]]:
        """Extract key points from the response."""
        entities = [(ent.text, ent.label_) for ent in doc.ents]

        noun_phrases = [chunk.text for chunk in doc.noun_chunks
                       if not all(token.is_stop for token in chunk)]

        actions = []
        for token in doc:
            if token.pos_ == "VERB":
                verb_phrase = token.text
                obj = next((child.text for child in token.children
                           if child.dep_ in ['dobj', 'pobj']), '')
                if obj:
                    verb_phrase += f" {obj}"
                actions.append(verb_phrase)

        return {
            'entities': entities,
            'noun_phrases': noun_phrases,
            'actions': actions
        }

    def calculate_completeness(self, star_components: Dict[str, List[str]]) -> float:
        """Calculate STAR response completeness score with improved accuracy."""
        # Define weights for each component
        weights = {
            'situation': 0.25,
            'task': 0.20,
            'action': 0.30,  # Action is most important
            'result': 0.25
        }

        # Calculate component scores with diminishing returns for excessive content
        component_scores = {}
        for component, content in star_components.items():
            if not content:
                component_scores[component] = 0.0
                continue

            # Calculate content length (total words across all sentences)
            content_length = sum(len(sentence.split()) for sentence in content)

            # Determine ideal length ranges for each component
            ideal_min_words = {
                'situation': 20,
                'task': 15,
                'action': 30,
                'result': 20
            }

            ideal_max_words = {
                'situation': 50,
                'task': 40,
                'action': 80,
                'result': 50
            }

            # Score based on content length relative to ideal range
            if content_length < ideal_min_words[component]:
                # Below minimum: linear scaling from 0 to 0.7
                length_score = 0.7 * (content_length / ideal_min_words[component])
            elif content_length <= ideal_max_words[component]:
                # Within ideal range: 0.7 to 1.0
                range_size = ideal_max_words[component] - ideal_min_words[component]
                position_in_range = content_length - ideal_min_words[component]
                length_score = 0.7 + (0.3 * (position_in_range / range_size))
            else:
                # Above maximum: diminishing returns (penalize excessive verbosity)
                excess_ratio = ideal_max_words[component] / content_length
                length_score = 0.85 + (0.15 * excess_ratio)  # Max 1.0, decreases with length

            # Calculate final component score
            component_scores[component] = weights[component] * length_score

        # Calculate total score
        total_score = sum(component_scores.values())

        # Bonus for having all components (up to 10% bonus)
        components_present = sum(1 for score in component_scores.values() if score > 0)
        completeness_bonus = 0.1 * (components_present / 4)

        # Apply bonus, but don't exceed 1.0
        final_score = min(1.0, total_score + completeness_bonus)

        return round(final_score, 2)

    def analyze_professional_tone(self, text: str) -> Dict[str, float]:
        """Analyze the professional tone of the response."""
        if not text:
            raise ValueError("Text cannot be empty")

        try:
            candidate_labels = [
                "professional",
                "casual",
                "technical",
                "confident",
                "uncertain"
            ]

            result = self.zero_shot_classifier(text, candidate_labels)
            return {
                'score': result['scores'][result['labels'].index('professional')],
                'confidence': result['scores'][result['labels'].index('confident')]
            }
        except Exception as e:
            logging.error(f"Error analyzing professional tone: {e}")
            raise

    def analyze_clarity(self, text: str) -> Dict[str, float]:
        """Analyze the clarity and coherence of the response."""
        if not text:
            raise ValueError("Text cannot be empty")

        try:
            doc = self.nlp(text)

            # Calculate average sentence length
            sentences = list(doc.sents)
            avg_sentence_length = sum(len(sent) for sent in sentences) / len(sentences)

            # Calculate readability
            readability_score = self._calculate_readability(doc)

            # Calculate entity density
            num_entities = len(doc.ents)
            num_words = len(doc)
            entity_density = num_entities / num_words if num_words > 0 else 0

            return {
                'avg_sentence_length': avg_sentence_length,
                'readability_score': readability_score,
                'entity_density': entity_density,
                'score': 1.0 - (avg_sentence_length / self.max_sentence_length +
                              readability_score / self.max_readability_score +
                              (1 - entity_density) / (1 - self.min_entity_density)) / 3
            }
        except Exception as e:
            logging.error(f"Error analyzing clarity: {e}")
            raise

    def _calculate_readability(self, doc) -> float:
        """Calculate readability score using spaCy doc."""
        try:
            sentences = list(doc.sents)
            if not sentences:
                return 0.0

            total_words = sum(len(sent) for sent in sentences)
            total_sentences = len(sentences)

            # Calculate average words per sentence
            avg_words_per_sentence = total_words / total_sentences

            # Calculate average syllables per word (simple approximation)
            syllables = sum(len(word.text) for word in doc)
            avg_syllables_per_word = syllables / total_words

            # Calculate Flesch Reading Ease score
            score = 206.835 - 1.015 * avg_words_per_sentence - 84.6 * avg_syllables_per_word

            # Normalize score to 0-100 range
            normalized_score = (score - 0) / (100 - 0)

            return min(max(normalized_score, 0), 1) * 100

        except Exception as e:
            logging.error(f"Error calculating readability: {e}")
            return 0.0

    def generate_feedback(self, star_components: Dict[str, List[str]], professional_tone: Dict[str, float], clarity: Dict[str, float], sentiment: Dict[str, str], completeness_score: float) -> Dict[str, Any]:
        """Generate detailed, actionable feedback with specific examples and suggestions."""
        suggestions = []
        feedback_text = []

        # Get component-specific feedback
        component_feedback = self._generate_component_feedback(star_components)

        # Personalized STAR feedback with specific examples
        if completeness_score < 0.8:
            missing = [c for c, v in star_components.items() if not v]
            if missing:
                for comp in missing:
                    example_phrases = {
                        'situation': "For example, 'While working at XYZ Company, I faced a challenge with...'",
                        'task': "For example, 'My responsibility was to deliver a solution that would...'",
                        'action': "For example, 'I implemented a three-step approach where I first...'",
                        'result': "For example, 'As a result, we achieved a 15% increase in...'",
                    }
                    suggestions.append(f"Consider expanding on the {comp.upper()} aspect of your answer. {example_phrases[comp]}")

            # Check for weak (but present) components
            weak_components = []
            for comp, content in star_components.items():
                if content and len(' '.join(content).split()) < 15:  # Less than 15 words
                    weak_components.append(comp)

            if weak_components:
                for comp in weak_components:
                    suggestions.append(f"Your {comp.upper()} section is brief. Consider adding more details about {component_feedback[comp]['what_to_include']}.")

        # More actionable tone feedback with examples
        if professional_tone.get('score', 1.0) < self.min_professional_tone:
            casual_phrases = ["like", "you know", "stuff", "things", "kinda", "sort of", "basically"]
            suggestions.append("Consider using more formal or professional language. Replace casual phrases like 'stuff' or 'things' with specific terms relevant to your field.")

        if professional_tone.get('confidence', 1.0) < self.min_confidence_tone:
            uncertain_phrases = ["I think", "maybe", "possibly", "I guess", "I'm not sure", "kind of"]
            confident_alternatives = ["I am confident that", "I demonstrated", "I successfully", "I effectively"]
            suggestions.append(f"Express your points with greater confidence. Instead of phrases like '{uncertain_phrases[0]}', try '{confident_alternatives[0]}'.")

        # Enhanced clarity feedback with specific examples
        if clarity.get('score', 1.0) < 0.7:
            if clarity.get('avg_sentence_length', 0) > self.max_sentence_length:
                suggestions.append("Break down long sentences into shorter ones. Aim for 15-20 words per sentence for optimal clarity.")

            if clarity.get('readability_score', 0) > self.max_readability_score:
                suggestions.append("Use simpler words and shorter sentences. Replace complex terminology with more accessible language when possible.")

            if clarity.get('entity_density', 0) < self.min_entity_density:
                suggestions.append("Add more specific details, data, or examples. Include metrics, percentages, or concrete outcomes to strengthen your answer.")

        # Sentiment feedback with constructive alternatives
        if sentiment.get('label') == 'NEGATIVE':
            suggestions.append("Try to maintain a positive and constructive tone, even when discussing challenges. Frame problems as opportunities for growth or learning.")

        # Compose a more personalized, varied, and encouraging feedback paragraph
        # Vary feedback based on score ranges for more personalization
        if completeness_score >= 0.9:
            feedback_text.append("Excellent job! Your response is exceptionally well-structured and thoroughly covers all aspects of the STAR framework. Your answer demonstrates strong interview skills.")
        elif completeness_score >= 0.8:
            feedback_text.append("Great work! Your response effectively covers the STAR framework and presents a compelling narrative. With a few minor adjustments, it could be even stronger.")
        elif completeness_score >= 0.7:
            feedback_text.append("Good effort! Your response includes most elements of the STAR framework. With some additional details in specific areas, your answer would be more impactful.")
        elif completeness_score >= 0.5:
            feedback_text.append("You're on the right track. Your response touches on some key elements, but would benefit from a more structured approach following the STAR framework more closely.")
        else:
            feedback_text.append("Your response could be strengthened by more clearly following the STAR framework. This approach helps interviewers understand your experience in a structured way.")

        # Add component-specific feedback
        for component, content in star_components.items():
            if content:
                feedback_text.append(component_feedback[component]['positive'])
            else:
                feedback_text.append(component_feedback[component]['missing'])

        # Professional tone feedback
        if professional_tone.get('score', 0) >= self.min_professional_tone:
            feedback_text.append("You maintained a strong professional tone throughout your response, which is impressive and appropriate for interview settings.")
        else:
            feedback_text.append("Your response would benefit from a more professional tone. This helps demonstrate your workplace readiness and communication skills.")

        # Clarity feedback
        if clarity.get('score', 0) >= 0.8:
            feedback_text.append("Your response was exceptionally clear and well-structured, making your points easy to follow and understand.")
        elif clarity.get('score', 0) >= 0.7:
            feedback_text.append("Your response was clear and generally well-organized, making it easy to understand your main points.")
        else:
            feedback_text.append("Improving the clarity and organization of your response would help interviewers better appreciate your qualifications and experience.")

        # Format suggestions into a readable bullet point list
        if suggestions:
            formatted_suggestions = '\n- ' + '\n- '.join(suggestions)
        else:
            formatted_suggestions = "Your response is strong. Continue practicing this structured approach in future interviews."

        return {
            'text': ' '.join(feedback_text),
            'suggestions': formatted_suggestions
        }

    def _generate_component_feedback(self, star_components: Dict[str, List[str]]) -> Dict[str, Dict[str, str]]:
        """Generate specific feedback for each STAR component."""
        return {
            'situation': {
                'positive': "You effectively established the context and background of your experience.",
                'missing': "Consider starting with a clear description of the situation or context that led to your actions.",
                'what_to_include': "the specific challenge, problem, or opportunity you faced"
            },
            'task': {
                'positive': "You clearly outlined your responsibilities and objectives in this scenario.",
                'missing': "Try to clearly define what your specific role or responsibility was in this situation.",
                'what_to_include': "your specific goals, responsibilities, and what was expected of you"
            },
            'action': {
                'positive': "Your description of the actions you took demonstrates your skills and approach to problem-solving.",
                'missing': "Be sure to detail the specific steps you took to address the situation.",
                'what_to_include': "the specific steps, strategies, and actions you implemented"
            },
            'result': {
                'positive': "You effectively highlighted the outcomes and impact of your actions.",
                'missing': "Remember to conclude with the results of your actions and their impact.",
                'what_to_include': "quantifiable achievements, lessons learned, and the overall impact of your actions"
            }
        }

    def generate_llm_feedback(self, question: str, user_answer: str) -> str:
        prompt = (
            f"You are an expert job interview coach. "
            f"Here is the interview question: \"{question}\".\n"
            f"Here is the candidate's answer: \"{user_answer}\".\n"
            f"Give detailed, constructive feedback as if in a real interview."
        )
        result = self.llm_generator(prompt, max_length=512, do_sample=True, temperature=0.7)
        return result[0]['generated_text']





def analyze_response(response_text: str, question_context: Optional[str] = None) -> Dict[str, Any]:
    """Analyze a response text using the NLP analyzer."""
    nlp = get_nlp()
    return nlp.analyze_response(response_text, question_context)

def init_nlp(app):
    """Initialize NLP components."""
    print("init_nlp: start")
    try:
        with app.app_context():
            print("init_nlp: in app context")
            testing = app.config.get('TESTING', False)
            print(f"init_nlp: testing={testing}")
            app.extensions['nlp'] = NLPAnalyzer(testing=testing)
            print("init_nlp: NLPAnalyzer created and assigned")
            logging.info("NLP components initialized successfully")
    except Exception as e:
        print(f"init_nlp: exception {e}")
        logging.error(f"Error initializing NLP components: {e}")
        raise
    print("init_nlp: end")

def get_nlp():
    """Get or create the NLP analyzer."""
    if 'nlp' not in current_app.extensions:
        raise RuntimeError("NLP not initialized. Call init_nlp() first.")
    return current_app.extensions['nlp']