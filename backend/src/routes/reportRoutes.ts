import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', (req, res) => reportController.createReport(req, res));
router.get('/', (req, res) => reportController.getReports(req, res));
router.get('/templates', (req, res) => reportController.getTemplates(req, res));
router.post('/templates', (req, res) => reportController.createTemplate(req, res));
router.post('/scheduled', (req, res) => reportController.createScheduledReport(req, res));
router.get('/scheduled', (req, res) => reportController.getScheduledReports(req, res));
router.put('/scheduled/:id', (req, res) => reportController.updateScheduledReport(req, res));
router.delete('/scheduled/:id', (req, res) => reportController.deleteScheduledReport(req, res));
router.get('/:id', (req, res) => reportController.getReport(req, res));
router.get('/:id/preview', (req, res) => reportController.previewReport(req, res));
router.post('/:id/generate', (req, res) => reportController.generateReport(req, res));
router.delete('/:id', (req, res) => reportController.deleteReport(req, res));

export default router;

