import { Request, Response } from 'express';
import Lead from '../models/Lead';
import ScoreHistory from '../models/ScoreHistory';

export const getLeads = async (req: Request, res: Response) => {
    try {
        const { sortBy = 'current_score', order = 'desc', company, search } = req.query;

        const query: any = {};
        if (company) {
            query.company = company;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOptions: any = {};
        sortOptions[sortBy as string] = order === 'asc' ? 1 : -1;

        const leads = await Lead.find(query).sort(sortOptions);
        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leads' });
    }
};

export const getLeadById = async (req: Request, res: Response) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });
        res.json(lead);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching lead' });
    }
};

export const createLead = async (req: Request, res: Response) => {
    try {
        const lead = await Lead.create(req.body);
        res.status(201).json(lead);
    } catch (error) {
        res.status(400).json({ message: 'Error creating lead' });
    }
};

export const getLeadHistory = async (req: Request, res: Response) => {
    try {
        const history = await ScoreHistory.find({ lead_id: req.params.id }).sort({ timestamp: -1 }).populate('eventId');
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history' });
    }
};

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const leads = await Lead.find().sort({ current_score: -1 }).limit(10);
        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
}
