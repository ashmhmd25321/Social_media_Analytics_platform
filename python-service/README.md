# Python ML/NLP Service

Python microservice for advanced machine learning and natural language processing tasks.

## Overview

This service provides advanced analytics capabilities using Python libraries as specified in Document 15.pdf:
- **Advanced NLP**: Entity recognition, topic modeling, advanced sentiment analysis
- **Network Analysis**: Hashtag networks, mention networks, community detection, influence analysis
- **Predictive Modeling**: Engagement prediction, best posting time prediction, trend forecasting
- **Advanced Statistics**: Descriptive statistics, correlation analysis, time series analysis, distribution analysis

## Technology Stack

- **Framework**: Flask
- **ML Libraries**: scikit-learn, pandas, numpy
- **NLP Libraries**: NLTK, spaCy
- **Network Analysis**: NetworkX
- **Topic Modeling**: Gensim

## Installation

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Download spaCy model:**
   ```bash
   python -m spacy download en_core_web_sm
   ```

3. **Download NLTK data (if needed):**
   ```python
   import nltk
   nltk.download('punkt')
   nltk.download('averaged_perceptron_tagger')
   nltk.download('maxent_ne_chunker')
   nltk.download('words')
   nltk.download('vader_lexicon')
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Running the Service

```bash
python app.py
```

The service will start on port 5000 by default (configurable via `PYTHON_SERVICE_PORT`).

## API Endpoints

### Health Check
- `GET /health` - Service health check

### NLP Endpoints
- `POST /api/nlp/topic-modeling` - Perform topic modeling
- `POST /api/nlp/entity-recognition` - Extract named entities
- `POST /api/nlp/advanced-sentiment` - Advanced sentiment analysis
- `POST /api/nlp/text-classification` - Classify text

### Network Analysis Endpoints
- `POST /api/network/hashtag-network` - Build hashtag co-occurrence network
- `POST /api/network/mention-network` - Build mention network
- `POST /api/network/community-detection` - Detect communities
- `POST /api/network/influence-analysis` - Analyze influence

### Predictive Modeling Endpoints
- `POST /api/predictive/engagement-prediction` - Predict engagement
- `POST /api/predictive/best-posting-time` - Predict best posting time
- `POST /api/predictive/trend-forecast` - Forecast trends

### Statistics Endpoints
- `POST /api/statistics/descriptive` - Calculate descriptive statistics
- `POST /api/statistics/correlation` - Calculate correlations
- `POST /api/statistics/time-series` - Time series analysis
- `POST /api/statistics/distribution` - Distribution analysis

## Integration with Node.js Backend

The Node.js backend communicates with this service via HTTP requests. See `backend/src/services/PythonMLService.ts` for integration.

## Development

```bash
# Run in development mode
FLASK_DEBUG=True python app.py
```

## Notes

- First run may take time to download NLTK data
- spaCy model (`en_core_web_sm`) must be downloaded separately
- Some endpoints require minimum data points for accurate results

