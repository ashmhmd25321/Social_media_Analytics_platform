'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Hash, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface HashtagSuggestionsProps {
  content: string;
  accountId?: number;
  onHashtagAdd: (hashtag: string) => void;
  selectedHashtags: string[];
}

export default function HashtagSuggestions({
  content,
  accountId,
  onHashtagAdd,
  selectedHashtags,
}: HashtagSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!content || content.length < 10) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({ text: content });
        if (accountId) {
          params.append('accountId', accountId.toString());
        }
        
        const response = await api.get<{ data: { hashtags: string[] } }>(
          `/content/hashtags/suggest?${params.toString()}`
        );
        
        if (response.success && response.data) {
          // Filter out already selected hashtags
          const filtered = response.data.hashtags.filter(
            tag => !selectedHashtags.includes(tag)
          );
          setSuggestions(filtered.slice(0, 10)); // Show top 10
        }
      } catch (error) {
        console.error('Error fetching hashtag suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce API calls
    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [content, accountId, selectedHashtags]);

  if (suggestions.length === 0 && !loading) {
    return null;
  }

  return (
    <motion.div
      className="mt-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Hash className="w-4 h-4 text-primary-300" />
        <span className="text-sm font-medium text-white/90">Suggested Hashtags</span>
        {loading && <span className="text-xs text-white/60">Loading...</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((hashtag, index) => (
          <button
            key={index}
            onClick={() => onHashtagAdd(hashtag)}
            className="inline-flex items-center gap-1 px-3 py-1 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 rounded-full text-sm transition-colors"
          >
            {hashtag}
            <span className="text-primary-400">+</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

