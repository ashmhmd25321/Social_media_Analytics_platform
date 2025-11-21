import natural from 'natural';
import Sentiment from 'sentiment';

/**
 * NLP Service for sentiment analysis and text processing
 */
class NLPService {
  private sentiment: Sentiment;
  private tokenizer: natural.WordTokenizer;
  private stemmer: any;

  constructor() {
    this.sentiment = new Sentiment();
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
  }

  /**
   * Detect emotion from text using keyword analysis
   */
  private detectEmotion(text: string, sentiment: any): {
    emotion: string;
    confidence: number;
  } {
    const lowerText = text.toLowerCase();
    const emotions: { [key: string]: { keywords: string[]; weight: number } } = {
      happy: {
        keywords: ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic', 'love', 'loved', 'awesome', 'brilliant', 'delighted', 'pleased', 'thrilled', 'ecstatic', 'cheerful', 'glad', '😊', '😍', '😄', '😃', '😁', '🎉', '❤️'],
        weight: 1.0,
      },
      sad: {
        keywords: ['sad', 'unhappy', 'depressed', 'disappointed', 'upset', 'down', 'miserable', 'sorrow', 'grief', 'tears', 'crying', '😢', '😭', '😞', '💔'],
        weight: 1.0,
      },
      angry: {
        keywords: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'frustrated', 'rage', 'outraged', 'livid', '😠', '😡', '🤬'],
        weight: 1.0,
      },
      surprised: {
        keywords: ['surprised', 'shocked', 'amazed', 'astonished', 'wow', 'unbelievable', 'incredible', '😲', '😮', '🤯'],
        weight: 0.8,
      },
      fearful: {
        keywords: ['afraid', 'scared', 'worried', 'anxious', 'nervous', 'fear', 'terrified', 'panic', '😨', '😰', '😱'],
        weight: 0.9,
      },
      disgusted: {
        keywords: ['disgusted', 'disgusting', 'gross', 'nasty', 'revolting', '🤢', '🤮'],
        weight: 0.8,
      },
      neutral: {
        keywords: ['okay', 'fine', 'alright', 'normal', 'regular', 'standard'],
        weight: 0.5,
      },
    };

    const emotionScores: { [key: string]: number } = {};
    
