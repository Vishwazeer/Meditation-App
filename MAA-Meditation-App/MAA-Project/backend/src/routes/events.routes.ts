/**
 * File: events.routes.ts
 *
 * Description: Defines API routes for live events including live and upcoming lists,
 * reminders, and viewer counts.
 */

import { Router } from 'express';
import {
  getLiveEvents,
  getUpcomingEvents,
  getPastEvents,
  getEventById,
  setReminder,
  deleteReminder,
  getEventViewers
} from '../controllers/events.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validator.middleware';
import { uuidParamSchema } from '../validators/user.validator';

const router = Router();

// GET /api/events/live
router.get('/live', authenticateToken, getLiveEvents);

// GET /api/events/upcoming
router.get('/upcoming', authenticateToken, getUpcomingEvents);

// GET /api/events/past
router.get('/past', authenticateToken, getPastEvents);

// GET /api/events/:id
router.get('/:id', authenticateToken, validate(uuidParamSchema, 'params'), getEventById);

// POST /api/events/:id/reminder
router.post('/:id/reminder', authenticateToken, validate(uuidParamSchema, 'params'), setReminder);

// DELETE /api/events/:id/reminder
router.delete('/:id/reminder', authenticateToken, validate(uuidParamSchema, 'params'), deleteReminder);

// GET /api/events/:id/viewers
router.get('/:id/viewers', authenticateToken, validate(uuidParamSchema, 'params'), getEventViewers);

export default router;
