# Advanced ML-Based Sentiment Analysis Setup

This service uses state-of-the-art machine learning models for professional sentiment analysis.

## Installation

### 1. Install Python Dependencies

```bash
cd python-service
pip install -r requirements.txt
```

### 2. Download spaCy Model

```bash
python -m spacy download en_core_web_sm
```

### 3. Download NLTK Data (Automatic)

The service will automatically download required NLTK data on first run.

### 4. (Optional) GPU Support for Transformers

If you have a CUDA-compatible GPU and want faster inference:

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

Then modify `advanced_sentiment_service.py` to use GPU:
```python
device = 0  # Use GPU 0 instead of -1 (CPU)
```

## Models Used

### 1. Transformer Models (Primary)
- **Twitter-RoBERTa-base**: Fine-tuned on Twitter data for social media sentiment
- **DistilBERT**: Lightweight BERT variant (fallback)
- Uses Hugging Face Transformers library

### 2. VADER (Secondary)
- NLTK's VADER sentiment analyzer
- Optimized for social media text
- Always available as fallback

### 3. TextBlob (Tertiary)
- Additional sentiment analysis perspective
- Provides subjectivity scores

## Ensemble Method

The service uses **weighted ensemble voting**:
- Transformer models: 50% weight (most accurate)
- VADER: 30% weight (reliable baseline)
- TextBlob: 20% weight (additional perspective)

## Features

### Advanced Sentiment Analysis
- Multi-model ensemble for robust predictions
- Sentence-level sentiment analysis
- Confidence scoring
- Feature extraction (linguistic, structural)

### Recommendations Engine
- Actionable recommendations based on sentiment
- Crisis management alerts for negative sentiment
- Content optimization suggestions
- Platform-specific recommendations
- Structure and engagement recommendations

## API Usage

### Basic Sentiment Analysis

```python
POST /api/nlp/advanced-sentiment
{
  "text": "Your text here",
  "context": {
    "platform": "twitter",
    "post_type": "social_post"
  }
}
```

### Response Structure

```json
{
  "success": true,
  "data": {
    "classification": "positive|neutral|negative",
    "confidence": 0.85,
    "compound": 0.75,
    "pos": 0.8,
    "neu": 0.15,
    "neg": 0.05,
    "sentences": [...],
    "features": {...},
    "recommendations": [
      {
        "type": "optimization",
        "priority": "low",
        "title": "Leverage Positive Sentiment",
        "description": "...",
        "actions": [...],
        "urgency": "low"
      }
    ],
    "recommendation_count": 3,
    "model_results": {...},
    "sentiment_distribution": {...},
    "ensemble_confidence": 0.85,
    "models_used": ["transformer", "vader", "textblob"]
  }
}
```

## Performance

- **CPU**: ~1-3 seconds per analysis (depending on text length)
- **GPU**: ~0.1-0.5 seconds per analysis
- Models are loaded once and cached for subsequent requests

## Troubleshooting

### Model Download Issues
If transformer models fail to download:
1. Check internet connection
2. Models are downloaded automatically on first use
3. May take several minutes for first download

### Memory Issues
If you encounter memory errors:
1. Use CPU mode (device=-1)
2. Use DistilBERT instead of RoBERTa
3. Reduce batch size in transformer pipeline

### Fallback Behavior
If advanced models are unavailable, the service automatically falls back to:
1. VADER sentiment analysis (always available)
2. Basic recommendations based on VADER results

## Development

### Testing

```bash
python -c "from services.advanced_sentiment_service import advanced_sentiment_analysis; print(advanced_sentiment_analysis('I love this product!'))"
```

### Adding Custom Models

To add custom models, modify `AdvancedSentimentAnalyzer` class in `advanced_sentiment_service.py`:

```python
def _analyze_with_custom_model(self, text: str):
    # Your custom model logic
    pass
```

Then add it to the `analyze()` method's ensemble.

