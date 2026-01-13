import express from 'express';
import { getLeads, getLeadById, createLead, getLeadHistory, getLeaderboard } from '../controllers/leadController';

const router = express.Router();

router.get('/', getLeads);
router.post('/', createLead);
router.get('/leaderboard', getLeaderboard);
router.get('/:id', getLeadById);
router.get('/:id/history', getLeadHistory);

export default router;
