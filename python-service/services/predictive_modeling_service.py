"""
Predictive Modeling Service using scikit-learn
Implements engagement prediction, best posting time prediction, and trend forecasting
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Any
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class PredictiveModelingService:
    def __init__(self):
        """Initialize predictive modeling service"""
        self.engagement_model = None
        self.posting_time_model = None
        self.scaler = StandardScaler()
    
    def _prepare_engagement_features(self, post_features: Dict[str, Any]) -> np.ndarray:
        """Prepare features for engagement prediction"""
        features = []
        
        # Extract features
        hour = post_features.get('hour', 12)
        day_of_week = post_features.get('day_of_week', 3)  # 0=Monday, 6=Sunday
        has_hashtags = 1 if post_features.get('hashtags_count', 0) > 0 else 0
        hashtags_count = post_features.get('hashtags_count', 0)
        has_media = 1 if post_features.get('has_media', False) else 0
        content_length = post_features.get('content_length', 0)
        follower_count = post_features.get('follower_count', 1000)
        
        # Sentiment score if available
        sentiment_score = post_features.get('sentiment_score', 0.0)
        
        features = [
            hour / 24.0,  # Normalize hour
            day_of_week / 6.0,  # Normalize day
            has_hashtags,
            min(hashtags_count / 30.0, 1.0),  # Normalize hashtag count
            has_media,
            min(content_length / 500.0, 1.0),  # Normalize content length
            min(follower_count / 100000.0, 1.0),  # Normalize follower count
            (sentiment_score + 1) / 2.0  # Normalize sentiment (-1 to 1 -> 0 to 1)
        ]
        
        return np.array(features).reshape(1, -1)
    
    def predict_engagement(self, post_features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict engagement for a post
        Args:
            post_features: {
                'hour': int (0-23),
                'day_of_week': int (0-6),
                'hashtags_count': int,
                'has_media': bool,
                'content_length': int,
                'follower_count': int,
                'sentiment_score': float (-1 to 1),
                'historical_data': [] (optional, for training)
            }
        Returns:
            {
                'predicted_engagement': float,
                'confidence': float,
                'factors': {}
            }
        """
        # If historical data provided, train a model
        if 'historical_data' in post_features and post_features['historical_data']:
            historical_data = post_features['historical_data']
            # Train model (simplified - in production, save/load model)
            X_train = []
            y_train = []
            
            for item in historical_data:
                features = self._prepare_engagement_features(item)
                X_train.append(features[0])
                y_train.append(item.get('actual_engagement', 0))
            
            if len(X_train) > 10:  # Need minimum data
                X_train = np.array(X_train)
                y_train = np.array(y_train)
                
                # Train model
                self.engagement_model = RandomForestRegressor(n_estimators=100, random_state=42)
                self.engagement_model.fit(X_train, y_train)
        
        # Prepare features for prediction
        features = self._prepare_engagement_features(post_features)
        
        # If no model trained, use simple heuristic
        if self.engagement_model is None:
            # Simple heuristic-based prediction
            base_engagement = 100
            hour_factor = 1.0
            day_factor = 1.0
            
            # Best posting hours (9-12, 17-20)
            hour = post_features.get('hour', 12)
            if 9 <= hour <= 12 or 17 <= hour <= 20:
                hour_factor = 1.5
            elif 13 <= hour <= 16:
                hour_factor = 0.8
            
            # Best posting days (Tuesday-Thursday)
            day = post_features.get('day_of_week', 3)
            if 1 <= day <= 3:
                day_factor = 1.3
            elif day == 0 or day == 4:
                day_factor = 1.1
            
            predicted = base_engagement * hour_factor * day_factor
            predicted *= (1 + post_features.get('sentiment_score', 0) * 0.2)
            predicted *= (1 + min(post_features.get('hashtags_count', 0) / 10, 0.5))
            
            if post_features.get('has_media', False):
                predicted *= 1.5
            
            confidence = 0.6
        else:
            # Use trained model
            predicted = self.engagement_model.predict(features)[0]
            
            # Calculate confidence (simpler version)
            if hasattr(self.engagement_model, 'feature_importances_'):
                confidence = 0.8
            else:
                confidence = 0.7
        
        # Analyze factors
        factors = {
            'hour_impact': 'positive' if post_features.get('hour', 12) in [9, 10, 11, 17, 18, 19] else 'neutral',
            'day_impact': 'positive' if 1 <= post_features.get('day_of_week', 3) <= 3 else 'neutral',
            'media_impact': 'positive' if post_features.get('has_media', False) else 'neutral',
            'hashtag_impact': 'positive' if post_features.get('hashtags_count', 0) > 0 else 'neutral'
        }
        
        return {
            'predicted_engagement': float(max(predicted, 0)),
            'confidence': float(confidence),
            'factors': factors
        }
    
    def predict_best_posting_time(self, historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Predict best time to post based on historical data
        Args:
            historical_data: List of {
                'hour': int,
                'day_of_week': int,
                'engagement': float
            }
        Returns:
            {
                'best_hours': [int],
                'best_days': [int],
                'recommendations': []
            }
        """
        if not historical_data or len(historical_data) < 5:
            # Default recommendations
            return {
                'best_hours': [9, 10, 11, 17, 18, 19],
                'best_days': [1, 2, 3],  # Tuesday, Wednesday, Thursday
                'recommendations': [
                    'Post between 9 AM - 12 PM for morning engagement',
                    'Post between 5 PM - 8 PM for evening engagement',
                    'Tuesday through Thursday typically perform best'
                ]
            }
        
        df = pd.DataFrame(historical_data)
        
        # Group by hour and calculate average engagement
        hourly_engagement = df.groupby('hour')['engagement'].mean().sort_values(ascending=False)
        best_hours = hourly_engagement.head(6).index.tolist()
        
        # Group by day and calculate average engagement
        daily_engagement = df.groupby('day_of_week')['engagement'].mean().sort_values(ascending=False)
        best_days = daily_engagement.head(3).index.tolist()
        
        recommendations = []
        if best_hours:
            recommendations.append(f"Best posting hours: {', '.join(map(str, sorted(best_hours)))}")
        if best_days:
            day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            best_day_names = [day_names[d] for d in sorted(best_days)]
            recommendations.append(f"Best posting days: {', '.join(best_day_names)}")
        
        return {
            'best_hours': [int(h) for h in best_hours],
            'best_days': [int(d) for d in best_days],
            'recommendations': recommendations,
            'hourly_breakdown': {int(k): float(v) for k, v in hourly_engagement.to_dict().items()},
            'daily_breakdown': {int(k): float(v) for k, v in daily_engagement.to_dict().items()}
        }
    
    def forecast_trends(self, time_series: List[Dict[str, Any]], forecast_periods: int = 7) -> Dict[str, Any]:
        """
        Forecast trends using time series analysis
        Args:
            time_series: List of {'date': str, 'value': float}
            forecast_periods: Number of periods to forecast
        Returns:
            {
                'forecast': [{'date': str, 'value': float, 'confidence_lower': float, 'confidence_upper': float}],
                'trend': str,
                'trend_strength': float
            }
        """
        if not time_series or len(time_series) < 3:
            return {
                'forecast': [],
                'trend': 'insufficient_data',
                'trend_strength': 0.0
            }
        
        # Convert to DataFrame
        df = pd.DataFrame(time_series)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        df.set_index('date', inplace=True)
        
        values = df['value'].values
        
        # Simple linear regression for trend
        X = np.arange(len(values)).reshape(-1, 1)
        y = values
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Calculate trend
        slope = model.coef_[0]
        trend = 'increasing' if slope > 0 else 'decreasing' if slope < 0 else 'stable'
        trend_strength = abs(slope) / (np.std(values) + 1e-10)
        trend_strength = min(trend_strength, 1.0)
        
        # Forecast future values
        last_date = df.index[-1]
        forecast = []
        
        for i in range(1, forecast_periods + 1):
            future_index = len(values) + i - 1
            predicted_value = model.predict([[future_index]])[0]
            
            # Simple confidence interval (using std of residuals)
            residuals = y - model.predict(X)
            std_error = np.std(residuals)
            confidence_range = 1.96 * std_error  # 95% confidence
            
            future_date = last_date + timedelta(days=i)
            forecast.append({
                'date': future_date.strftime('%Y-%m-%d'),
                'value': float(predicted_value),
                'confidence_lower': float(max(predicted_value - confidence_range, 0)),
                'confidence_upper': float(predicted_value + confidence_range)
            })
        
        return {
            'forecast': forecast,
            'trend': trend,
            'trend_strength': float(trend_strength),
            'slope': float(slope)
        }

