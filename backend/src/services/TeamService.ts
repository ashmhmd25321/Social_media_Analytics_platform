import { teamModel, teamMemberModel, teamInvitationModel, contentApprovalModel, teamActivityLogModel } from '../models/Team';
import { Team, TeamMember, TeamInvitation, ContentApproval } from '../models/Team';
import { emailService } from './EmailService';

class TeamService {
  /**
   * Create a new team
   */
  async createTeam(userId: number, teamData: Omit<Team, 'id' | 'owner_id' | 'created_at' | 'updated_at'>): Promise<number> {
    const teamId = await teamModel.create({
      ...teamData,
      owner_id: userId,
    });

    // Log activity
    await teamActivityLogModel.create({
      team_id: teamId,
      user_id: userId,
      action_type: 'team_created',
      entity_type: 'team',
      entity_id: teamId,
      description: `Team "${teamData.name}" was created`,
    });

    return teamId;
  }

  /**
   * Invite a user to a team
   */
  async inviteUser(teamId: number, invitedBy: number, email: string, role: string): Promise<string> {
    // Check if user is already a member
    const existingMember = await teamMemberModel.findMember(teamId, 0); // We'll check by email later
    
    const token = await teamInvitationModel.create({
      team_id: teamId,
      email,
      role: role as any,
      invited_by: invitedBy,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Log activity
    await teamActivityLogModel.create({
      team_id: teamId,
      user_id: invitedBy,
      action_type: 'member_invited',
      entity_type: 'invitation',
      description: `Invited ${email} to team`,
    });

    // TODO: Send invitation email
    // await emailService.sendTeamInvitation(email, token, teamId);

    return token;
  }

  /**
   * Accept team invitation
   */
  async acceptInvitation(token: string, userId: number): Promise<boolean> {
    const accepted = await teamInvitationModel.acceptInvitation(token, userId);
    
    if (accepted) {
      const invitation = await teamInvitationModel.findByToken(token);
      if (invitation) {
        // Log activity
        await teamActivityLogModel.create({
          team_id: invitation.team_id,
          user_id: userId,
          action_type: 'member_joined',
          entity_type: 'member',
          description: 'Joined team via invitation',
        });
      }
    }

    return accepted;
  }

  /**
   * Submit content for approval
   */
  async submitForApproval(
    contentId: number,
    contentType: 'draft' | 'scheduled',
    teamId: number,
    submittedBy: number
  ): Promise<number> {
    const approvalId = await contentApprovalModel.create({
      content_id: contentId,
      content_type: contentType,
      team_id: teamId,
      submitted_by: submittedBy,
      status: 'pending',
    });

    // Log activity
    await teamActivityLogModel.create({
      team_id: teamId,
      user_id: submittedBy,
      action_type: 'content_submitted',
      entity_type: 'approval',
      entity_id: approvalId,
      description: `Content submitted for approval`,
    });

    return approvalId;
  }

  /**
   * Approve content
   */
  async approveContent(approvalId: number, approverId: number, notes?: string): Promise<boolean> {
    const approved = await contentApprovalModel.approve(approvalId, approverId, notes);
    
    if (approved) {
      const approval = await contentApprovalModel.findById(approvalId);
      if (approval) {
        // Log activity
        await teamActivityLogModel.create({
          team_id: approval.team_id,
          user_id: approverId,
          action_type: 'content_approved',
          entity_type: 'approval',
          entity_id: approvalId,
          description: `Content approved`,
        });
      }
    }

    return approved;
  }

  /**
   * Get team activity logs
   */
  async getActivityLogs(teamId: number, limit: number = 50) {
    return await teamActivityLogModel.findByTeam(teamId, limit);
  }
}

export const teamService = new TeamService();

