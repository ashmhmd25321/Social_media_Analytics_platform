'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Hash,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
} from 'lucide-react';

interface SentimentResult {
  score: number;
  comparative: number;
  label?: 'positive' | 'neutral' | 'negative';
  classification?: 'positive' | 'neutral' | 'negative';
  emotion?: string;
  emotionConfidence?: number;
  recommendations?: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    actions: string[];
    urgency: string;
  }>;
  recommendationCount?: number;
  modelsUsed?: string[];
  features?: any;
  modelResults?: any;
}

interface KeywordResult {
  word: string;
  score: number;
}

interface Recommendation {
  id?: number;
  recommendation_type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  action_url?: string;
  related_data?: any;
  confidence_score?: number;
}

export default function NLPPage() {
  const [activeTab, setActiveTab] = useState<'sentiment' | 'keywords'>('sentiment');
  const [inputText, setInputText] = useState('');
  const [sentimentResult, setSentimentResult] = useState<SentimentResult | null>(null);
  const [keywordsResult, setKeywordsResult] = useState<KeywordResult[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const analyzeSentiment = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.post<{ data: SentimentResult }>('/nlp/sentiment/analyze', {
        text: inputText,
      });

      if (response.success && response.data) {
        // Map label to classification for backward compatibility
        const result = response.data;
        
        setSentimentResult({
          ...result,
          label: result.label || result.classification,
        });
        
        // If recommendations are included in sentiment result, show them
        if (result.recommendations && result.recommendations.length > 0) {
          // Convert sentiment recommendations to the Recommendation format
          const sentimentRecommendations: Recommendation[] = result.recommendations.map((rec: any, idx: number) => ({
            id: idx,
            recommendation_type: rec.type || 'sentiment',
            title: rec.title || 'Recommendation',
            description: rec.description || '',
            priority: rec.priority || 'medium',
            actionable: rec.actions && rec.actions.length > 0,
            related_data: {
              actions: rec.actions || [],
              urgency: rec.urgency || 'medium',
            },
            confidence_score: result.ensembleConfidence || result.emotionConfidence || 0.5,
          }));
          setRecommendations(sentimentRecommendations);
        }
      } else {
        setError(response.message || 'Failed to analyze sentiment');
      }
    } catch (err: any) {
      // Check if it's a service unavailable error
      if (err.response?.status === 503 || err.response?.data?.error === 'SERVICE_UNAVAILABLE') {
        setError('Python ML service is not available. Please start the Python service: cd python-service && python app.py');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to analyze sentiment');
      }
      console.error('Error analyzing sentiment:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractKeywords = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to extract keywords from');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.post<{ data: { keywords: KeywordResult[]; hashtags?: string[]; mentions?: string[] } }>('/nlp/keywords/extract', {
        text: inputText,
        limit: 10,
      });

      if (response.success && response.data) {
        // Handle both old format (array) and new format (object with keywords)
        if (Array.isArray(response.data)) {
          setKeywordsResult(response.data);
        } else if (response.data.keywords && Array.isArray(response.data.keywords)) {
          setKeywordsResult(response.data.keywords);
        } else {
          setError('Invalid response format from server');
        }
      } else {
        setError('Failed to extract keywords');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to extract keywords');
      console.error('Error extracting keywords:', err);
    } finally {
      setLoading(false);
    }
  };


  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive':
        return 'from-green-500 to-emerald-500';
      case 'negative':
        return 'from-red-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case 'positive':
        return CheckCircle;
      case 'negative':
        return XCircle;
      default:
        return TrendingUp;
    }
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojiMap: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprised: '😲',
      fearful: '😨',
      disgusted: '🤢',
      neutral: '😐',
    };
    return emojiMap[emotion] || '😐';
  };

  const getEmotionColor = (emotion: string) => {
    const colorMap: { [key: string]: string } = {
      happy: 'from-yellow-400 to-orange-400',
      sad: 'from-blue-400 to-indigo-400',
      angry: 'from-red-500 to-pink-500',
      surprised: 'from-purple-400 to-pink-400',
      fearful: 'from-gray-500 to-slate-500',
      disgusted: 'from-green-600 to-emerald-600',
      neutral: 'from-gray-400 to-gray-500',
    };
    return colorMap[emotion] || 'from-gray-400 to-gray-500';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleTexts = [
    "I love this product! It's amazing and works perfectly! 😍",
    "This is terrible. I'm very disappointed with the service.",
    "The weather is nice today. It's a regular day.",
    "Check out our new social media analytics platform! #analytics #socialmedia #marketing #data",
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-secondary-900/85 via-purple-900/80 to-primary-900/85">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-900/85 via-purple-900/80 to-primary-900/85"></div>
        </div>

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-20 right-20 w-72 h-72 bg-secondary-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            className="mb-8 text-white"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-400 to-primary-400 flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-heading font-bold">NLP & AI Features</h1>
            </div>
            <p className="text-white/80 ml-16">Analyze sentiment, extract keywords, and get AI-powered recommendations</p>
          </motion.div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 bg-white/10 backdrop-blur-xl rounded-xl p-1 border border-white/20">
            <button
              onClick={() => setActiveTab('sentiment')}
              className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'sentiment'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Sentiment Analysis
              </div>
            </button>
            <button
              onClick={() => setActiveTab('keywords')}
              className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'keywords'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Hash className="w-4 h-4" />
                Keyword Extraction
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Input Section */}
            {(
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <label className="block text-white font-semibold mb-3">
                  Enter text to analyze:
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    activeTab === 'sentiment'
                      ? "Enter text to analyze sentiment (e.g., 'I love this product!')"
                      : "Enter text to extract keywords (e.g., 'Check out our new social media analytics platform! #analytics #marketing')"
                  }
                  className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {sampleTexts.map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputText(sample)}
                        className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg transition-all border border-white/10"
                      >
                        Sample {idx + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setInputText('');
                      setSentimentResult(null);
                      setKeywordsResult([]);
                      setError(null);
                    }}
                    className="px-3 py-1 text-xs text-white/60 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </motion.div>
            )}

            {/* Action Button */}
            {(
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <button
                  onClick={activeTab === 'sentiment' ? analyzeSentiment : extractKeywords}
                  disabled={loading || !inputText.trim()}
                  className="w-full px-6 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : activeTab === 'sentiment' ? (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analyze Sentiment
                    </>
                  ) : (
                    <>
                      <Hash className="w-5 h-5" />
                      Extract Keywords
                    </>
                  )}
                </button>
              </motion.div>
            )}


            {/* Error Message */}
            {error && (
              <motion.div
                className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}

            {/* Results */}
            {activeTab === 'sentiment' && sentimentResult && (
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Sentiment Analysis Result</h3>
                  {sentimentResult.modelsUsed && sentimentResult.modelsUsed.length > 0 && (
                    <div className="text-xs text-white/60">
                      Models: {sentimentResult.modelsUsed.join(', ')}
                    </div>
                  )}
                </div>
                
                {/* Show recommendations if available from sentiment analysis */}
                {sentimentResult.recommendations && sentimentResult.recommendations.length > 0 && (
                  <div className="mb-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      AI Recommendations ({sentimentResult.recommendationCount || sentimentResult.recommendations.length})
                    </h4>
                    <div className="space-y-2">
                      {sentimentResult.recommendations.slice(0, 3).map((rec, idx) => (
                        <div key={idx} className="text-sm text-white/80">
                          <span className="font-semibold text-primary-300">{rec.title}:</span> {rec.description}
                          {rec.actions && rec.actions.length > 0 && (
                            <ul className="ml-4 mt-1 list-disc text-white/60">
                              {rec.actions.slice(0, 2).map((action, aidx) => (
                                <li key={aidx}>{action}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className={`bg-gradient-to-br ${getSentimentColor(sentimentResult.label || sentimentResult.classification || 'neutral')} rounded-xl p-6 text-white`}>
                    <div className="flex items-center gap-3 mb-2">
                      {React.createElement(getSentimentIcon(sentimentResult.label || sentimentResult.classification || 'neutral'), { className: 'w-6 h-6' })}
                      <span className="text-lg font-semibold capitalize">{sentimentResult.label || sentimentResult.classification || 'neutral'}</span>
                    </div>
                    <p className="text-sm opacity-90">Sentiment</p>
                  </div>
                  {sentimentResult.emotion && (
                    <div className={`bg-gradient-to-br ${getEmotionColor(sentimentResult.emotion)} rounded-xl p-6 text-white`}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{getEmotionEmoji(sentimentResult.emotion)}</span>
                        <span className="text-lg font-semibold capitalize">{sentimentResult.emotion}</span>
                      </div>
                      <p className="text-sm opacity-90">
                        Emotion {sentimentResult.emotionConfidence && `(${(sentimentResult.emotionConfidence * 100).toFixed(0)}% confidence)`}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'keywords' && keywordsResult.length > 0 && (
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Extracted Keywords</h3>
                  <button
                    onClick={() => copyToClipboard(keywordsResult.map((k) => k.word).join(', '))}
                    className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {keywordsResult.map((keyword, idx) => (
                    <motion.div
                      key={idx}
                      className="bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-lg p-3 border border-white/10 hover:border-white/30 transition-all"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-semibold">#{keyword.word}</span>
                        <span className="text-xs text-white/60">{keyword.score.toFixed(2)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

