# Python ML/NLP Service Setup Guide

## Overview

This guide explains how to set up and run the Python ML/NLP service that provides advanced analytics capabilities as specified in Document 15.pdf.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation Steps

### 1. Navigate to Python Service Directory

```bash
cd python-service
```

### 2. Create Virtual Environment (Recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Download spaCy Model

```bash
python -m spacy download en_core_web_sm
```

### 5. Download NLTK Data

The service will automatically download NLTK data on first run, but you can also download manually:

```python
import nltk
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
nltk.download('maxent_ne_chunker')
nltk.download('words')
nltk.download('vader_lexicon')
```

### 6. Configure Environment Variables

Create a `.env` file in `python-service/` directory:

```env
PYTHON_SERVICE_PORT=5000
FLASK_DEBUG=False
```

### 7. Start the Service

```bash
python app.py
```

The service will start on `http://localhost:5000` by default.

## Configuration in Node.js Backend

Add this to your `backend/.env` file:

```env
PYTHON_SERVICE_URL=http://localhost:5000
```

## Testing the Service

### Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "python-ml-nlp-service",
  "version": "1.0.0"
}
```

### Test Topic Modeling

```bash
curl -X POST http://localhost:5000/api/nlp/topic-modeling \
  -H "Content-Type: application/json" \
  -d '{
    "texts": [
      "I love social media marketing",
      "Best practices for engagement",
      "Content strategy tips"
    ],
    "num_topics": 2,
    "num_words": 5
  }'
```

## Service Endpoints

### NLP Endpoints

- `POST /api/nlp/topic-modeling` - Topic modeling using LDA
- `POST /api/nlp/entity-recognition` - Extract named entities
- `POST /api/nlp/advanced-sentiment` - Advanced sentiment analysis
- `POST /api/nlp/text-classification` - Classify text

### Network Analysis Endpoints

- `POST /api/network/hashtag-network` - Build hashtag networks
- `POST /api/network/mention-network` - Build mention networks
- `POST /api/network/community-detection` - Detect communities
- `POST /api/network/influence-analysis` - Analyze influence

### Predictive Modeling Endpoints

- `POST /api/predictive/engagement-prediction` - Predict engagement
- `POST /api/predictive/best-posting-time` - Predict best posting time
- `POST /api/predictive/trend-forecast` - Forecast trends

### Statistics Endpoints

- `POST /api/statistics/descriptive` - Descriptive statistics
- `POST /api/statistics/correlation` - Correlation analysis
- `POST /api/statistics/time-series` - Time series analysis
- `POST /api/statistics/distribution` - Distribution analysis

## Troubleshooting

### Issue: ModuleNotFoundError

**Solution**: Make sure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Issue: spaCy model not found

**Solution**: Download the model:
```bash
python -m spacy download en_core_web_sm
```

### Issue: NLTK data not found

**Solution**: The service will download data automatically, but if issues persist:
```python
import nltk
nltk.download('all')
```

### Issue: Service not responding

**Solution**: 
1. Check if the service is running on the correct port
2. Verify `PYTHON_SERVICE_URL` in Node.js backend `.env` matches the Python service port
3. Check firewall settings

## Development

For development with auto-reload:

```bash
FLASK_DEBUG=True python app.py
```

## Integration with Node.js

The Node.js backend automatically integrates with the Python service via `PythonMLService` (`backend/src/services/PythonMLService.ts`). The service gracefully handles cases where the Python service is unavailable, falling back to Node.js implementations when possible.

## Production Deployment

For production:
1. Use a production WSGI server (e.g., Gunicorn)
2. Set `FLASK_DEBUG=False`
3. Use environment variables for configuration
4. Set up proper logging
5. Consider containerization (Docker)

Example with Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

