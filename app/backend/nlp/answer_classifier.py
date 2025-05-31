import os
from transformers import DistilBertForSequenceClassification, DistilBertTokenizerFast
import torch

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..', 'data/answer_classifier_model'))

class AnswerClassifier:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_DIR)
        self.model = DistilBertForSequenceClassification.from_pretrained(MODEL_DIR)
        self.model.to(self.device)
        self.model.eval()

    def predict(self, answer_text):
        inputs = self.tokenizer(
            answer_text,
            truncation=True,
            padding=True,
            max_length=128,
            return_tensors='pt'
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1).cpu().numpy()[0]
            pred_label = int(probs.argmax())
            confidence = float(probs[pred_label])
        return {
            'label': pred_label,  # 1 = good, 0 = bad
            'confidence': confidence
        }

# Singleton instance for app-wide use
classifier = AnswerClassifier()

def predict_answer_quality(answer_text):
    return classifier.predict(answer_text)
