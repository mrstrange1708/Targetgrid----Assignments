"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const leadController_1 = require("../controllers/leadController");
const router = express_1.default.Router();
router.get('/', leadController_1.getLeads);
router.post('/', leadController_1.createLead);
router.get('/leaderboard', leadController_1.getLeaderboard);
router.get('/:id', leadController_1.getLeadById);
router.get('/:id/history', leadController_1.getLeadHistory);
exports.default = router;