    // Calculate emotion scores based on keywords
    for (const [emotion, data] of Object.entries(emotions)) {
      let score = 0;
      for (const keyword of data.keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          score += matches.length * data.weight;
        }
      }
      emotionScores[emotion] = score;
    }

    // Boost emotion based on sentiment score
    if (sentiment.comparative > 0.3) {
      emotionScores.happy = (emotionScores.happy || 0) + 0.5;
    } else if (sentiment.comparative < -0.3) {
      emotionScores.sad = (emotionScores.sad || 0) + 0.3;
      emotionScores.angry = (emotionScores.angry || 0) + 0.2;
    }

    // Find the emotion with highest score
    const sortedEmotions = Object.entries(emotionScores)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, score]) => score > 0);

    if (sortedEmotions.length === 0) {
      return { emotion: 'neutral', confidence: 0.5 };
    }

    const [topEmotion, topScore] = sortedEmotions[0];
    const totalScore = sortedEmotions.reduce((sum, [_, score]) => sum + score, 0);
    const confidence = totalScore > 0 ? Math.min(topScore / totalScore, 1.0) : 0.5;

    return {
      emotion: topEmotion,
      confidence: Math.max(confidence, 0.3), // Minimum confidence
    };
  }

  /**
   * Analyze sentiment of text with emotion detection
   * Returns: { score, comparative, classification, emotion, emotionConfidence, positive, negative }
   */
  analyzeSentiment(text: string): {
    score: number;
    comparative: number;
    classification: 'positive' | 'neutral' | 'negative';
    emotion: string;
    emotionConfidence: number;
    positive: string[];
    negative: string[];
    tokens: string[];
  } {
    if (!text || text.trim().length === 0) {
      return {
        score: 0,
        comparative: 0,
        classification: 'neutral',
        emotion: 'neutral',
        emotionConfidence: 0.5,
        positive: [],
        negative: [],
        tokens: [],
      };
    }

    const result = this.sentiment.analyze(text);
    const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];

    // Classify sentiment
    let classification: 'positive' | 'neutral' | 'negative';
    if (result.comparative > 0.1) {
      classification = 'positive';
    } else if (result.comparative < -0.1) {
      classification = 'negative';
    } else {
      classification = 'neutral';
    }

    // Detect emotion
    const emotionData = this.detectEmotion(text, result);

    return {
      score: result.score,
      comparative: result.comparative,
      classification,
      emotion: emotionData.emotion,
      emotionConfidence: emotionData.confidence,
      positive: result.positive || [],
      negative: result.negative || [],
      tokens: tokens.slice(0, 50), // Limit tokens
    };
  }

  /**
   * Analyze sentiment of multiple texts (batch processing)
   */
  analyzeSentimentBatch(texts: string[]): Array<{
    text: string;
    sentiment: {
      score: number;
      comparative: number;
      classification: 'positive' | 'neutral' | 'negative';
      emotion: string;
      emotionConfidence: number;
      positive: string[];
      negative: string[];
      tokens: string[];
    };
  }> {
    return texts.map((text) => ({
      text,
      sentiment: this.analyzeSentiment(text),
    }));
  }

  /**
   * Extract keywords from text with TF-IDF scoring
   * Returns array of { word, score } objects
   */
  extractKeywords(text: string, limit: number = 10): Array<{ word: string; score: number }> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
    
    // Remove stopwords and short words
    const stopwords = natural.stopwords;
    const filtered = tokens
      .filter((token) => token.length > 2 && !stopwords.includes(token))
      .map((token) => {
        // Use PorterStemmer correctly
        try {
          return natural.PorterStemmer.stem(token);
        } catch {
          return token;
        }
      });

    // Count frequency
    const frequency: { [key: string]: number } = {};
    const totalWords = filtered.length;
    
    filtered.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Calculate TF-IDF-like scores (TF * IDF approximation)
    // For single document, we use term frequency with length normalization
    const keywords: Array<{ word: string; score: number }> = [];
    
    for (const [word, count] of Object.entries(frequency)) {
      // Term Frequency (TF) - normalized by document length
      const tf = count / totalWords;
      
      // Simple IDF approximation (inverse document frequency)
      // For single document, we use word length as a proxy for specificity
      const idf = Math.log(1 + (word.length / 5)); // Longer words are often more specific
      
      // Combined score
      const score = tf * idf * count; // Multiply by count to favor frequent terms
      
      keywords.push({ word, score });
    }

    // Sort by score and return top keywords
    return keywords
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Extract hashtags from text
   */
  extractHashtags(text: string): string[] {
    if (!text) return [];
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex) || [];
    return matches.map((tag) => tag.toLowerCase());
  }

  /**
   * Extract mentions from text
   */
  extractMentions(text: string): string[] {
    if (!text) return [];
    const mentionRegex = /@[\w]+/g;
    const matches = text.match(mentionRegex) || [];
    return matches.map((mention) => mention.toLowerCase());
  }

  /**
   * Calculate text similarity between two texts
   */
  calculateSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;

    const tokens1 = this.tokenizer.tokenize(text1.toLowerCase()) || [];
    const tokens2 = this.tokenizer.tokenize(text2.toLowerCase()) || [];

    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    // Use Jaro-Winkler distance for similarity
    const distance = natural.JaroWinklerDistance(text1.toLowerCase(), text2.toLowerCase());
    return distance;
  }

  /**
   * Detect language of text (basic detection)
   */
  detectLanguage(text: string): string {
    if (!text || text.trim().length === 0) {
      return 'unknown';
    }

    // Basic language detection based on character patterns
    // This is a simplified version - for production, use a proper library
    const englishPattern = /^[a-zA-Z0-9\s.,!?;:'"()-]+$/;
    
    if (englishPattern.test(text)) {
      return 'en';
    }
    
    // Add more language patterns as needed
    return 'unknown';
  }

  /**
   * Summarize text (extract key sentences)
   */
  summarizeText(text: string, sentenceCount: number = 3): string {
    if (!text || text.trim().length === 0) {
      return '';
    }

    // Simple sentence splitting (split on periods, exclamation, question marks)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= sentenceCount) {
      return text;
    }

    // Simple summarization: return first N sentences
    // For better results, use TF-IDF or other advanced techniques
    return sentences.slice(0, sentenceCount).join('. ') + '.';
  }

  /**
   * Analyze content type based on text
   */
  analyzeContentType(text: string): {
    type: 'question' | 'statement' | 'call_to_action' | 'announcement' | 'other';
    confidence: number;
  } {
    if (!text) {
      return { type: 'other', confidence: 0 };
    }

    const lowerText = text.toLowerCase();
    let type: 'question' | 'statement' | 'call_to_action' | 'announcement' | 'other' = 'other';
    let confidence = 0.5;

    // Question detection
    if (lowerText.includes('?') || lowerText.match(/^(what|when|where|who|why|how|is|are|can|do|does|will)\s/i)) {
      type = 'question';
      confidence = 0.8;
    }
    // Call to action detection
    else if (lowerText.match(/(buy|shop|click|visit|sign up|subscribe|download|learn more|get started)/i)) {
      type = 'call_to_action';
      confidence = 0.75;
    }
    // Announcement detection
    else if (lowerText.match(/(announcing|introducing|new|launch|release|coming soon)/i)) {
      type = 'announcement';
      confidence = 0.7;
    }
    // Default to statement
    else {
      type = 'statement';
      confidence = 0.6;
    }

    return { type, confidence };
  }

  /**
   * Generate content suggestions based on successful posts
   */
  generateContentSuggestions(successfulPosts: Array<{ content: string; engagement_rate: number }>): {
    suggestedTopics: string[];
    suggestedHashtags: string[];
    suggestedTone: 'positive' | 'neutral' | 'professional' | 'casual';
    avgSentiment: number;
  } {
    if (successfulPosts.length === 0) {
      return {
        suggestedTopics: [],
        suggestedHashtags: [],
        suggestedTone: 'neutral',
        avgSentiment: 0,
      };
    }

    // Extract keywords from top posts
    const allKeywords: string[] = [];
    const allHashtags: string[] = [];
    let totalSentiment = 0;

    successfulPosts.forEach((post) => {
      const keywords = this.extractKeywords(post.content, 5);
      allKeywords.push(...keywords.map(k => k.word));
      
      const hashtags = this.extractHashtags(post.content);
      allHashtags.push(...hashtags);

      const sentiment = this.analyzeSentiment(post.content);
      totalSentiment += sentiment.comparative;
    });

    // Get most common keywords
    const keywordFrequency: { [key: string]: number } = {};
    allKeywords.forEach((keyword) => {
      keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
    });

    const suggestedTopics = Object.entries(keywordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);

    // Get most common hashtags
    const hashtagFrequency: { [key: string]: number } = {};
    allHashtags.forEach((hashtag) => {
      hashtagFrequency[hashtag] = (hashtagFrequency[hashtag] || 0) + 1;
    });

    const suggestedHashtags = Object.entries(hashtagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([hashtag]) => hashtag);

    // Determine suggested tone based on average sentiment
    const avgSentiment = totalSentiment / successfulPosts.length;
    let suggestedTone: 'positive' | 'neutral' | 'professional' | 'casual' = 'neutral';
    
    if (avgSentiment > 0.3) {
      suggestedTone = 'positive';
    } else if (avgSentiment < -0.1) {
      suggestedTone = 'professional';
    }

    return {
      suggestedTopics,
      suggestedHashtags,
      suggestedTone,
      avgSentiment,
    };
  }
}

export const nlpService = new NLPService();

