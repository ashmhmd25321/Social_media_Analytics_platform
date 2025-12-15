import { Request, Response } from 'express';
import { teamModel, teamMemberModel, teamInvitationModel, contentApprovalModel } from '../models/Team';
import { teamService } from '../services/TeamService';

export class TeamController {
  /**
   * Create a new team
   * POST /api/teams
   */
  async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const teamId = await teamService.createTeam(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: { id: teamId },
      });
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create team',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get user's teams
   * GET /api/teams
   */
  async getTeams(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const ownedTeams = await teamModel.findByOwner(userId);
      const memberTeams = await teamModel.findByMember(userId);
      
      res.json({
        success: true,
        data: {
          owned: ownedTeams,
          member: memberTeams,
        },
      });
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teams',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get team details
   * GET /api/teams/:id
   */
  async getTeam(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const team = await teamModel.findById(id);
      
      if (!team) {
        res.status(404).json({ success: false, message: 'Team not found' });
        return;
      }

      const members = await teamMemberModel.findByTeam(id);
      
      res.json({
        success: true,
        data: {
          team,
          members,
        },
      });
    } catch (error) {
      console.error('Error fetching team:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Invite user to team
   * POST /api/teams/:id/invite
   */
  async inviteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const teamId = parseInt(req.params.id);
      const { email, role } = req.body;

      const token = await teamService.inviteUser(teamId, userId, email, role);
      
      res.json({
        success: true,
        message: 'Invitation sent successfully',
        data: { token },
      });
    } catch (error) {
      console.error('Error inviting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to invite user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Accept invitation
   * POST /api/teams/invitations/accept
   */
  async acceptInvitation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { token } = req.body;
      const accepted = await teamService.acceptInvitation(token, userId);

      if (!accepted) {
        res.status(400).json({ success: false, message: 'Invalid or expired invitation' });
        return;
      }

      res.json({
        success: true,
        message: 'Invitation accepted successfully',
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to accept invitation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get content approvals
   * GET /api/teams/:id/approvals
   */
  async getApprovals(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const teamId = parseInt(req.params.id);
      const status = req.query.status as string | undefined;
      const approvals = await contentApprovalModel.findByTeam(teamId, status);

      res.json({
        success: true,
        data: approvals,
      });
    } catch (error) {
      console.error('Error fetching approvals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch approvals',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Approve content
   * POST /api/teams/approvals/:id/approve
   */
  async approveContent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const { notes } = req.body;

      const approved = await teamService.approveContent(id, userId, notes);

      if (!approved) {
        res.status(404).json({ success: false, message: 'Approval not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Content approved successfully',
      });
    } catch (error) {
      console.error('Error approving content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get team activity logs
   * GET /api/teams/:id/activity
   */
  async getActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const teamId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await teamService.getActivityLogs(teamId, limit);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity logs',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const teamController = new TeamController();

