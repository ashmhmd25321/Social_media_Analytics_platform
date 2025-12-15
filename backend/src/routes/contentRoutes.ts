import { Router } from 'express';
import { contentController } from '../controllers/contentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All content routes require authentication
router.use(authenticate);

// Draft routes
router.post('/drafts', (req, res) => contentController.createDraft(req, res));
router.get('/drafts', (req, res) => contentController.getDrafts(req, res));
router.get('/drafts/:id', (req, res) => contentController.getDraft(req, res));
router.put('/drafts/:id', (req, res) => contentController.updateDraft(req, res));
router.delete('/drafts/:id', (req, res) => contentController.deleteDraft(req, res));

// Scheduled posts routes
router.post('/schedule', (req, res) => contentController.schedulePost(req, res));
router.get('/scheduled', (req, res) => contentController.getScheduledPosts(req, res));
router.delete('/scheduled/:id', (req, res) => contentController.cancelScheduledPost(req, res));

// Template routes
router.get('/templates', (req, res) => contentController.getTemplates(req, res));
router.post('/templates', (req, res) => contentController.createTemplate(req, res));
router.delete('/templates/:id', (req, res) => contentController.deleteTemplate(req, res));

// Content suggestions routes
router.get('/hashtags/suggest', (req, res) => contentController.getHashtagSuggestions(req, res));
router.get('/posting-time/suggest', (req, res) => contentController.getOptimalPostingTime(req, res));

export default router;

