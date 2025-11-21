import { Router } from 'express';
import { insightsController } from '../controllers/insightsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => insightsController.getInsights(req, res));
router.post('/generate', (req, res) => insightsController.generateInsights(req, res));
router.post('/:id/dismiss', (req, res) => insightsController.dismissInsight(req, res));

export default router;

