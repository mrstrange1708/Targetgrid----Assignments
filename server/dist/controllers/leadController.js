"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = exports.getLeadHistory = exports.createLead = exports.getLeadById = exports.getLeads = void 0;
const Lead_1 = __importDefault(require("../models/Lead"));
const ScoreHistory_1 = __importDefault(require("../models/ScoreHistory"));
const getLeads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const leads = yield Lead_1.default.find().sort({ score: -1 });
        res.json(leads);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching leads' });
    }
});
exports.getLeads = getLeads;
const getLeadById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lead = yield Lead_1.default.findById(req.params.id);
        if (!lead)
            return res.status(404).json({ message: 'Lead not found' });
        res.json(lead);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching lead' });
    }
});
exports.getLeadById = getLeadById;
const createLead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lead = yield Lead_1.default.create(req.body);
        res.status(201).json(lead);
    }
    catch (error) {
        res.status(400).json({ message: 'Error creating lead' });
    }
});
exports.createLead = createLead;
const getLeadHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const history = yield ScoreHistory_1.default.find({ leadId: req.params.id }).sort({ timestamp: -1 }).populate('eventId');
        res.json(history);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching history' });
    }
});
exports.getLeadHistory = getLeadHistory;
const getLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const leads = yield Lead_1.default.find().sort({ score: -1 }).limit(10);
        res.json(leads);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
});
exports.getLeaderboard = getLeaderboard;
