import torch
from torch.utils.data import Dataset, DataLoader
from transformers import BertTokenizer, BertForSequenceClassification, AdamW
from tqdm import tqdm
import pandas as pd
import os
from typing import Dict, Any, Optional, Tuple, cast, Union
from transformers.tokenization_utils_base import BatchEncoding
import json

class InterviewDataset(Dataset):
    def __init__(self, dataframe: pd.DataFrame, tokenizer: BertTokenizer, max_length: int = 512):
        self.data = dataframe
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self) -> int:
        return len(self.data)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        question = str(self.data.iloc[idx]['question'])
        response = str(self.data.iloc[idx]['response'])
        label = self.data.iloc[idx]['label']

        # Combine question and response
        text = f"Question: {question} Response: {response}"
        
        # Tokenize
        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )

        # Convert encoding outputs to tensors
        if not isinstance(encoding, BatchEncoding):
            raise ValueError("Tokenizer output is not in the expected format")
            
        input_ids = encoding['input_ids'][0]  # type: ignore
        attention_mask = encoding['attention_mask'][0]  # type: ignore

        return {
            'input_ids': input_ids,
            'attention_mask': attention_mask,
            'labels': torch.tensor(label, dtype=torch.long)
        }

class EarlyStopping:
    def __init__(self, patience: int = 3, min_delta: float = 0.0):
        self.patience = patience
        self.min_delta = min_delta
        self.counter = 0
        self.best_loss = None
        self.early_stop = False
        self.val_loss_min = float('inf')

    def __call__(self, val_loss: float) -> bool:
        if self.best_loss is None:
            self.best_loss = val_loss
        elif val_loss > self.best_loss - self.min_delta:
            self.counter += 1
            if self.counter >= self.patience:
                self.early_stop = True
        else:
            self.best_loss = val_loss
            self.counter = 0
        return self.early_stop

def train_model() -> None:
    """Train the interview response analysis model."""
    try:
        # Create output directory if it doesn't exist
        model_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
        os.makedirs(model_dir, exist_ok=True)
        
        # Load the datasets
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        train_path = os.path.join(data_dir, 'interview_train.csv')
        val_path = os.path.join(data_dir, 'interview_val.csv')
        
        if not os.path.exists(train_path) or not os.path.exists(val_path):
            raise FileNotFoundError("Training or validation data files not found")
            
        train_df = pd.read_csv(train_path)
        val_df = pd.read_csv(val_path)
        
        # Validate data
        required_columns = ['question', 'response', 'label']
        for df, name in [(train_df, 'train'), (val_df, 'val')]:
            missing_cols = [col for col in required_columns if col not in df.columns]
            if missing_cols:
                raise ValueError(f"Missing required columns in {name} data: {missing_cols}")
            if df['label'].nunique() != 2:
                raise ValueError(f"Expected 2 unique labels in {name} data, found {df['label'].nunique()}")

        # Initialize tokenizer and model
        tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
        model = cast(BertForSequenceClassification, BertForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=2))
        
        # Create datasets
        train_dataset = InterviewDataset(train_df, tokenizer)
        val_dataset = InterviewDataset(val_df, tokenizer)

        # Create data loaders
        train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=8)

        # Training settings
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = model.to(device)  # type: ignore
        optimizer = AdamW(model.parameters(), lr=2e-5)
        epochs = 3
        
        # Initialize early stopping
        early_stopping = EarlyStopping(patience=3)
        
        # Training loop
        best_val_loss = float('inf')
        training_history = []
        
        for epoch in range(epochs):
            model.train()
            total_loss = 0
            
            for batch in tqdm(train_loader, desc=f'Epoch {epoch + 1}/{epochs}'):
                optimizer.zero_grad()
                
                input_ids = batch['input_ids'].to(device)
                attention_mask = batch['attention_mask'].to(device)
                labels = batch['labels'].to(device)

                outputs = model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels
                )

                loss = outputs.loss
                total_loss += loss.item()
                
                loss.backward()
                optimizer.step()

            # Validation
            model.eval()
            val_loss = 0
            correct = 0
            total = 0

            with torch.no_grad():
                for batch in val_loader:
                    input_ids = batch['input_ids'].to(device)
                    attention_mask = batch['attention_mask'].to(device)
                    labels = batch['labels'].to(device)

                    outputs = model(
                        input_ids=input_ids,
                        attention_mask=attention_mask,
                        labels=labels
                    )

                    val_loss += outputs.loss.item()
                    predictions = torch.argmax(outputs.logits, dim=1)
                    correct += (predictions == labels).sum().item()
                    total += labels.size(0)

            avg_val_loss = val_loss / len(val_loader)
            accuracy = correct / total * 100
            
            # Record training history
            training_history.append({
                'epoch': epoch + 1,
                'train_loss': total_loss / len(train_loader),
                'val_loss': avg_val_loss,
                'val_accuracy': accuracy
            })
            
            print(f'Epoch {epoch + 1}:')
            print(f'Average training loss: {total_loss / len(train_loader)}')
            print(f'Validation loss: {avg_val_loss:.4f}')
            print(f'Validation accuracy: {accuracy:.2f}%')
            
            # Save best model
            if avg_val_loss < best_val_loss:
                best_val_loss = avg_val_loss
                # Save the model
                torch.save({
                    'epoch': epoch,
                    'model_state_dict': model.state_dict(),
                    'optimizer_state_dict': optimizer.state_dict(),
                    'val_loss': avg_val_loss,
                    'training_history': training_history,
                }, os.path.join(model_dir, 'model.pt'))
                
                # Save the tokenizer configuration
                tokenizer.save_pretrained(model_dir)
                
                print(f"New best model saved with validation loss: {avg_val_loss:.4f}")
            
            # Check for early stopping
            if early_stopping(avg_val_loss):
                print("Early stopping triggered")
                break

        print(f"Training completed! Best validation loss: {best_val_loss:.4f}")
        
        # Save final training history
        history_path = os.path.join(model_dir, 'training_history.json')
        with open(history_path, 'w') as f:
            json.dump(training_history, f, indent=2)
            
    except Exception as e:
        print(f"Training failed: {str(e)}")
        raise

if __name__ == "__main__":
    train_model() 