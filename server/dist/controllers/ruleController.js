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
exports.deleteRule = exports.updateRule = exports.createRule = exports.getRules = void 0;
const ScoringRule_1 = __importDefault(require("../models/ScoringRule"));
const getRules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rules = yield ScoringRule_1.default.find();
        res.json(rules);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching rules' });
    }
});
exports.getRules = getRules;
const createRule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rule = yield ScoringRule_1.default.create(req.body);
        res.status(201).json(rule);
    }
    catch (error) {
        res.status(400).json({ message: 'Error creating rule' });
    }
});
exports.createRule = createRule;
const updateRule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rule = yield ScoringRule_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(rule);
    }
    catch (error) {
        res.status(400).json({ message: 'Error updating rule' });
    }
});
exports.updateRule = updateRule;
const deleteRule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ScoringRule_1.default.findByIdAndDelete(req.params.id);
        res.json({ message: 'Rule deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting rule' });
    }
});
exports.deleteRule = deleteRule;
