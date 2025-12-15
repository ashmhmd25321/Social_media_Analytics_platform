import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import * as crypto from 'crypto';

export interface Team {
  id?: number;
  name: string;
  description?: string;
  owner_id: number;
  plan_type: 'free' | 'basic' | 'professional' | 'enterprise';
  max_members: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface TeamMember {
  id?: number;
  team_id: number;
  user_id: number;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions?: Record<string, any>;
  invited_by?: number;
  joined_at?: Date;
  is_active: boolean;
}

export interface TeamInvitation {
  id?: number;
  team_id: number;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invited_by: number;
  token: string;
  expires_at: Date;
  accepted_at?: Date;
  created_at?: Date;
}

export interface ContentApproval {
  id?: number;
  content_id: number;
  content_type: 'draft' | 'scheduled';
  team_id: number;
  submitted_by: number;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  approver_id?: number;
  approval_notes?: string;
  approved_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface TeamActivityLog {
  id?: number;
  team_id: number;
  user_id: number;
  action_type: string;
  entity_type?: string;
  entity_id?: number;
  description?: string;
  metadata?: Record<string, any>;
  created_at?: Date;
}

class TeamModel {
  async create(team: Team): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO teams (name, description, owner_id, plan_type, max_members, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        team.name,
        team.description || null,
        team.owner_id,
        team.plan_type || 'free',
        team.max_members || 5,
        team.is_active !== undefined ? team.is_active : true,
      ]
    );

    // Add owner as team member
    const teamMemberModel = new TeamMemberModel();
    await teamMemberModel.addMember(result.insertId, {
      team_id: result.insertId,
      user_id: team.owner_id,
      role: 'owner',
      is_active: true,
    });

    return result.insertId;
  }

  async findById(id: number): Promise<Team | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM teams WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    return this.mapRowToTeam(rows[0]);
  }

  async findByOwner(ownerId: number): Promise<Team[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM teams WHERE owner_id = ? AND is_active = TRUE ORDER BY created_at DESC',
      [ownerId]
    );
    return rows.map(row => this.mapRowToTeam(row));
  }

  async findByMember(userId: number): Promise<Team[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT t.* FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
       ORDER BY t.created_at DESC`,
      [userId]
    );
    return rows.map(row => this.mapRowToTeam(row));
  }

  async update(id: number, updates: Partial<Team>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.plan_type !== undefined) {
      fields.push('plan_type = ?');
      values.push(updates.plan_type);
    }
    if (updates.max_members !== undefined) {
      fields.push('max_members = ?');
      values.push(updates.max_members);
    }
    if (updates.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.is_active);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE teams SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM teams WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  private mapRowToTeam(row: RowDataPacket): Team {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      owner_id: row.owner_id,
      plan_type: row.plan_type,
      max_members: row.max_members,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

class TeamMemberModel {
  async addMember(teamId: number, member: TeamMember): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO team_members (team_id, user_id, role, permissions, invited_by, is_active)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role), is_active = VALUES(is_active)`,
      [
        teamId,
        member.user_id,
        member.role,
        member.permissions ? JSON.stringify(member.permissions) : null,
        member.invited_by || null,
        member.is_active !== undefined ? member.is_active : true,
      ]
    );
    return result.insertId;
  }

  async findByTeam(teamId: number): Promise<TeamMember[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT tm.*, u.email, u.first_name, u.last_name, u.profile_picture_url
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ? AND tm.is_active = TRUE
       ORDER BY tm.role, tm.joined_at`,
      [teamId]
    );
    return rows.map(row => this.mapRowToMember(row));
  }

  async findByUser(userId: number): Promise<TeamMember[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM team_members WHERE user_id = ? AND is_active = TRUE',
      [userId]
    );
    return rows.map(row => this.mapRowToMember(row));
  }

  async findMember(teamId: number, userId: number): Promise<TeamMember | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM team_members WHERE team_id = ? AND user_id = ?',
      [teamId, userId]
    );
    if (rows.length === 0) return null;
    return this.mapRowToMember(rows[0]);
  }

  async updateRole(teamId: number, userId: number, role: string, permissions?: Record<string, any>): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE team_members SET role = ?, permissions = ?, updated_at = NOW()
       WHERE team_id = ? AND user_id = ?`,
      [
        role,
        permissions ? JSON.stringify(permissions) : null,
        teamId,
        userId,
      ]
    );
    return result.affectedRows > 0;
  }

  async removeMember(teamId: number, userId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE team_members SET is_active = FALSE WHERE team_id = ? AND user_id = ?',
      [teamId, userId]
    );
    return result.affectedRows > 0;
  }

  private mapRowToMember(row: RowDataPacket): TeamMember {
    return {
      id: row.id,
      team_id: row.team_id,
      user_id: row.user_id,
      role: row.role,
      permissions: row.permissions ? (typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions) : undefined,
      invited_by: row.invited_by,
      joined_at: row.joined_at,
      is_active: row.is_active,
    };
  }
}

