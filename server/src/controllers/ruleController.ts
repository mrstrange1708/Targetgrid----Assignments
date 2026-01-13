import { Request, Response } from 'express';
import ScoringRule from '../models/ScoringRule';

export const getRules = async (req: Request, res: Response) => {
    try {
        const rules = await ScoringRule.find();
        res.json(rules);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rules' });
    }
};

export const createRule = async (req: Request, res: Response) => {
    try {
        const rule = await ScoringRule.create(req.body);
        res.status(201).json(rule);
    } catch (error) {
        res.status(400).json({ message: 'Error creating rule' });
    }
};

export const updateRule = async (req: Request, res: Response) => {
    try {
        const rule = await ScoringRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(rule);
    } catch (error) {
        res.status(400).json({ message: 'Error updating rule' });
    }
};

export const deleteRule = async (req: Request, res: Response) => {
    try {
        await ScoringRule.findByIdAndDelete(req.params.id);
        res.json({ message: 'Rule deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting rule' });
    }
};
