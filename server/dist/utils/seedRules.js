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
exports.seedRules = void 0;
const ScoringRule_1 = __importDefault(require("../models/ScoringRule"));
const seedRules = () => __awaiter(void 0, void 0, void 0, function* () {
    const rules = [
        { event_type: 'EMAIL_OPEN', points: 10 },
        { event_type: 'PAGE_VIEW', points: 5 },
        { event_type: 'FORM_SUBMISSION', points: 20 },
        { event_type: 'DEMO_REQUEST', points: 50 },
        { event_type: 'PURCHASE', points: 100 },
    ];
    for (const rule of rules) {
        const exists = yield ScoringRule_1.default.findOne({ event_type: rule.event_type });
        if (!exists) {
            yield ScoringRule_1.default.create(rule);
            console.log(`Seeded rule: ${rule.event_type}`);
        }
    }
});
exports.seedRules = seedRules;