class TeamInvitationModel {
  async create(invitation: Omit<TeamInvitation, 'id' | 'token' | 'created_at'>): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    await pool.execute(
      `INSERT INTO team_invitations (team_id, email, role, invited_by, token, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        invitation.team_id,
        invitation.email,
        invitation.role,
        invitation.invited_by,
        token,
        expiresAt,
      ]
    );

    return token;
  }

  async findByToken(token: string): Promise<TeamInvitation | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM team_invitations WHERE token = ? AND expires_at > NOW() AND accepted_at IS NULL',
      [token]
    );
    if (rows.length === 0) return null;
    return this.mapRowToInvitation(rows[0]);
  }

  async findByTeam(teamId: number): Promise<TeamInvitation[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM team_invitations WHERE team_id = ? AND accepted_at IS NULL ORDER BY created_at DESC',
      [teamId]
    );
    return rows.map(row => this.mapRowToInvitation(row));
  }

  async acceptInvitation(token: string, userId: number): Promise<boolean> {
    const invitation = await this.findByToken(token);
    if (!invitation) return false;

    // Add user to team
    const teamMemberModel = new TeamMemberModel();
    await teamMemberModel.addMember(invitation.team_id, {
      team_id: invitation.team_id,
      user_id: userId,
      role: invitation.role,
      invited_by: invitation.invited_by,
      is_active: true,
    });

    // Mark invitation as accepted
    await pool.execute(
      'UPDATE team_invitations SET accepted_at = NOW() WHERE token = ?',
      [token]
    );

    return true;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM team_invitations WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  private mapRowToInvitation(row: RowDataPacket): TeamInvitation {
    return {
      id: row.id,
      team_id: row.team_id,
      email: row.email,
      role: row.role,
      invited_by: row.invited_by,
      token: row.token,
      expires_at: row.expires_at,
      accepted_at: row.accepted_at,
      created_at: row.created_at,
    };
  }
}

class ContentApprovalModel {
  async create(approval: Omit<ContentApproval, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO content_approvals (content_id, content_type, team_id, submitted_by, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        approval.content_id,
        approval.content_type,
        approval.team_id,
        approval.submitted_by,
        approval.status || 'pending',
      ]
    );
    return result.insertId;
  }

  async findByTeam(teamId: number, status?: string): Promise<ContentApproval[]> {
    let query = 'SELECT * FROM content_approvals WHERE team_id = ?';
    const params: any[] = [teamId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => this.mapRowToApproval(row));
  }

  async findById(id: number): Promise<ContentApproval | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM content_approvals WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    return this.mapRowToApproval(rows[0]);
  }

  async approve(id: number, approverId: number, notes?: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE content_approvals 
       SET status = 'approved', approver_id = ?, approval_notes = ?, approved_at = NOW()
       WHERE id = ?`,
      [approverId, notes || null, id]
    );
    return result.affectedRows > 0;
  }

  async reject(id: number, approverId: number, notes?: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE content_approvals 
       SET status = 'rejected', approver_id = ?, approval_notes = ?, approved_at = NOW()
       WHERE id = ?`,
      [approverId, notes || null, id]
    );
    return result.affectedRows > 0;
  }

  async requestChanges(id: number, approverId: number, notes: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE content_approvals 
       SET status = 'changes_requested', approver_id = ?, approval_notes = ?
       WHERE id = ?`,
      [approverId, notes, id]
    );
    return result.affectedRows > 0;
  }

  private mapRowToApproval(row: RowDataPacket): ContentApproval {
    return {
      id: row.id,
      content_id: row.content_id,
      content_type: row.content_type,
      team_id: row.team_id,
      submitted_by: row.submitted_by,
      status: row.status,
      approver_id: row.approver_id,
      approval_notes: row.approval_notes,
      approved_at: row.approved_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

class TeamActivityLogModel {
  async create(log: Omit<TeamActivityLog, 'id' | 'created_at'>): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO team_activity_logs (team_id, user_id, action_type, entity_type, entity_id, description, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        log.team_id,
        log.user_id,
        log.action_type,
        log.entity_type || null,
        log.entity_id || null,
        log.description || null,
        log.metadata ? JSON.stringify(log.metadata) : null,
      ]
    );
    return result.insertId;
  }

  async findByTeam(teamId: number, limit: number = 50): Promise<TeamActivityLog[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT tal.*, u.email, u.first_name, u.last_name
       FROM team_activity_logs tal
       JOIN users u ON tal.user_id = u.id
       WHERE tal.team_id = ?
       ORDER BY tal.created_at DESC
       LIMIT ?`,
      [teamId, limit]
    );
    return rows.map(row => this.mapRowToLog(row));
  }

  private mapRowToLog(row: RowDataPacket): TeamActivityLog {
    return {
      id: row.id,
      team_id: row.team_id,
      user_id: row.user_id,
      action_type: row.action_type,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      description: row.description,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      created_at: row.created_at,
    };
  }
}

export const teamModel = new TeamModel();
export const teamMemberModel = new TeamMemberModel();
export const teamInvitationModel = new TeamInvitationModel();
export const contentApprovalModel = new ContentApprovalModel();
export const teamActivityLogModel = new TeamActivityLogModel();

