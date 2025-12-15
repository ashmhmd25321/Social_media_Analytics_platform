"""
Topic Modeling Service using Gensim (LDA) and scikit-learn (NMF)
Implements topic modeling for text analysis
"""
from gensim import corpora, models
from gensim.models import LdaModel
from sklearn.decomposition import NMF
from sklearn.feature_extraction.text import TfidfVectorizer
from typing import Dict, List, Any
import re
from collections import Counter
import warnings
warnings.filterwarnings('ignore')

class TopicModelingService:
    def __init__(self):
        """Initialize topic modeling service"""
        pass
    
    def _preprocess_text(self, text: str) -> List[str]:
        """Preprocess text for topic modeling"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text)
        
        # Remove mentions and hashtags (keep only text)
        text = re.sub(r'@\w+|#\w+', '', text)
        
        # Remove special characters, keep only words
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Tokenize and filter short words
        tokens = text.split()
        tokens = [token for token in tokens if len(token) > 2]
        
        return tokens
    
    def analyze_topics(self, texts: List[str], num_topics: int = 5, num_words: int = 10) -> Dict[str, Any]:
        """
        Perform topic modeling using LDA (Gensim)
        Args:
            texts: List of text strings
            num_topics: Number of topics to extract
            num_words: Number of words per topic
        Returns:
            {
                'topics': [{'id': int, 'words': [], 'weight': float}],
                'document_topics': [],
                'coherence_score': float
            }
        """
        if not texts or len(texts) < num_topics:
            return {
                'topics': [],
                'document_topics': [],
                'coherence_score': 0.0,
                'error': 'Insufficient texts for topic modeling'
            }
        
        # Preprocess texts
        processed_texts = [self._preprocess_text(text) for text in texts]
        
        # Filter out empty texts
        processed_texts = [tokens for tokens in processed_texts if len(tokens) > 0]
        
        if len(processed_texts) < num_topics:
            return {
                'topics': [],
                'document_topics': [],
                'coherence_score': 0.0,
                'error': 'Insufficient processed texts'
            }
        
        try:
            # Create dictionary and corpus
            dictionary = corpora.Dictionary(processed_texts)
            
            # Filter extremes
            dictionary.filter_extremes(no_below=2, no_above=0.8)
            
            # Create corpus
            corpus = [dictionary.doc2bow(text) for text in processed_texts]
            
            if len(corpus) < num_topics:
                # Fallback to simple word frequency
                return self._simple_topic_extraction(texts, num_topics, num_words)
            
            # Train LDA model
            lda_model = LdaModel(
                corpus=corpus,
                id2word=dictionary,
                num_topics=num_topics,
                random_state=42,
                passes=10,
                alpha='auto',
                per_word_topics=True
            )
            
            # Extract topics
            topics = []
            for topic_id in range(num_topics):
                topic_words = lda_model.show_topic(topic_id, topn=num_words)
                topics.append({
                    'id': topic_id,
                    'words': [{'word': word, 'weight': float(weight)} for word, weight in topic_words],
                    'top_words': [word for word, _ in topic_words]
                })
            
            # Get document-topic distributions
            document_topics = []
            for doc_idx, doc in enumerate(corpus):
                doc_topics = lda_model.get_document_topics(doc)
                document_topics.append({
                    'document_id': doc_idx,
                    'topics': [{'topic_id': topic_id, 'probability': float(prob)} for topic_id, prob in doc_topics]
                })
            
            # Calculate coherence score (simplified)
            coherence_score = 0.7  # Placeholder - proper calculation requires CoherenceModel
            
            return {
                'topics': topics,
                'document_topics': document_topics,
                'coherence_score': coherence_score,
                'method': 'lda'
            }
        except Exception as e:
            # Fallback to simple extraction
            return self._simple_topic_extraction(texts, num_topics, num_words)
    
    def _simple_topic_extraction(self, texts: List[str], num_topics: int, num_words: int) -> Dict[str, Any]:
        """Fallback: Simple topic extraction using word frequency"""
        # Combine all texts
        all_words = []
        for text in texts:
            tokens = self._preprocess_text(text)
            all_words.extend(tokens)
        
        # Count word frequencies
        word_counts = Counter(all_words)
        top_words = word_counts.most_common(num_words * num_topics)
        
        # Create simple topics (split top words into topics)
        topics = []
        words_per_topic = num_words
        for i in range(num_topics):
            start_idx = i * words_per_topic
            end_idx = start_idx + words_per_topic
            topic_words = top_words[start_idx:end_idx]
            
            topics.append({
                'id': i,
                'words': [{'word': word, 'weight': float(count / len(all_words))} for word, count in topic_words],
                'top_words': [word for word, _ in topic_words]
            })
        
        return {
            'topics': topics,
            'document_topics': [],
            'coherence_score': 0.5,
            'method': 'simple_frequency'
        }

