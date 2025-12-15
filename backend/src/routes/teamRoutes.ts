import { Router } from 'express';
import { teamController } from '../controllers/teamController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', (req, res) => teamController.createTeam(req, res));
router.get('/', (req, res) => teamController.getTeams(req, res));
router.get('/:id', (req, res) => teamController.getTeam(req, res));
router.post('/:id/invite', (req, res) => teamController.inviteUser(req, res));
router.post('/invitations/accept', (req, res) => teamController.acceptInvitation(req, res));
router.get('/:id/approvals', (req, res) => teamController.getApprovals(req, res));
router.post('/approvals/:id/approve', (req, res) => teamController.approveContent(req, res));
router.get('/:id/activity', (req, res) => teamController.getActivity(req, res));

export default router;

