import pandas as pd
import torch
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification, Trainer, TrainingArguments
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

# 1. Load Data
train_df = pd.read_csv('data/all_answers_train.csv')
val_df = pd.read_csv('data/all_answers_val.csv')
test_df = pd.read_csv('data/all_answers_test.csv')

# 2. Prepare Data (use 'response' as input, 'label' as target)
train_texts = train_df['answer'].astype(str).tolist()
train_labels = train_df['label'].astype(int).tolist()
val_texts = val_df['answer'].astype(str).tolist()
val_labels = val_df['label'].astype(int).tolist()
test_texts = test_df['answer'].astype(str).tolist()
test_labels = test_df['label'].astype(int).tolist()

# 3. Tokenization
model_name = 'distilbert-base-uncased'
tokenizer = DistilBertTokenizerFast.from_pretrained(model_name)

def tokenize(texts):
    return tokenizer(texts, truncation=True, padding=True, max_length=128)

train_encodings = tokenize(train_texts)
val_encodings = tokenize(val_texts)
test_encodings = tokenize(test_texts)

class InterviewDataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels
    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx])
        return item
    def __len__(self):
        return len(self.labels)

train_dataset = InterviewDataset(train_encodings, train_labels)
val_dataset = InterviewDataset(val_encodings, val_labels)
test_dataset = InterviewDataset(test_encodings, test_labels)

# 4. Model
model = DistilBertForSequenceClassification.from_pretrained(model_name, num_labels=2)

# 5. Metrics

def compute_metrics(pred):
    labels = pred.label_ids
    preds = pred.predictions.argmax(-1)
    acc = accuracy_score(labels, preds)
    precision, recall, f1, _ = precision_recall_fscore_support(labels, preds, average='binary')
    return {'accuracy': acc, 'precision': precision, 'recall': recall, 'f1': f1}

# 6. Training Arguments
training_args = TrainingArguments(
    output_dir='./results',
    num_train_epochs=2,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    eval_strategy='epoch',
    save_strategy='epoch',
    logging_dir='./logs',
    logging_steps=20,
    load_best_model_at_end=True,
    metric_for_best_model='f1',
    greater_is_better=True
)

# 7. Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    compute_metrics=compute_metrics,
)

# 8. Train
trainer.train()

# 9. Evaluate on test set
results = trainer.evaluate(test_dataset)
print('Test set results:', results)

# 10. Save the model
model.save_pretrained('data/answer_classifier_model')
tokenizer.save_pretrained('data/answer_classifier_model')
print('Model and tokenizer saved to data/answer_classifier_model')
