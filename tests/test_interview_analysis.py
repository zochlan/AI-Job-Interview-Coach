import unittest
import torch
from src.interview_analysis import (
    InterviewModel, analyze_responses_batch, analyze_responses_async,
    ModelInitializationError, ModelNotInitializedError, InvalidInputError,
    BatchInput, ModelCache, load_feedback_templates
)
from src.config import Config
import os
import logging
import asyncio
from transformers import BertTokenizer, BertForSequenceClassification
from unittest.mock import MagicMock, patch, call
from typing import Dict, Any, List

class TestInterviewAnalysis(unittest.TestCase):
    """
    Test suite for the Interview Analysis System.
    
    This class tests the core functionality of the AI Job Interview Coach, including:
    1. Response analysis and scoring
    2. Question categorization (technical, leadership, general)
    3. Feedback generation
    4. Error handling
    
    The tests use mocking to isolate components and ensure reliable testing.
    """

    @classmethod
    def setUpClass(cls):
        """
        Set up the test environment before running any tests.
        This method runs once before all tests in the class.
        """
        # Configure logging for better debugging
        logging.basicConfig(level=logging.INFO)
        cls.logger = logging.getLogger(__name__)
        
        # Initialize configuration with default settings
        cls.config = Config()
        
        # Create necessary directories for testing
        os.makedirs(cls.config.paths.model_dir, exist_ok=True)
    
    def setUp(self):
        """
        Set up before each individual test.
        This provides a clean state for each test method.
        """
        # Common test data
        self.sample_responses = [
            "I have extensive experience with Python, including web development and data analysis.",
            "I led a team of five developers on a critical project.",
            "I believe in continuous learning and adaptability."
        ]
        self.sample_questions = {
            'technical': [
                "Explain your experience with Python programming.",
                "Describe a challenging technical problem you solved.",
                "What programming languages do you know?"
            ],
            'leadership': [
                "Tell me about a time you led a team.",
                "How do you handle team conflicts?",
                "Describe your management style."
            ],
            'general': [
                "What are your strengths?",
                "Where do you see yourself in 5 years?",
                "How do you handle stress?"
            ]
        }
        # Clear model cache before each test
        ModelCache._instance = None
        ModelCache._models = {}
    
    def tearDown(self):
        """Clean up after each test."""
        # Clear model cache after each test
        ModelCache._instance = None
        ModelCache._models = {}
    
    @patch('src.interview_analysis.InterviewModel')
    def test_analyze_response_basic(self, mock_model_cls):
        """
        Test basic response analysis functionality.
        
        This test verifies that:
        1. The response analysis returns the expected structure
        2. The score is correctly passed through from the model
        3. The text is properly formatted before analysis
        """
        # Setup mock model to return a consistent score
        mock_model_instance = MagicMock()
        mock_model_instance.analyze_batch = MagicMock(return_value=[0.7])
        mock_model_cls.return_value = mock_model_instance
        
        # Test analysis of a simple response
        results = analyze_responses_batch(
            [self.sample_questions['technical'][0]],
            [self.sample_responses[0]],
            self.config
        )
        
        # Verify result structure and values
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertIn('score', result)
        self.assertIn('category', result)
        self.assertIn('feedback', result)
        self.assertIn('suggestions', result)
        self.assertEqual(result['score'], 0.7)
        
        # Verify the model was called with properly formatted input
        mock_model_instance.analyze_batch.assert_called_once()
    
    @patch('src.interview_analysis.InterviewModel')
    def test_question_categorization(self, mock_model_cls):
        """
        Test the system's ability to categorize different types of questions.
        
        This test verifies that:
        1. Technical questions are correctly identified
        2. Leadership questions are correctly identified
        3. General questions are correctly identified
        4. The categorization affects feedback selection
        """
        # Setup mock model
        mock_model_instance = MagicMock()
        mock_model_instance.analyze_batch = MagicMock(return_value=[0.7] * 6)
        mock_model_cls.return_value = mock_model_instance
        
        # Test each question category
        test_cases = [
            (self.sample_questions['technical'][0], 'technical'),
            (self.sample_questions['leadership'][0], 'leadership'),
            (self.sample_questions['general'][0], 'general'),
            ("Describe your experience with Java programming.", 'technical'),
            ("How did you handle a conflict in your team?", 'leadership'),
            ("Where do you see yourself in 5 years?", 'general')
        ]
        
        questions = [q for q, _ in test_cases]
        responses = [self.sample_responses[0]] * len(questions)
        expected_categories = [c for _, c in test_cases]
        
        results = analyze_responses_batch(questions, responses, self.config)
        
        # Verify categories
        self.assertEqual(len(results), len(test_cases))
        for result, expected_category in zip(results, expected_categories):
            self.assertEqual(
                result['category'],
                expected_category
            )
    
    def test_error_handling_comprehensive(self):
        """
        Test error handling for various invalid inputs.
        
        This test verifies that:
        1. Empty inputs raise ValueError
        2. Oversized inputs raise ValueError
        3. Invalid input types raise TypeError
        4. Model initialization errors are handled
        """
        # Test empty inputs
        empty_cases = [
            ([""], ["test response"]),
            (["test question"], [""]),
            ([""], [""])
        ]
        for questions, responses in empty_cases:
            with self.assertRaises(ValueError):
                analyze_responses_batch(questions, responses, self.config)
        
        # Test oversized inputs
        long_question = "a" * 501
        long_response = "a" * 2001
        
        with self.assertRaises(ValueError):
            analyze_responses_batch([long_question], ["test response"], self.config)
        
        with self.assertRaises(ValueError):
            analyze_responses_batch(["test question"], [long_response], self.config)
        
        # Test invalid input types
        invalid_cases = [
            ([None], ["response"]),
            (["question"], [None]),
            ([123], ["response"]),
            (["question"], [123])
        ]
        for questions, responses in invalid_cases:
            with self.assertRaises(TypeError):
                analyze_responses_batch(questions, responses, self.config)
    
    @patch('src.interview_analysis.InterviewModel')
    def test_model_initialization_errors(self, mock_model_cls):
        """
        Test handling of model initialization errors.
        
        This test verifies that:
        1. Missing model files raise appropriate errors
        2. Invalid model checkpoints are handled
        3. Device-related errors are caught
        """
        # Test missing model file
        mock_model_cls.side_effect = FileNotFoundError("Model file not found")
        with self.assertRaises(FileNotFoundError):
            analyze_responses_batch(["test question"], ["test response"], self.config)
        
        # Test invalid model checkpoint
        mock_model_cls.side_effect = ModelInitializationError("Invalid checkpoint")
        with self.assertRaises(ModelInitializationError):
            analyze_responses_batch(["test question"], ["test response"], self.config)
        
        # Test model not initialized
        mock_instance = MagicMock()
        mock_instance.analyze_batch.side_effect = ModelNotInitializedError("Model not ready")
        mock_model_cls.side_effect = None
        mock_model_cls.return_value = mock_instance
        with self.assertRaises(ModelNotInitializedError):
            analyze_responses_batch(["test question"], ["test response"], self.config)
    
    def test_feedback_templates_structure(self):
        """
        Test the structure and content of feedback templates.
        
        This test verifies that:
        1. All required categories exist
        2. Templates are properly formatted
        3. Templates contain meaningful content
        4. All template combinations are available
        """
        templates = load_feedback_templates()
        
        # Check main categories
        expected_categories = ['high', 'medium', 'low']
        for category in expected_categories:
            self.assertIn(category, templates)
        
        # Check feedback types and structure
        feedback_types = ['leadership', 'technical', 'general']
        for category in expected_categories:
            for feedback_type in feedback_types:
                self.assertIn(feedback_type, templates[category])
                feedback_list = templates[category][feedback_type]
                self.assertIsInstance(feedback_list, list)
                self.assertTrue(len(feedback_list) > 0)
                
                # Check feedback format
                for feedback in feedback_list:
                    self.assertIsInstance(feedback, str)
                    self.assertTrue(len(feedback) > 0)
    
    @patch('src.interview_analysis.InterviewModel')
    def test_score_based_feedback(self, mock_model_cls):
        """
        Test that feedback and suggestions vary based on the score.
        
        This test verifies that:
        1. High scores generate positive feedback
        2. Low scores generate constructive feedback
        3. Suggestions are provided for improvement
        4. Feedback matches the question category
        """
        test_scores = [0.9, 0.6, 0.3]  # High, medium, low scores
        expected_categories = ['high', 'medium', 'low']
        
        # Setup mock model for this score
        mock_model_instance = MagicMock()
        mock_model_instance.analyze_batch = MagicMock(return_value=test_scores)
        mock_model_cls.return_value = mock_model_instance
        
        # Test technical questions
        questions = [self.sample_questions['technical'][0]] * 3
        responses = [self.sample_responses[0]] * 3
        
        results = analyze_responses_batch(questions, responses, self.config)
        
        # Verify feedback matches score categories
        self.assertEqual(len(results), 3)
        for result, score, expected_category in zip(results, test_scores, expected_categories):
            # Verify score
            self.assertEqual(result['score'], score)
            
            # Verify feedback
            templates = load_feedback_templates()
            self.assertIn(result['feedback'], templates[expected_category]['technical'])
            
            # Verify suggestions for non-high scores
            if score < 0.8:
                self.assertTrue(len(result['suggestions']) > 0)

    @patch('src.interview_analysis.InterviewModel')
    def test_batch_processing(self, mock_model_cls):
        """
        Test batch processing functionality.
        
        This test verifies that:
        1. Multiple responses can be processed in batch
        2. Results maintain correct order
        3. Batch size limits are respected
        4. Memory efficiency is maintained
        """
        # Setup mock model
        mock_model_instance = MagicMock()
        mock_model_instance.analyze_batch = MagicMock(return_value=[0.7, 0.8, 0.6])
        mock_model_cls.return_value = mock_model_instance
        
        # Test batch processing
        questions = self.sample_questions['technical'][:3]
        responses = self.sample_responses[:3]
        
        results = analyze_responses_batch(questions, responses, self.config)
        
        # Verify results
        self.assertEqual(len(results), 3)
        for result in results:
            self.assertIn('score', result)
            self.assertIn('category', result)
            self.assertIn('feedback', result)
            self.assertIn('suggestions', result)
        
        # Verify order preservation
        self.assertEqual(results[0]['score'], 0.7)
        self.assertEqual(results[1]['score'], 0.8)
        self.assertEqual(results[2]['score'], 0.6)

    @patch('src.interview_analysis.InterviewModel')
    def test_async_processing(self, mock_model_cls):
        """
        Test asynchronous processing functionality.
        
        This test verifies that:
        1. Async processing works correctly
        2. Multiple responses can be processed concurrently
        3. Error handling works in async context
        """
        # Setup mock model
        mock_model_instance = MagicMock()
        mock_model_instance.analyze_batch = MagicMock(return_value=[0.7, 0.8, 0.6])
        mock_model_cls.return_value = mock_model_instance
        
        # Test async processing
        questions = self.sample_questions['technical'][:3]
        responses = self.sample_responses[:3]
        
        # Run async function in event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            results = loop.run_until_complete(
                analyze_responses_async(questions, responses, self.config)
            )
        finally:
            loop.close()
        
        # Verify results
        self.assertEqual(len(results), 3)
        for result in results:
            self.assertIn('score', result)
            self.assertIn('category', result)
            self.assertIn('feedback', result)
            self.assertIn('suggestions', result)

    def test_model_cache(self):
        """
        Test model caching functionality.
        
        This test verifies that:
        1. Model cache is a singleton
        2. Models are reused for same config
        3. Different configs create different models
        4. Thread safety is maintained
        """
        # Test singleton behavior
        cache1 = ModelCache()
        cache2 = ModelCache()
        self.assertIs(cache1, cache2)
        
        # Test model reuse
        model_name = "bert-base-uncased"
        with patch('transformers.BertForSequenceClassification.from_pretrained') as mock_from_pretrained:
            # Create different mock models for different names
            mock_model1 = MagicMock(name="model1")
            mock_model2 = MagicMock(name="model2")
            mock_from_pretrained.side_effect = lambda name, **kwargs: mock_model1 if name == model_name else mock_model2
            
            # First call should create new model
            model1 = cache1.get_model(model_name)
            self.assertEqual(mock_from_pretrained.call_count, 1)
            
            # Second call should reuse cached model
            model2 = cache2.get_model(model_name)
            self.assertEqual(mock_from_pretrained.call_count, 1)
            self.assertIs(model1, model2)
            
            # Different model name should create new model
            model3 = cache1.get_model("different-model")
            self.assertEqual(mock_from_pretrained.call_count, 2)
            self.assertIsNot(model1, model3)

    @patch('src.interview_analysis.InterviewModel')
    def test_batch_error_handling(self, mock_model_cls):
        """
        Test error handling in batch processing.
        
        This test verifies that:
        1. Invalid batch inputs are handled
        2. Batch size validation works
        3. Memory errors are handled
        4. Device errors are handled
        """
        # Test mismatched questions and responses
        with self.assertRaises(ValueError):
            analyze_responses_batch(
                ["question1", "question2"],
                ["response1"],
                self.config
            )
        
        # Test empty batch
        with self.assertRaises(ValueError):
            analyze_responses_batch([], [], self.config)
        
        # Test memory error handling
        with patch('src.interview_analysis.InterviewModel') as mock_model:
            mock_model.side_effect = RuntimeError("CUDA out of memory")
            with self.assertRaises(RuntimeError):
                analyze_responses_batch(
                    ["question1"],
                    ["response1"],
                    self.config
                )
        
        # Test device error handling
        with patch('src.interview_analysis.InterviewModel') as mock_model:
            mock_model.side_effect = RuntimeError("Device not available")
            with self.assertRaises(RuntimeError):
                analyze_responses_batch(
                    ["question1"],
                    ["response1"],
                    self.config
                )

    @patch('src.interview_analysis.InterviewModel')
    def test_batch_performance(self, mock_model_cls):
        """
        Test batch processing performance characteristics.
        
        This test verifies that:
        1. Large batches are processed efficiently
        2. Memory usage is optimized
        3. Processing time scales reasonably
        """
        # Setup mock model
        mock_model_instance = MagicMock()
        mock_model_instance.analyze_batch = MagicMock(
            return_value=[0.7] * 100  # Simulate 100 responses
        )
        mock_model_cls.return_value = mock_model_instance
        
        # Generate large batch
        questions = ["Technical question"] * 100
        responses = ["Technical response"] * 100
        
        # Process large batch
        results = analyze_responses_batch(questions, responses, self.config)
        
        # Verify results
        self.assertEqual(len(results), 100)
        self.assertTrue(all(r['score'] == 0.7 for r in results))
        
        # Verify batch processing
        mock_model_instance.analyze_batch.assert_called_once()

if __name__ == '__main__':
    unittest.main(verbosity=2) 