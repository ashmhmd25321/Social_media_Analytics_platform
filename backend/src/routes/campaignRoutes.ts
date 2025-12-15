import { Router } from 'express';
import { campaignController } from '../controllers/campaignController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', (req, res) => campaignController.createCampaign(req, res));
router.get('/', (req, res) => campaignController.getCampaigns(req, res));
router.get('/:id', (req, res) => campaignController.getCampaign(req, res));
router.put('/:id', (req, res) => campaignController.updateCampaign(req, res));
router.post('/:id/ab-test', (req, res) => campaignController.createABTest(req, res));
router.get('/:id/ab-test', (req, res) => campaignController.getABTestResults(req, res));
router.post('/:id/posts', (req, res) => campaignController.addPost(req, res));

export default router;

