import { Router } from 'express';
import { replayEvents, exportLeads, exportEvents } from '../controllers/systemController';

const router = Router();

router.post('/replay', replayEvents);
router.get('/export/leads', exportLeads);
router.get('/export/events', exportEvents);

export default router;
