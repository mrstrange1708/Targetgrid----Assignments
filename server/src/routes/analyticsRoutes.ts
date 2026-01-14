import { Router } from 'express';
import { getDashboardStats, getCompanyDistribution, getEventTrends } from '../controllers/analyticsController';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/companies', getCompanyDistribution);
router.get('/trends', getEventTrends);

export default router;
