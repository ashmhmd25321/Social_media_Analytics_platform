"""
Services package for Python ML/NLP Service
"""
from .nlp_service import NLPService
from .network_analysis_service import NetworkAnalysisService
from .predictive_modeling_service import PredictiveModelingService
from .statistics_service import StatisticsService
from .topic_modeling_service import TopicModelingService

# Initialize service instances
nlp_service = NLPService()
network_analysis_service = NetworkAnalysisService()
predictive_modeling_service = PredictiveModelingService()
statistics_service = StatisticsService()
topic_modeling_service = TopicModelingService()

