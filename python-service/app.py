"""
Python ML/NLP Service for Social Media Analytics Platform
Handles advanced NLP, ML, network analysis, and statistical tasks
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS for Node.js backend - allow all origins in development
CORS(app, resources={
    r"/api/*": {"origins": "*"},
    r"/health": {"origins": "*"}
})

# Import service modules
from services import (
    nlp_service,
    network_analysis_service,
    predictive_modeling_service,
    statistics_service,
    topic_modeling_service
)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'python-ml-nlp-service',
        'version': '1.0.0'
    })

# =====================================================
# Advanced NLP Endpoints
# =====================================================

@app.route('/api/nlp/topic-modeling', methods=['POST'])
def topic_modeling():
    """Perform topic modeling on texts"""
    try:
        data = request.json
        texts = data.get('texts', [])
        num_topics = data.get('num_topics', 5)
        num_words = data.get('num_words', 10)
        
        if not texts:
            return jsonify({'error': 'Texts array is required'}), 400
        
        result = topic_modeling_service.analyze_topics(texts, num_topics, num_words)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/nlp/entity-recognition', methods=['POST'])
def entity_recognition():
    """Extract named entities from text"""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        result = nlp_service.extract_entities(text)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/nlp/advanced-sentiment', methods=['POST'])
def advanced_sentiment():
    """Advanced ML-based sentiment analysis with recommendations"""
    try:
        data = request.json
        text = data.get('text', '')
        context = data.get('context', {})  # Optional context (platform, post_type, etc.)
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        result = nlp_service.advanced_sentiment_analysis(text, context)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        import traceback
        print(f"Error in advanced sentiment analysis: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/nlp/text-classification', methods=['POST'])
def text_classification():
    """Classify text into categories"""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        result = nlp_service.classify_text(text)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =====================================================
# Network Analysis Endpoints
# =====================================================

@app.route('/api/network/hashtag-network', methods=['POST'])
def hashtag_network():
    """Build hashtag co-occurrence network"""
    try:
        data = request.json
        posts = data.get('posts', [])  # Array of post objects with hashtags
        
        if not posts:
            return jsonify({'error': 'Posts array is required'}), 400
        
        result = network_analysis_service.build_hashtag_network(posts)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/mention-network', methods=['POST'])
def mention_network():
    """Build mention/interaction network"""
    try:
        data = request.json
        posts = data.get('posts', [])
        
        if not posts:
            return jsonify({'error': 'Posts array is required'}), 400
        
        result = network_analysis_service.build_mention_network(posts)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/community-detection', methods=['POST'])
def community_detection():
    """Detect communities in network"""
    try:
        data = request.json
        network_data = data.get('network', {})
        
        if not network_data:
            return jsonify({'error': 'Network data is required'}), 400
        
        result = network_analysis_service.detect_communities(network_data)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/influence-analysis', methods=['POST'])
def influence_analysis():
    """Analyze influence in network"""
    try:
        data = request.json
        network_data = data.get('network', {})
        
        if not network_data:
            return jsonify({'error': 'Network data is required'}), 400
        
        result = network_analysis_service.analyze_influence(network_data)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =====================================================
# Predictive Modeling Endpoints
# =====================================================

@app.route('/api/predictive/engagement-prediction', methods=['POST'])
def engagement_prediction():
    """Predict engagement for a post"""
    try:
        data = request.json
        post_features = data.get('features', {})
        
        if not post_features:
            return jsonify({'error': 'Post features are required'}), 400
        
        result = predictive_modeling_service.predict_engagement(post_features)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predictive/best-posting-time', methods=['POST'])
def best_posting_time():
    """Predict best time to post"""
    try:
        data = request.json
        historical_data = data.get('historical_data', [])
        user_id = data.get('user_id')
        
        if not historical_data:
            return jsonify({'error': 'Historical data is required'}), 400
        
        result = predictive_modeling_service.predict_best_posting_time(historical_data)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predictive/trend-forecast', methods=['POST'])
def trend_forecast():
    """Forecast trends"""
    try:
        data = request.json
        time_series = data.get('time_series', [])
        forecast_periods = data.get('forecast_periods', 7)
        
        if not time_series:
            return jsonify({'error': 'Time series data is required'}), 400
        
        result = predictive_modeling_service.forecast_trends(time_series, forecast_periods)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =====================================================
# Advanced Statistics Endpoints
# =====================================================

@app.route('/api/statistics/descriptive', methods=['POST'])
def descriptive_statistics():
    """Calculate advanced descriptive statistics"""
    try:
        data = request.json
        values = data.get('values', [])
        
        if not values:
            return jsonify({'error': 'Values array is required'}), 400
        
        result = statistics_service.calculate_descriptive_stats(values)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/statistics/correlation', methods=['POST'])
def correlation_analysis():
    """Calculate correlation between variables"""
    try:
        data = request.json
        variables = data.get('variables', {})  # {var1: [values], var2: [values]}
        
        if not variables or len(variables) < 2:
            return jsonify({'error': 'At least two variables are required'}), 400
        
        result = statistics_service.calculate_correlation(variables)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/statistics/time-series', methods=['POST'])
def time_series_analysis():
    """Perform time series analysis"""
    try:
        data = request.json
        time_series = data.get('time_series', [])  # [{date, value}]
        
        if not time_series:
            return jsonify({'error': 'Time series data is required'}), 400
        
        result = statistics_service.analyze_time_series(time_series)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/statistics/distribution', methods=['POST'])
def distribution_analysis():
    """Analyze distribution of data"""
    try:
        data = request.json
        values = data.get('values', [])
        
        if not values:
            return jsonify({'error': 'Values array is required'}), 400
        
        result = statistics_service.analyze_distribution(values)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PYTHON_SERVICE_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    # Bind to localhost by default, but allow override via environment variable
    host = os.getenv('PYTHON_SERVICE_HOST', '127.0.0.1')  # Use 127.0.0.1 instead of 0.0.0.0 for localhost
    print(f"[Python Service] Starting on http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)

