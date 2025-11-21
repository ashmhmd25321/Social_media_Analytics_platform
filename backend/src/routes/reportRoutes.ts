import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', (req, res) => reportController.createReport(req, res));
router.get('/', (req, res) => reportController.getReports(req, res));
router.get('/templates', (req, res) => reportController.getTemplates(req, res));
router.post('/templates', (req, res) => reportController.createTemplate(req, res));
router.get('/:id', (req, res) => reportController.getReport(req, res));
router.post('/:id/generate', (req, res) => reportController.generateReport(req, res));
router.delete('/:id', (req, res) => reportController.deleteReport(req, res));

export default router;

