"""
Advanced NLP Service using NLTK and spaCy
Implements entity recognition, advanced sentiment analysis, and text classification
"""
import spacy
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.tag import pos_tag
from nltk.chunk import ne_chunk
import pandas as pd
from typing import Dict, List, Any
import re

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    nltk.download('averaged_perceptron_tagger', quiet=True)

try:
    nltk.data.find('chunkers/maxent_ne_chunker')
except LookupError:
    nltk.download('maxent_ne_chunker', quiet=True)

try:
    nltk.data.find('corpora/words')
except LookupError:
    nltk.download('words', quiet=True)

try:
    nltk.data.find('sentiment/vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon', quiet=True)

class NLPService:
    def __init__(self):
        """Initialize NLP service with spaCy and NLTK"""
        try:
            # Load spaCy model (download with: python -m spacy download en_core_web_sm)
            self.nlp = spacy.load('en_core_web_sm')
        except OSError:
            print("Warning: spaCy model 'en_core_web_sm' not found. Install with: python -m spacy download en_core_web_sm")
            self.nlp = None
        
        self.sia = SentimentIntensityAnalyzer()
    
    def extract_entities(self, text: str) -> Dict[str, Any]:
        """
        Extract named entities from text using spaCy and NLTK
        Returns: {
            'persons': [],
            'organizations': [],
            'locations': [],
            'dates': [],
            'money': [],
            'spacy_entities': []
        }
        """
        if not text:
            return {
                'persons': [],
                'organizations': [],
                'locations': [],
                'dates': [],
                'money': [],
                'spacy_entities': []
            }
        
        result = {
            'persons': [],
            'organizations': [],
            'locations': [],
            'dates': [],
            'money': [],
            'spacy_entities': []
        }
        
        # Use spaCy if available
        if self.nlp:
            doc = self.nlp(text)
            for ent in doc.ents:
                entity_info = {
                    'text': ent.text,
                    'label': ent.label_,
                    'start': ent.start_char,
                    'end': ent.end_char
                }
                result['spacy_entities'].append(entity_info)
                
                # Categorize by type
                if ent.label_ in ['PERSON']:
                    result['persons'].append(ent.text)
                elif ent.label_ in ['ORG', 'ORG']:
                    result['organizations'].append(ent.text)
                elif ent.label_ in ['GPE', 'LOC']:
                    result['locations'].append(ent.text)
                elif ent.label_ in ['DATE', 'TIME']:
                    result['dates'].append(ent.text)
                elif ent.label_ == 'MONEY':
                    result['money'].append(ent.text)
        
        # Use NLTK as fallback/complement
        try:
            tokens = word_tokenize(text)
            tagged = pos_tag(tokens)
            named_entities = ne_chunk(tagged, binary=False)
            
            for chunk in named_entities:
                if hasattr(chunk, 'label'):
                    if chunk.label() == 'PERSON':
                        person = ' '.join([c[0] for c in chunk])
                        if person not in result['persons']:
                            result['persons'].append(person)
                    elif chunk.label() == 'ORGANIZATION':
                        org = ' '.join([c[0] for c in chunk])
                        if org not in result['organizations']:
                            result['organizations'].append(org)
                    elif chunk.label() == 'GPE':
                        location = ' '.join([c[0] for c in chunk])
                        if location not in result['locations']:
                            result['locations'].append(location)
        except Exception as e:
            print(f"Error in NLTK entity extraction: {e}")
        
        return result
    
    def advanced_sentiment_analysis(self, text: str) -> Dict[str, Any]:
        """
        Advanced sentiment analysis using VADER and additional features
        Returns: {
            'compound': float,
            'pos': float,
            'neu': float,
            'neg': float,
            'classification': str,
            'confidence': float,
            'sentences': []
        }
        """
        if not text:
            return {
                'compound': 0.0,
                'pos': 0.0,
                'neu': 1.0,
                'neg': 0.0,
                'classification': 'neutral',
                'confidence': 0.0,
                'sentences': []
            }
        
        # VADER sentiment scores
        scores = self.sia.polarity_scores(text)
        
        # Analyze individual sentences
        sentences = sent_tokenize(text)
        sentence_sentiments = []
        for sentence in sentences:
            sent_scores = self.sia.polarity_scores(sentence)
            sentence_sentiments.append({
                'sentence': sentence,
                'compound': sent_scores['compound'],
                'classification': self._classify_sentiment(sent_scores['compound'])
            })
        
        # Determine overall classification
        classification = self._classify_sentiment(scores['compound'])
        
        # Calculate confidence
        confidence = abs(scores['compound'])
        
        return {
            'compound': scores['compound'],
            'pos': scores['pos'],
            'neu': scores['neu'],
            'neg': scores['neg'],
            'classification': classification,
            'confidence': confidence,
            'sentences': sentence_sentiments
        }
    
    def _classify_sentiment(self, compound_score: float) -> str:
        """Classify sentiment based on compound score"""
        if compound_score >= 0.05:
            return 'positive'
        elif compound_score <= -0.05:
            return 'negative'
        else:
            return 'neutral'
    
    def classify_text(self, text: str) -> Dict[str, Any]:
        """
        Classify text into categories (question, statement, call_to_action, etc.)
        Returns: {
            'category': str,
            'confidence': float,
            'features': {}
        }
        """
        if not text:
            return {
                'category': 'other',
                'confidence': 0.0,
                'features': {}
            }
        
        text_lower = text.lower()
        features = {}
        
        # Question detection
        question_words = ['what', 'when', 'where', 'who', 'why', 'how', 'which', 'whose']
        has_question_mark = '?' in text
        starts_with_question = any(text_lower.strip().startswith(word + ' ') for word in question_words)
        question_score = (has_question_mark * 0.5) + (starts_with_question * 0.5)
        features['question_score'] = question_score
        
        # Call to action detection
        cta_patterns = ['buy', 'shop', 'click', 'visit', 'sign up', 'subscribe', 'download', 'learn more', 
                       'get started', 'try now', 'order', 'purchase', 'call', 'contact']
        cta_count = sum(1 for pattern in cta_patterns if pattern in text_lower)
        cta_score = min(cta_count / 3, 1.0)
        features['cta_score'] = cta_score
        
        # Announcement detection
        announcement_patterns = ['announcing', 'introducing', 'new', 'launch', 'release', 'coming soon', 
                               'we are pleased', 'excited to']
        announcement_count = sum(1 for pattern in announcement_patterns if pattern in text_lower)
        announcement_score = min(announcement_count / 2, 1.0)
        features['announcement_score'] = announcement_score
        
        # Determine category
        if question_score > 0.5:
            category = 'question'
            confidence = question_score
        elif cta_score > 0.3:
            category = 'call_to_action'
            confidence = cta_score
        elif announcement_score > 0.3:
            category = 'announcement'
            confidence = announcement_score
        else:
            category = 'statement'
            confidence = 0.6
        
        return {
            'category': category,
            'confidence': confidence,
            'features': features
        }

