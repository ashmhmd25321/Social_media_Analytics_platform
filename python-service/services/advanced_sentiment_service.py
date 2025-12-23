"""
Advanced ML-Based Sentiment Analysis Service
Uses transformer models and ensemble methods for professional sentiment analysis
"""
import os
import numpy as np
from typing import Dict, List, Any, Optional
import warnings
warnings.filterwarnings('ignore')

# Try to import advanced ML libraries
try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("Warning: transformers library not available. Install with: pip install transformers torch")

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import VotingClassifier, RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, classification_report
    import joblib
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("Warning: scikit-learn not available. Install with: pip install scikit-learn")

try:
    import nltk
    from nltk.sentiment import SentimentIntensityAnalyzer
    from nltk.tokenize import sent_tokenize, word_tokenize
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    NLTK_AVAILABLE = True
except ImportError:
    NLTK_AVAILABLE = False
    print("Warning: NLTK not available")

try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    print("Warning: spaCy not available")

# TextBlob for additional sentiment analysis
try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    TEXTBLOB_AVAILABLE = False
    print("Warning: TextBlob not available. Install with: pip install textblob")


class AdvancedSentimentAnalyzer:
    """
    Advanced ML-based sentiment analyzer using ensemble methods
    Combines multiple models for robust sentiment analysis
    """
    
    def __init__(self):
        """Initialize all available sentiment analysis models"""
        self.models = {}
        self.vectorizer = None
        self.ensemble_model = None
        
        # Initialize VADER (always available as fallback)
        if NLTK_AVAILABLE:
            try:
                nltk.download('vader_lexicon', quiet=True)
                nltk.download('stopwords', quiet=True)
                nltk.download('wordnet', quiet=True)
                nltk.download('punkt', quiet=True)
                self.vader = SentimentIntensityAnalyzer()
                self.stop_words = set(stopwords.words('english'))
                self.lemmatizer = WordNetLemmatizer()
            except Exception as e:
                print(f"Error initializing NLTK: {e}")
                self.vader = None
        else:
            self.vader = None
        
        # Initialize Transformer models (BERT/RoBERTa)
        if TRANSFORMERS_AVAILABLE:
            try:
                # Use a lightweight but effective model
                model_name = "cardiffnlp/twitter-roberta-base-sentiment-latest"
                try:
                    self.transformer_pipeline = pipeline(
                        "sentiment-analysis",
                        model=model_name,
                        tokenizer=model_name,
                        device=-1  # Use CPU (-1) or GPU (0+)
                    )
                    self.models['transformer'] = True
                except Exception as e:
                    print(f"Could not load transformer model {model_name}: {e}")
                    # Fallback to distilbert
                    try:
                        model_name = "distilbert-base-uncased-finetuned-sst-2-english"
                        self.transformer_pipeline = pipeline(
                            "sentiment-analysis",
                            model=model_name,
                            device=-1
                        )
                        self.models['transformer'] = True
                    except Exception as e2:
                        print(f"Could not load fallback transformer model: {e2}")
                        self.transformer_pipeline = None
                        self.models['transformer'] = False
            except Exception as e:
                print(f"Error initializing transformers: {e}")
                self.transformer_pipeline = None
                self.models['transformer'] = False
        else:
            self.transformer_pipeline = None
            self.models['transformer'] = False
        
        # Initialize TextBlob
        if TEXTBLOB_AVAILABLE:
            self.models['textblob'] = True
        else:
            self.models['textblob'] = False
        
        # Initialize spaCy for advanced features
        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load("en_core_web_sm")
                self.models['spacy'] = True
            except OSError:
                print("spaCy model not found. Install with: python -m spacy download en_core_web_sm")
                self.nlp = None
                self.models['spacy'] = False
        else:
            self.nlp = None
            self.models['spacy'] = False
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for analysis"""
        if not text:
            return ""
        
        # Basic cleaning
        text = text.lower().strip()
        
        # Remove URLs
        import re
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        return text
    
    def _extract_features(self, text: str) -> Dict[str, Any]:
        """Extract advanced features from text"""
        features = {
            'length': len(text),
            'word_count': len(text.split()),
            'sentence_count': len(sent_tokenize(text)) if NLTK_AVAILABLE else 1,
            'exclamation_count': text.count('!'),
            'question_count': text.count('?'),
            'uppercase_ratio': sum(1 for c in text if c.isupper()) / len(text) if text else 0,
            'has_hashtags': '#' in text,
            'has_mentions': '@' in text,
            'has_urls': 'http' in text.lower() or 'www' in text.lower(),
        }
        
        # Extract emotional indicators
        if NLTK_AVAILABLE and self.vader:
            vader_scores = self.vader.polarity_scores(text)
            features['vader_compound'] = vader_scores['compound']
            features['vader_pos'] = vader_scores['pos']
            features['vader_neu'] = vader_scores['neu']
            features['vader_neg'] = vader_scores['neg']
        
        # Extract linguistic features using spaCy
        if SPACY_AVAILABLE and self.nlp:
            doc = self.nlp(text)
            features['noun_count'] = sum(1 for token in doc if token.pos_ == 'NOUN')
            features['verb_count'] = sum(1 for token in doc if token.pos_ == 'VERB')
            features['adjective_count'] = sum(1 for token in doc if token.pos_ == 'ADJ')
            features['adverb_count'] = sum(1 for token in doc if token.pos_ == 'ADV')
            features['entity_count'] = len(doc.ents)
        
        return features
    
    def _analyze_with_transformer(self, text: str) -> Optional[Dict[str, Any]]:
        """Analyze sentiment using transformer model"""
        if not self.transformer_pipeline:
            return None
        
        try:
            # Truncate text if too long (transformer models have token limits)
            max_length = 512
            if len(text) > max_length:
                text = text[:max_length]
            
            result = self.transformer_pipeline(text)[0]
            
            # Map transformer labels to our format
            label = result['label'].lower()
            score = result['score']
            
            # Convert to our classification format
            if 'positive' in label or 'pos' in label:
                classification = 'positive'
                compound = score
            elif 'negative' in label or 'neg' in label:
                classification = 'negative'
                compound = -score
            else:
                classification = 'neutral'
                compound = 0.0
            
            return {
                'classification': classification,
                'confidence': score,
                'compound': compound,
                'model': 'transformer'
            }
        except Exception as e:
            print(f"Transformer analysis error: {e}")
            return None
    
    def _analyze_with_vader(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment using VADER"""
        if not self.vader:
            return {
                'classification': 'neutral',
                'confidence': 0.0,
                'compound': 0.0,
                'model': 'vader'
            }
        
        scores = self.vader.polarity_scores(text)
        
        # Classify based on compound score
        if scores['compound'] >= 0.05:
            classification = 'positive'
        elif scores['compound'] <= -0.05:
            classification = 'negative'
        else:
            classification = 'neutral'
        
        return {
            'classification': classification,
            'confidence': abs(scores['compound']),
            'compound': scores['compound'],
            'pos': scores['pos'],
            'neu': scores['neu'],
            'neg': scores['neg'],
            'model': 'vader'
        }
    
    def _analyze_with_textblob(self, text: str) -> Optional[Dict[str, Any]]:
        """Analyze sentiment using TextBlob"""
        if not TEXTBLOB_AVAILABLE:
            return None
        
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity
            subjectivity = blob.sentiment.subjectivity
            
            # Classify
            if polarity > 0.1:
                classification = 'positive'
            elif polarity < -0.1:
                classification = 'negative'
            else:
                classification = 'neutral'
            
            return {
                'classification': classification,
                'confidence': abs(polarity),
                'compound': polarity,
                'subjectivity': subjectivity,
                'model': 'textblob'
            }
        except Exception as e:
            print(f"TextBlob analysis error: {e}")
            return None
    
    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Perform advanced sentiment analysis using ensemble of models
        Returns comprehensive sentiment analysis with recommendations
        """
        if not text or not text.strip():
            return self._empty_result()
        
        # Preprocess text
        processed_text = self._preprocess_text(text)
        
        # Get results from all available models
        results = []
        
        # Transformer model (most accurate)
        transformer_result = self._analyze_with_transformer(processed_text)
        if transformer_result:
            results.append(transformer_result)
        
        # VADER (always available)
        vader_result = self._analyze_with_vader(processed_text)
        results.append(vader_result)
        
        # TextBlob
        textblob_result = self._analyze_with_textblob(processed_text)
        if textblob_result:
            results.append(textblob_result)
        
        # Ensemble prediction (weighted voting)
        final_classification, final_confidence, final_compound = self._ensemble_predict(results)
        
        # Extract features
        features = self._extract_features(text)
        
        # Analyze sentences
        sentences = sent_tokenize(text) if NLTK_AVAILABLE else [text]
        sentence_analyses = []
        for sentence in sentences:
            if sentence.strip():
                sent_vader = self._analyze_with_vader(sentence)
                sentence_analyses.append({
                    'sentence': sentence,
                    'classification': sent_vader['classification'],
                    'compound': sent_vader['compound']
                })
        
        # Calculate sentiment distribution
        sentiment_distribution = {
            'positive': sum(1 for r in results if r['classification'] == 'positive'),
            'neutral': sum(1 for r in results if r['classification'] == 'neutral'),
            'negative': sum(1 for r in results if r['classification'] == 'negative')
        }
        
        # Determine overall confidence
        avg_confidence = np.mean([r['confidence'] for r in results])
        
        return {
            'classification': final_classification,
            'confidence': float(final_confidence),
            'compound': float(final_compound),
            'pos': float(vader_result.get('pos', 0.0)),
            'neu': float(vader_result.get('neu', 0.0)),
            'neg': float(vader_result.get('neg', 0.0)),
            'sentences': sentence_analyses,
            'features': features,
            'model_results': {
                'transformer': transformer_result,
                'vader': vader_result,
                'textblob': textblob_result
            },
            'sentiment_distribution': sentiment_distribution,
            'ensemble_confidence': float(avg_confidence),
            'models_used': [r['model'] for r in results]
        }
    
    def _ensemble_predict(self, results: List[Dict[str, Any]]) -> tuple:
        """
        Ensemble prediction using weighted voting
        Transformer models get higher weight
        """
        if not results:
            return 'neutral', 0.0, 0.0
        
        # Weight different models
        weights = {
            'transformer': 0.5,
            'vader': 0.3,
            'textblob': 0.2
        }
        
        # Weighted voting
        classification_scores = {'positive': 0.0, 'neutral': 0.0, 'negative': 0.0}
        compound_sum = 0.0
        weight_sum = 0.0
        
        for result in results:
            model = result.get('model', 'vader')
            weight = weights.get(model, 0.1)
            
            classification = result['classification']
            classification_scores[classification] += weight * result['confidence']
            
            compound_sum += weight * result.get('compound', 0.0)
            weight_sum += weight
        
        # Normalize
        if weight_sum > 0:
            compound_sum /= weight_sum
            for key in classification_scores:
                classification_scores[key] /= weight_sum
        
        # Get final classification
        final_classification = max(classification_scores, key=classification_scores.get)
        final_confidence = classification_scores[final_classification]
        
        return final_classification, final_confidence, compound_sum
    
    def _empty_result(self) -> Dict[str, Any]:
        """Return empty result structure"""
        return {
            'classification': 'neutral',
            'confidence': 0.0,
            'compound': 0.0,
            'pos': 0.0,
            'neu': 1.0,
            'neg': 0.0,
            'sentences': [],
            'features': {},
            'model_results': {},
            'sentiment_distribution': {'positive': 0, 'neutral': 1, 'negative': 0},
            'ensemble_confidence': 0.0,
            'models_used': []
        }


class SentimentRecommendationEngine:
    """
    Generate actionable recommendations based on sentiment analysis
    """
    
    def __init__(self):
        """Initialize recommendation engine"""
        pass
    
    def generate_recommendations(self, sentiment_result: Dict[str, Any], text: str, context: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Generate recommendations based on sentiment analysis
        
        Args:
            sentiment_result: Result from sentiment analysis
            text: Original text analyzed
            context: Optional context (platform, post_type, etc.)
        
        Returns:
            List of recommendation dictionaries
        """
        recommendations = []
        
        classification = sentiment_result.get('classification', 'neutral')
        confidence = sentiment_result.get('confidence', 0.0)
        compound = sentiment_result.get('compound', 0.0)
        features = sentiment_result.get('features', {})
        
        # High negative sentiment recommendations
        if classification == 'negative' and abs(compound) > 0.5:
            recommendations.append({
                'type': 'crisis_management',
                'priority': 'high',
                'title': 'Address Negative Sentiment Immediately',
                'description': 'Strong negative sentiment detected. Consider:',
                'actions': [
                    'Respond quickly to address concerns',
                    'Acknowledge the issue publicly',
                    'Offer solutions or compensation',
                    'Monitor closely for escalation',
                    'Consider removing or editing the content'
                ],
                'urgency': 'high'
            })
        
        # Moderate negative sentiment
        elif classification == 'negative' and abs(compound) > 0.2:
            recommendations.append({
                'type': 'engagement',
                'priority': 'medium',
                'title': 'Improve Content Sentiment',
                'description': 'Negative sentiment detected. Suggestions:',
                'actions': [
                    'Add more positive language',
                    'Include solutions or benefits',
                    'Use more empathetic tone',
                    'Add visual content to balance text',
                    'Consider reposting with improvements'
                ],
                'urgency': 'medium'
            })
        
        # Low confidence recommendations
        if confidence < 0.3:
            recommendations.append({
                'type': 'clarity',
                'priority': 'medium',
                'title': 'Improve Content Clarity',
                'description': 'Sentiment is ambiguous. Consider:',
                'actions': [
                    'Use clearer, more direct language',
                    'Add context to clarify intent',
                    'Use stronger emotional indicators',
                    'Consider adding emojis or visual cues',
                    'Test with focus group before posting'
                ],
                'urgency': 'low'
            })
        
        # Positive sentiment optimization
        if classification == 'positive' and compound > 0.5:
            recommendations.append({
                'type': 'optimization',
                'priority': 'low',
                'title': 'Leverage Positive Sentiment',
                'description': 'Strong positive sentiment. Opportunities:',
                'actions': [
                    'Boost this content for wider reach',
                    'Use as template for future content',
                    'Engage with positive comments',
                    'Share on multiple platforms',
                    'Create similar content to maintain momentum'
                ],
                'urgency': 'low'
            })
        
        # Content structure recommendations
        word_count = features.get('word_count', 0)
        if word_count > 300:
            recommendations.append({
                'type': 'structure',
                'priority': 'low',
                'title': 'Optimize Content Length',
                'description': 'Content is quite long. Consider:',
                'actions': [
                    'Break into multiple posts',
                    'Add visual breaks (images, videos)',
                    'Use bullet points for key messages',
                    'Create a series instead of one long post',
                    'Test shorter versions for better engagement'
                ],
                'urgency': 'low'
            })
        elif word_count < 20:
            recommendations.append({
                'type': 'structure',
                'priority': 'medium',
                'title': 'Enhance Content Depth',
                'description': 'Content is very short. Consider:',
                'actions': [
                    'Add more context or details',
                    'Include call-to-action',
                    'Add relevant hashtags',
                    'Provide value or insight',
                    'Engage audience with questions'
                ],
                'urgency': 'medium'
            })
        
        # Engagement recommendations based on features
        if features.get('has_hashtags', False):
            recommendations.append({
                'type': 'optimization',
                'priority': 'low',
                'title': 'Hashtag Strategy',
                'description': 'Content includes hashtags. Optimize:',
                'actions': [
                    'Use 3-5 relevant hashtags (not too many)',
                    'Mix popular and niche hashtags',
                    'Research trending hashtags in your niche',
                    'Create branded hashtags for campaigns',
                    'Monitor hashtag performance'
                ],
                'urgency': 'low'
            })
        
        if not features.get('has_hashtags', False) and word_count > 50:
            recommendations.append({
                'type': 'optimization',
                'priority': 'medium',
                'title': 'Add Hashtags',
                'description': 'Consider adding hashtags to increase discoverability',
                'actions': [
                    'Research relevant hashtags',
                    'Add 3-5 strategic hashtags',
                    'Use platform-specific best practices',
                    'Avoid over-hashtagging'
                ],
                'urgency': 'medium'
            })
        
        # Platform-specific recommendations (if context provided)
        if context:
            platform = context.get('platform', '').lower()
            
            # Facebook recommendations
            if platform in ['facebook', 'fb']:
                if word_count > 5000:
                    recommendations.append({
                        'type': 'platform',
                        'priority': 'medium',
                        'title': 'Facebook Post Length',
                        'description': 'Content is very long for Facebook. Optimal length is 40-80 characters for engagement',
                        'actions': [
                            'Consider shortening to 40-80 characters for better engagement',
                            'Use Facebook Notes for longer content',
                            'Break into multiple posts with a series',
                            'Add engaging visuals to maintain attention'
                        ],
                        'urgency': 'medium'
                    })
                elif word_count < 10:
                    recommendations.append({
                        'type': 'platform',
                        'priority': 'low',
                        'title': 'Facebook Post Engagement',
                        'description': 'Very short posts may have lower engagement on Facebook',
                        'actions': [
                            'Add more context or value',
                            'Include a call-to-action',
                            'Ask a question to encourage comments',
                            'Add relevant hashtags (1-2 recommended)'
                        ],
                        'urgency': 'low'
                    })
            
            # Instagram recommendations
            elif platform in ['instagram', 'ig']:
                if word_count > 2200:
                    recommendations.append({
                        'type': 'platform',
                        'priority': 'high',
                        'title': 'Instagram Caption Limit',
                        'description': 'Content exceeds Instagram caption limit (2,200 characters)',
                        'actions': [
                            'Shorten to 2,200 characters or less',
                            'Use Instagram Notes for additional context',
                            'Break into multiple posts',
                            'Move detailed content to Instagram Stories or Reels'
                        ],
                        'urgency': 'high'
                    })
                elif word_count > 125:
                    recommendations.append({
                        'type': 'platform',
                        'priority': 'low',
                        'title': 'Instagram Caption Length',
                        'description': 'Long captions may reduce engagement. Optimal is 125 characters or less',
                        'actions': [
                            'Consider shortening caption',
                            'Use line breaks for readability',
                            'Put key message in first 125 characters',
                            'Add relevant hashtags (5-10 recommended)'
                        ],
                        'urgency': 'low'
                    })
                if not features.get('has_hashtags', False):
                    recommendations.append({
                        'type': 'platform',
                        'priority': 'medium',
                        'title': 'Instagram Hashtags',
                        'description': 'Hashtags are crucial for Instagram discoverability',
                        'actions': [
                            'Add 5-10 relevant hashtags',
                            'Mix popular and niche hashtags',
                            'Use branded hashtags for campaigns',
                            'Research trending hashtags in your niche'
                        ],
                        'urgency': 'medium'
                    })
            
            # YouTube recommendations
            elif platform in ['youtube', 'yt']:
                if word_count < 100:
                    recommendations.append({
                        'type': 'platform',
                        'priority': 'medium',
                        'title': 'YouTube Description Optimization',
                        'description': 'YouTube descriptions should be comprehensive for SEO',
                        'actions': [
                            'Expand description with more details',
                            'Include relevant keywords for SEO',
                            'Add timestamps for longer videos',
                            'Include links to related content',
                            'Add call-to-action (subscribe, like, comment)'
                        ],
                        'urgency': 'medium'
                    })
                if not features.get('has_hashtags', False) and word_count > 50:
                    recommendations.append({
                        'type': 'platform',
                        'priority': 'low',
                        'title': 'YouTube Hashtags',
                        'description': 'Consider adding hashtags to YouTube description',
                        'actions': [
                            'Add 3-5 relevant hashtags',
                            'Place hashtags at the end of description',
                            'Use hashtags that match your video topic',
                            'Research trending hashtags in your niche'
                        ],
                        'urgency': 'low'
                    })
        
        # Sentence-level recommendations
        sentences = sentiment_result.get('sentences', [])
        if len(sentences) > 1:
            negative_sentences = [s for s in sentences if s.get('classification') == 'negative']
            if negative_sentences:
                recommendations.append({
                    'type': 'content_improvement',
                    'priority': 'medium',
                    'title': 'Review Negative Sentences',
                    'description': f'Found {len(negative_sentences)} negative sentence(s). Consider revising:',
                    'actions': [
                        'Review and rephrase negative sentences',
                        'Add positive framing',
                        'Use solution-focused language',
                        'Balance with positive statements'
                    ],
                    'urgency': 'medium',
                    'details': [s['sentence'] for s in negative_sentences[:3]]  # Show first 3
                })
        
        return recommendations


# Global instance
_analyzer = None
_recommendation_engine = None

def get_analyzer() -> AdvancedSentimentAnalyzer:
    """Get or create global analyzer instance"""
    global _analyzer
    if _analyzer is None:
        _analyzer = AdvancedSentimentAnalyzer()
    return _analyzer

def get_recommendation_engine() -> SentimentRecommendationEngine:
    """Get or create global recommendation engine instance"""
    global _recommendation_engine
    if _recommendation_engine is None:
        _recommendation_engine = SentimentRecommendationEngine()
    return _recommendation_engine

def advanced_sentiment_analysis(text: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Main function for advanced sentiment analysis with recommendations
    
    Args:
        text: Text to analyze
        context: Optional context (platform, post_type, etc.)
    
    Returns:
        Complete analysis with recommendations
    """
    analyzer = get_analyzer()
    recommendation_engine = get_recommendation_engine()
    
    # Perform sentiment analysis
    sentiment_result = analyzer.analyze(text)
    
    # Generate recommendations
    recommendations = recommendation_engine.generate_recommendations(
        sentiment_result, text, context
    )
    
    # Combine results
    return {
        **sentiment_result,
        'recommendations': recommendations,
        'recommendation_count': len(recommendations)
    }

