import { Request, Response } from 'express';
import { reportModel, reportTemplateModel } from '../models/Report';
import { reportGenerationService } from '../services/ReportGenerationService';

export class ReportController {
  /**
   * Create a new report
   * POST /api/reports
   */
  async createReport(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const reportId = await reportModel.create({
        user_id: userId,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: { id: reportId },
      });
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get all reports for a user
   * GET /api/reports?status=completed&limit=50&offset=0
   */
  async getReports(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const reports = await reportModel.findByUser(userId, status, limit, offset);
      res.json({ success: true, data: reports });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reports',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get a single report
   * GET /api/reports/:id
   */
  async getReport(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const report = await reportModel.findById(id, userId);

      if (!report) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
      }

      res.json({ success: true, data: report });
    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate a report
   * POST /api/reports/:id/generate
   */
  async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const report = await reportGenerationService.generateReport(id, userId);

      res.json({
        success: true,
        message: 'Report generated successfully',
        data: report,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete a report
   * DELETE /api/reports/:id
   */
  async deleteReport(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const deleted = await reportModel.delete(id, userId);

      if (!deleted) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
      }

      res.json({ success: true, message: 'Report deleted successfully' });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get report templates
   * GET /api/reports/templates
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const templates = await reportTemplateModel.findByUser(userId, true);
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch templates',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create a report template
   * POST /api/reports/templates
   */
  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const templateId = await reportTemplateModel.create({
        user_id: userId,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: { id: templateId },
      });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create template',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const reportController = new ReportController();

