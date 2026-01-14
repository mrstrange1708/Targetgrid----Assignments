import { Request, Response } from 'express';
import Lead from '../models/Lead';
import Event from '../models/Event';
import ScoringRule from '../models/ScoringRule';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalLeads = await Lead.countDocuments();
        const totalEvents = await Event.countDocuments();
        const activeRules = await ScoringRule.countDocuments({ active: true });

        // Calculate total points across all leads
        const leads = await Lead.find({}, 'current_score');
        const totalPoints = leads.reduce((sum, lead) => sum + (lead.current_score || 0), 0);

        res.json({
            totalLeads,
            totalEvents,
            activeRules,
            totalPoints
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
};

export const getCompanyDistribution = async (req: Request, res: Response) => {
    try {
        const distribution = await Lead.aggregate([
            { $group: { _id: '$company', count: { $sum: 1 }, avgScore: { $avg: '$current_score' } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const formattedData = distribution.map(item => ({
            company: item._id || 'Unknown',
            count: item.count,
            avgScore: Math.round(item.avgScore)
        }));

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching company distribution' });
    }
};

export const getEventTrends = async (req: Request, res: Response) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const trends = await Event.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const formattedTrends = trends.map(item => ({
            date: item._id,
            count: item.count
        }));

        res.json(formattedTrends);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching event trends' });
    }
};
