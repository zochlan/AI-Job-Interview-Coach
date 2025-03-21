import torch
from transformers import BertTokenizer, BertForSequenceClassification
import json
import os
from typing import Dict, Any, Optional, Tuple, cast, Union
from pathlib import Path
from transformers.tokenization_utils_base import BatchEncoding

def load_feedback_templates() -> Dict[str, Dict[str, str]]:
    """Load feedback templates for different categories and scores."""
    try:
        templates = {
            'high_score': {
                'leadership': "Excellent leadership example! You effectively demonstrated your ability to lead by showing clear communication, delegation, and project management skills.",
                'technical': "Strong technical explanation! You provided a clear, detailed response that shows deep understanding of the concept.",
                'general': "Excellent response! Your answer is well-structured, detailed, and demonstrates strong understanding."
            },
            'medium_score': {
                'leadership': "Good leadership example, but consider adding more specific details about the outcomes and your role in achieving them.",
                'technical': "Good technical explanation, but try to include more specific examples or use cases to strengthen your response.",
                'general': "Good response, but could be strengthened with more specific examples and clearer structure."
            },
            'low_score': {
                'leadership': "Consider providing a more detailed example with specific actions, outcomes, and lessons learned.",
                'technical': "Try to provide a more comprehensive explanation with specific technical details and examples.",
                'general': "Consider providing more detail and concrete examples in your response."
            }
        }
        return templates
    except Exception as e:
        raise RuntimeError(f"Failed to load feedback templates: {str(e)}")

def load_model_and_tokenizer(model_dir: str) -> Tuple[BertForSequenceClassification, BertTokenizer]:
    """Load the trained model and tokenizer."""
    try:
        model = cast(BertForSequenceClassification, BertForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=2))
        checkpoint_path = os.path.join(model_dir, 'model.pt')
        if not os.path.exists(checkpoint_path):
            raise FileNotFoundError(f"Model checkpoint not found at {checkpoint_path}")
            
        checkpoint = torch.load(checkpoint_path)
        if not isinstance(checkpoint, dict) or 'model_state_dict' not in checkpoint:
            raise ValueError("Invalid checkpoint format")
            
        model.load_state_dict(checkpoint['model_state_dict'])
        tokenizer = BertTokenizer.from_pretrained(model_dir)
        return model, tokenizer
    except Exception as e:
        raise RuntimeError(f"Failed to load model and tokenizer: {str(e)}")

def analyze_response(question: str, response: str) -> Dict[str, Any]:
    """
    Analyze an interview response using the trained model.
    
    Args:
        question (str): The interview question
        response (str): The candidate's response
        
    Returns:
        Dict[str, Any]: Analysis results including score, feedback, and category
        
    Raises:
        ValueError: If question or response is empty
        RuntimeError: If model loading or inference fails
    """
    if not question or not response:
        raise ValueError("Question and response cannot be empty")
    
    try:
        # Load the saved model and tokenizer
        model_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
        model, tokenizer = load_model_and_tokenizer(model_dir)
        
        # Prepare input
        text = f"Question: {question} Response: {response}"
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        
        if not isinstance(inputs, BatchEncoding):
            raise ValueError("Tokenizer output is not in the expected format")
        
        # Move model and inputs to appropriate device
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = model.to(device)  # type: ignore
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        # Get prediction
        model.eval()
        with torch.no_grad():
            outputs = model(**inputs)
            prediction = torch.softmax(outputs.logits, dim=1)
            score = prediction[0][1].item()  # Probability of good response
        
        # Determine score category
        if score >= 0.8:
            score_category = 'high_score'
        elif score >= 0.6:
            score_category = 'medium_score'
        else:
            score_category = 'low_score'
        
        # Determine question category
        question_lower = question.lower()
        if any(word in question_lower for word in ['lead', 'team', 'manage', 'group']):
            category = 'leadership'
        elif any(word in question_lower for word in ['explain', 'what is', 'difference between', 'how does']):
            category = 'technical'
        else:
            category = 'general'
        
        # Load feedback templates
        templates = load_feedback_templates()
        
        # Generate feedback
        feedback = templates[score_category][category]
        
        # Add improvement suggestions based on score
        if score < 0.8:
            suggestions = []
            if score < 0.6:
                suggestions.append("Provide more specific examples and details")
                suggestions.append("Structure your response with a clear beginning, middle, and end")
            if score < 0.7:
                suggestions.append("Include quantifiable results or outcomes")
                suggestions.append("Explain your thought process and reasoning")
            
            feedback += "\n\nSuggestions for improvement:\n" + "\n".join(f"- {s}" for s in suggestions)
        
        return {
            'score': score,
            'feedback': feedback,
            'category': category,
            'score_category': score_category
        }
    except Exception as e:
        raise RuntimeError(f"Error during response analysis: {str(e)}")

def main() -> None:
    """Example usage of the interview analysis system."""
    try:
        questions = [
            "Tell me about a time you showed leadership",
            "Explain object-oriented programming",
            "How do you handle conflict at work?"
        ]
        
        responses = [
            "I led a team project where we had to deliver under tight deadlines. I organized the team, delegated tasks effectively, and we completed the project successfully.",
            "OOP is a programming paradigm based on objects containing data and code. It uses concepts like inheritance, encapsulation, polymorphism, and abstraction to organize code into reusable patterns.",
            "I believe in addressing conflicts directly but professionally. Once, I had a disagreement with a colleague about project approach. I scheduled a private meeting to discuss our perspectives and found common ground."
        ]
        
        for question, response in zip(questions, responses):
            result = analyze_response(question, response)
            print("\n" + "="*50)
            print(f"Question: {question}")
            print(f"Response: {response}")
            print(f"Score: {result['score']:.2f}")
            print(f"Category: {result['category']}")
            print(f"Feedback: {result['feedback']}")
            print("="*50)
    except Exception as e:
        print(f"Error in main execution: {str(e)}")

if __name__ == "__main__":
    main() 