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
        const { range = '7d' } = req.query;
        const now = new Date();
        const startDate = new Date();
        let format = "%Y-%m-%d";
        let gapType: 'day' | 'month' = 'day';
        let iterations = 7;

        switch (range) {
            case '30d':
                startDate.setDate(now.getDate() - 30);
                iterations = 30;
                break;
            case '6m':
                startDate.setMonth(now.getMonth() - 6);
                format = "%Y-%m";
                gapType = 'month';
                iterations = 6;
                break;
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1);
                format = "%Y-%m";
                gapType = 'month';
                iterations = 12;
                break;
            case '7d':
            default:
                startDate.setDate(now.getDate() - 7);
                iterations = 7;
                break;
        }
        startDate.setHours(0, 0, 0, 0);

        const trends = await Event.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: format, date: "$timestamp" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const trendMap = new Map(trends.map(t => [t._id, t.count]));
        const formattedTrends = [];

        for (let i = iterations - 1; i >= 0; i--) {
            const date = new Date();
            if (gapType === 'day') {
                date.setDate(date.getDate() - i);
            } else {
                date.setMonth(date.getMonth() - i);
            }

            const dateStr = date.toISOString().split('T')[0].substring(0, gapType === 'day' ? 10 : 7);

            // For display formatting: "Jan 24" or "Jan 12"
            const label = gapType === 'day'
                ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

            formattedTrends.push({
                date: dateStr,
                label: label,
                count: trendMap.get(dateStr) || 0
            });
        }

        res.json(formattedTrends);
    } catch (error) {
        console.error('Trend Error:', error);
        res.status(500).json({ message: 'Error fetching event trends' });
    }
};

export const getEventPatterns = async (req: Request, res: Response) => {
    try {
        // Simple pattern: Count occurrences of each event type
        // Enhanced: We could look for sequences, but let's start with distribution
        const patterns = await Event.aggregate([
            {
                $group: {
                    _id: "$event_type",
                    count: { $sum: 1 },
                    leads: { $addToSet: "$lead_id" }
                }
            },
            {
                $project: {
                    event_type: "$_id",
                    count: 1,
                    uniqueLeads: { $size: "$leads" }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Find common "Conversion" paths (Events before PURCHASE)
        const conversions = await Event.aggregate([
            { $match: { event_type: 'PURCHASE' } },
            { $sort: { timestamp: 1 } },
            {
                $lookup: {
                    from: 'events',
                    let: { leadId: '$lead_id', purchaseTime: '$timestamp' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$lead_id', '$$leadId'] },
                                        { $lt: ['$timestamp', '$$purchaseTime'] }
                                    ]
                                }
                            }
                        },
                        { $sort: { timestamp: -1 } },
                        { $limit: 1 }
                    ],
                    as: 'priorEvent'
                }
            },
            { $unwind: { path: '$priorEvent', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$priorEvent.event_type',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            distribution: patterns,
            conversionDrivers: conversions.map(c => ({
                prior_event: c._id || 'Direct',
                conversions: c.count
            }))
        });
    } catch (error) {
        console.error('Analytics Pattern Error:', error);
        res.status(500).json({ message: 'Error fetching event patterns' });
    }
};
