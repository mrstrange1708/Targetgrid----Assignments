"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ruleController_1 = require("../controllers/ruleController");
const router = express_1.default.Router();
router.get('/', ruleController_1.getRules);
router.post('/', ruleController_1.createRule);
router.put('/:id', ruleController_1.updateRule);
router.delete('/:id', ruleController_1.deleteRule);
exports.default = router;
