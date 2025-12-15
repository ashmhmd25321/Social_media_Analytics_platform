"""
Advanced Statistics Service using Pandas and NumPy
Implements descriptive statistics, correlation analysis, time series analysis, and distribution analysis
"""
import pandas as pd
import numpy as np
from scipy import stats
from typing import Dict, List, Any

class StatisticsService:
    def __init__(self):
        """Initialize statistics service"""
        pass
    
    def calculate_descriptive_stats(self, values: List[float]) -> Dict[str, Any]:
        """
        Calculate comprehensive descriptive statistics
        Args:
            values: List of numeric values
        Returns:
            {
                'mean': float,
                'median': float,
                'mode': float,
                'std_dev': float,
                'variance': float,
                'min': float,
                'max': float,
                'range': float,
                'quartiles': {},
                'skewness': float,
                'kurtosis': float
            }
        """
        if not values or len(values) == 0:
            return {
                'error': 'No values provided'
            }
        
        arr = np.array(values)
        
        # Basic statistics
        mean = float(np.mean(arr))
        median = float(np.median(arr))
        std_dev = float(np.std(arr))
        variance = float(np.var(arr))
        min_val = float(np.min(arr))
        max_val = float(np.max(arr))
        range_val = max_val - min_val
        
        # Mode (most common value)
        try:
            mode_result = stats.mode(arr, keepdims=True)
            mode = float(mode_result.mode[0])
        except:
            mode = median
        
        # Quartiles
        q1 = float(np.percentile(arr, 25))
        q2 = float(median)
        q3 = float(np.percentile(arr, 75))
        iqr = q3 - q1
        
        # Skewness and Kurtosis
        skewness = float(stats.skew(arr))
        kurtosis = float(stats.kurtosis(arr))
        
        return {
            'mean': mean,
            'median': median,
            'mode': mode,
            'std_dev': std_dev,
            'variance': variance,
            'min': min_val,
            'max': max_val,
            'range': range_val,
            'quartiles': {
                'q1': q1,
                'q2': q2,
                'q3': q3,
                'iqr': iqr
            },
            'skewness': skewness,
            'kurtosis': kurtosis,
            'count': len(values)
        }
    
    def calculate_correlation(self, variables: Dict[str, List[float]]) -> Dict[str, Any]:
        """
        Calculate correlation between variables
        Args:
            variables: {
                'var1': [values],
                'var2': [values],
                ...
            }
        Returns:
            {
                'correlation_matrix': {},
                'correlations': []
            }
        """
        if not variables or len(variables) < 2:
            return {
                'error': 'At least two variables required'
            }
        
        # Convert to DataFrame
        df = pd.DataFrame(variables)
        
        # Calculate correlation matrix
        corr_matrix = df.corr()
        
        # Get pairwise correlations
        correlations = []
        var_names = list(variables.keys())
        
        for i, var1 in enumerate(var_names):
            for var2 in var_names[i+1:]:
                corr_value = corr_matrix.loc[var1, var2]
                correlations.append({
                    'variable1': var1,
                    'variable2': var2,
                    'correlation': float(corr_value),
                    'strength': self._correlation_strength(abs(corr_value))
                })
        
        # Sort by absolute correlation
        correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
        
        return {
            'correlation_matrix': corr_matrix.to_dict(),
            'correlations': correlations
        }
    
    def _correlation_strength(self, abs_corr: float) -> str:
        """Determine correlation strength"""
        if abs_corr >= 0.7:
            return 'strong'
        elif abs_corr >= 0.4:
            return 'moderate'
        elif abs_corr >= 0.2:
            return 'weak'
        else:
            return 'very_weak'
    
    def analyze_time_series(self, time_series: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Perform time series analysis
        Args:
            time_series: List of {'date': str, 'value': float}
        Returns:
            {
                'trend': {},
                'seasonality': {},
                'autocorrelation': float,
                'volatility': float
            }
        """
        if not time_series or len(time_series) < 3:
            return {
                'error': 'Insufficient data for time series analysis'
            }
        
        df = pd.DataFrame(time_series)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        df.set_index('date', inplace=True)
        
        values = df['value'].values
        
        # Trend analysis (linear regression)
        X = np.arange(len(values))
        slope, intercept, r_value, p_value, std_err = stats.linregress(X, values)
        
        trend = {
            'slope': float(slope),
            'intercept': float(intercept),
            'direction': 'increasing' if slope > 0 else 'decreasing' if slope < 0 else 'stable',
            'r_squared': float(r_value ** 2),
            'p_value': float(p_value)
        }
        
        # Calculate volatility (standard deviation of returns)
        returns = np.diff(values) / values[:-1]
        volatility = float(np.std(returns))
        
        # Simple autocorrelation (lag 1)
        if len(values) > 1:
            autocorr = float(np.corrcoef(values[:-1], values[1:])[0, 1])
        else:
            autocorr = 0.0
        
        # Simple seasonality detection (if daily data, check day of week pattern)
        if len(time_series) > 7:
            df['day_of_week'] = df.index.dayofweek
            daily_avg = df.groupby('day_of_week')['value'].mean()
            seasonality = {
                'has_seasonality': float(daily_avg.std() / daily_avg.mean()) > 0.1,
                'daily_pattern': {int(k): float(v) for k, v in daily_avg.to_dict().items()}
            }
        else:
            seasonality = {
                'has_seasonality': False
            }
        
        return {
            'trend': trend,
            'seasonality': seasonality,
            'autocorrelation': autocorr,
            'volatility': volatility,
            'mean': float(np.mean(values)),
            'std_dev': float(np.std(values))
        }
    
    def analyze_distribution(self, values: List[float]) -> Dict[str, Any]:
        """
        Analyze distribution of data
        Args:
            values: List of numeric values
        Returns:
            {
                'distribution_type': str,
                'normality_test': {},
                'percentiles': {}
            }
        """
        if not values or len(values) < 3:
            return {
                'error': 'Insufficient data for distribution analysis'
            }
        
        arr = np.array(values)
        
        # Normality test (Shapiro-Wilk for small samples, otherwise Kolmogorov-Smirnov)
        if len(arr) <= 5000:
            stat, p_value = stats.shapiro(arr)
            test_name = 'shapiro_wilk'
        else:
            stat, p_value = stats.kstest(arr, 'norm', args=(np.mean(arr), np.std(arr)))
            test_name = 'kolmogorov_smirnov'
        
        is_normal = p_value > 0.05
        
        # Percentiles
        percentiles = {
            'p5': float(np.percentile(arr, 5)),
            'p10': float(np.percentile(arr, 10)),
            'p25': float(np.percentile(arr, 25)),
            'p50': float(np.percentile(arr, 50)),
            'p75': float(np.percentile(arr, 75)),
            'p90': float(np.percentile(arr, 90)),
            'p95': float(np.percentile(arr, 95))
        }
        
        # Determine distribution type based on skewness
        skewness = stats.skew(arr)
        if abs(skewness) < 0.5 and is_normal:
            dist_type = 'normal'
        elif skewness > 0.5:
            dist_type = 'right_skewed'
        elif skewness < -0.5:
            dist_type = 'left_skewed'
        else:
            dist_type = 'approximately_normal'
        
        return {
            'distribution_type': dist_type,
            'normality_test': {
                'test': test_name,
                'statistic': float(stat),
                'p_value': float(p_value),
                'is_normal': is_normal
            },
            'percentiles': percentiles,
            'skewness': float(skewness),
            'kurtosis': float(stats.kurtosis(arr))
        }

