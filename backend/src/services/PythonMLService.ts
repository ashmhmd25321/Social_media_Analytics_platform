/**
 * Python ML/NLP Service Integration
 * Communicates with Python Flask service for advanced ML/NLP tasks
 */
import axios, { AxiosInstance } from 'axios';
import http from 'http';
import https from 'https';

// Use 127.0.0.1 instead of localhost to avoid IPv6 (::1) connection issues
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:5000';

// Create HTTP agent that forces IPv4
const httpAgent = new http.Agent({
  family: 4, // Force IPv4
  keepAlive: true,
});

const httpsAgent = new https.Agent({
  family: 4, // Force IPv4
  keepAlive: true,
});

// Log the Python service URL on initialization for debugging
console.log(`[PythonMLService] Connecting to Python service at: ${PYTHON_SERVICE_URL}`);

interface PythonServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class PythonMLService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: PYTHON_SERVICE_URL,
      timeout: 30000, // 30 seconds timeout for ML operations
      headers: {
        'Content-Type': 'application/json',
      },
      // Force IPv4 by using custom HTTP agents
      httpAgent: httpAgent,
      httpsAgent: httpsAgent,
    });
    
    // Log connection details on initialization
    console.log(`[PythonMLService] Initialized with baseURL: ${PYTHON_SERVICE_URL}`);
    
    // Test connection on startup (non-blocking, don't wait for it)
    setTimeout(() => {
      this.testConnection();
    }, 2000); // Wait 2 seconds for Python service to be ready
  }
  
  /**
   * Test connection to Python service
   */
  private async testConnection(): Promise<void> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      console.log(`[PythonMLService] ✓ Python service is reachable at ${PYTHON_SERVICE_URL}`);
    } catch (error: any) {
      console.warn(`[PythonMLService] ⚠ Python service health check failed (this is OK if Python service starts after backend)`);
      console.warn(`[PythonMLService] Error: ${error.code || error.message}`);
      console.warn(`[PythonMLService] Will retry on first actual request...`);
    }
  }

  /**
   * Check if Python service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error: any) {
      console.warn('Python service health check failed:', error.message || error);
      return false;
    }
  }

  // =====================================================
  // Advanced NLP Methods
  // =====================================================

  /**
   * Perform topic modeling on texts
   */
  async analyzeTopics(
    texts: string[],
    numTopics: number = 5,
    numWords: number = 10
  ): Promise<PythonServiceResponse<any>> {
    try {
      const response = await this.client.post('/api/nlp/topic-modeling', {
        texts,
        num_topics: numTopics,
        num_words: numWords,
      });
      return response.data;
    } catch (error: any) {
      console.error('Topic modeling error:', error);
      return {
        success: false,
        error: error.message || 'Topic modeling failed',
      };
    }
  }

  /**
   * Extract named entities from text
   */
  async extractEntities(text: string): Promise<PythonServiceResponse<any>> {
    try {
      const response = await this.client.post('/api/nlp/entity-recognition', {
        text,
      });
      return response.data;
    } catch (error: any) {
      console.error('Entity recognition error:', error);
      return {
        success: false,
        error: error.message || 'Entity recognition failed',
      };
    }
  }

  /**
   * Advanced sentiment analysis with optional context
   */
  async advancedSentimentAnalysis(
    text: string,
    context?: { platform?: string; post_type?: string; [key: string]: any }
  ): Promise<PythonServiceResponse<any>> {
    try {
      console.log(`[PythonMLService] Sending sentiment analysis request to: ${PYTHON_SERVICE_URL}/api/nlp/advanced-sentiment`);
      
      const response = await this.client.post('/api/nlp/advanced-sentiment', {
        text,
        context: context || {},
      }, {
        timeout: 30000, // 30 seconds timeout
      });
      
      console.log(`[PythonMLService] ✓ Sentiment analysis response received:`, response.status);
      return response.data;
    } catch (error: any) {
      // Check if it's a connection error (service not running)
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message?.includes('connect') || error.message?.includes('ECONNREFUSED')) {
        console.error('[PythonMLService] Connection error - Python service not accessible:', {
          code: error.code,
          message: error.message,
          url: `${PYTHON_SERVICE_URL}/api/nlp/advanced-sentiment`,
          stack: error.stack,
        });
        return {
          success: false,
          error: 'Python service is not available. Please start the Python service for advanced ML-based sentiment analysis.',
        };
      }
      
      // Check if it's an HTTP error (service running but endpoint failed)
      if (error.response) {
        console.error('[PythonMLService] HTTP error from Python service:', {
          status: error.response.status,
          data: error.response.data,
          url: `${PYTHON_SERVICE_URL}/api/nlp/advanced-sentiment`,
        });
        return {
          success: false,
          error: error.response.data?.error || error.message || 'Sentiment analysis failed',
        };
      }
      
      console.error('[PythonMLService] Advanced sentiment analysis error:', error);
      console.error('[PythonMLService] Error details:', {
        code: error.code,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: `${PYTHON_SERVICE_URL}/api/nlp/advanced-sentiment`,
      });
      return {
        success: false,
        error: error.message || 'Sentiment analysis failed',
      };
    }
  }

  /**
   * Classify text into categories
   */
  async classifyText(text: string): Promise<PythonServiceResponse<any>> {
    try {
      const response = await this.client.post('/api/nlp/text-classification', {
        text,
      });
      return response.data;
    } catch (error: any) {
      console.error('Text classification error:', error);
      return {
        success: false,
        error: error.message || 'Text classification failed',
      };
    }
  }

  // =====================================================
  // Network Analysis Methods
  // =====================================================

  /**
   * Build hashtag co-occurrence network
   */
  async buildHashtagNetwork(posts: any[]): Promise<PythonServiceResponse<any>> {
    try {
      const response = await this.client.post('/api/network/hashtag-network', {
        posts,
      });
      return response.data;
    } catch (error: any) {
      console.error('Hashtag network error:', error);
      return {
        success: false,
        error: error.message || 'Network analysis failed',
      };
    }
  }

  /**
   * Build mention network
   */
  async buildMentionNetwork(posts: any[]): Promise<PythonServiceResponse<any>> {
    try {
      const response = await this.client.post('/api/network/mention-network', {
        posts,
      });
      return response.data;
    } catch (error: any) {
      console.error('Mention network error:', error);
      return {
        success: false,
        error: error.message || 'Mention network failed',
      };
    }
  }

  /**
   * Detect communities in network
   */
  async detectCommunities(networkData: any): Promise<PythonServiceResponse<any>> {
    try {
      const response = await this.client.post('/api/network/community-detection', {
        network: networkData,
      });
      return response.data;
    } catch (error: any) {
      console.error('Community detection error:', error);
      return {
        success: false,
        error: error.message || 'Community detection failed',
      };
    }
  }

  /**
   * Analyze influence in network
   */
  async analyzeInfluence(networkData: any): Promise<PythonServiceResponse<any>> {
    try {
      const response = await this.client.post('/api/network/influence-analysis', {
        network: networkData,
      });
      return response.data;
    } catch (error: any) {
      console.error('Influence analysis error:', error);
      return {
        success: false,
        error: error.message || 'Influence analysis failed',
      };
    }
  }

  // =====================================================
  // Predictive Modeling Methods
  // =====================================================

  /**
   * Predict engagement for a post
   */
  async predictEngagement(postFeatures: any): Promise<PythonServiceResponse<any>> {
    try {
      const response = await this.client.post('/api/predictive/engagement-prediction', {
        features: postFeatures,
      });
      return response.data;
    } catch (error: any) {
      console.error('Engagement prediction error:', error);
      return {
        success: false,
        error: error.message || 'Engagement prediction failed',
      };
    }
  }

  /**
   * Predict best posting time
   */
  async predictBestPostingTime(historicalData: any[]): Promise<PythonServiceResponse<any>> {
    try {
      const response = await this.client.post('/api/predictive/best-posting-time', {
        historical_data: historicalData,
      });
      return response.data;
    } catch (error: any) {
      console.error('Best posting time prediction error:', error);
      return {
        success: false,
        error: error.message || 'Posting time prediction failed',
      };
    }
  }

  /**
   * Forecast trends
   */
  async forecastTrends(
    timeSeries: any[],
    forecastPeriods: number = 7
  ): Promise<PythonServiceResponse<any>> {
    try {
      const response = await this.client.post('/api/predictive/trend-forecast', {
        time_series: timeSeries,
        forecast_periods: forecastPeriods,
      });
      return response.data;
    } catch (error: any) {
      console.error('Trend forecast error:', error);
      return {
        success: false,
        error: error.message || 'Trend forecast failed',
      };
    }
  }

  // =====================================================
  // Statistics Methods
  // =====================================================

  /**
   * Calculate descriptive statistics
   */
  async calculateDescriptiveStats(values: number[]): Promise<PythonServiceResponse<any>> {
    try {
      const response = await this.client.post('/api/statistics/descriptive', {
        values,
      });
      return response.data;
    } catch (error: any) {
      console.error('Descriptive statistics error:', error);
      return {
        success: false,
        error: error.message || 'Statistics calculation failed',
      };
    }
  }

  /**
   * Calculate correlation between variables
   */
  async calculateCorrelation(variables: Record<string, number[]>): Promise<PythonServiceResponse<any>> {
    try {
      const response = await this.client.post('/api/statistics/correlation', {
        variables,
      });
      return response.data;
    } catch (error: any) {
      console.error('Correlation analysis error:', error);
      return {
        success: false,
        error: error.message || 'Correlation analysis failed',
      };
    }
  }

  /**
   * Perform time series analysis
   */
  async analyzeTimeSeries(timeSeries: any[]): Promise<PythonServiceResponse<any>> {
    try {
      const response = await this.client.post('/api/statistics/time-series', {
        time_series: timeSeries,
      });
      return response.data;
    } catch (error: any) {
      console.error('Time series analysis error:', error);
      return {
        success: false,
        error: error.message || 'Time series analysis failed',
      };
    }
  }

  /**
   * Analyze distribution
   */
  async analyzeDistribution(values: number[]): Promise<PythonServiceResponse<any>> {
    try {
      const response = await this.client.post('/api/statistics/distribution', {
        values,
      });
      return response.data;
    } catch (error: any) {
      console.error('Distribution analysis error:', error);
      return {
        success: false,
        error: error.message || 'Distribution analysis failed',
      };
    }
  }
}

export const pythonMLService = new PythonMLService();

