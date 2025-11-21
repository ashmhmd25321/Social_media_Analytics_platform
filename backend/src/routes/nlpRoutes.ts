import { Router } from 'express';
import { nlpController } from '../controllers/nlpController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate); // Apply authentication middleware to all NLP routes

router.post('/sentiment/analyze', nlpController.analyzeSentiment);
router.get('/sentiment/post/:postId', nlpController.analyzePostSentiment);
router.post('/keywords/extract', nlpController.extractKeywords);
router.get('/recommendations', nlpController.getRecommendations);
router.get('/sentiment/trends', nlpController.getSentimentTrends);

export default router;

