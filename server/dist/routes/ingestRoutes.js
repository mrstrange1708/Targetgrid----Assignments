"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const ingestController_1 = require("../controllers/ingestController");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
router.post('/events', ingestController_1.ingestEvent);
router.post('/webhooks', ingestController_1.ingestWebhook);
router.post('/upload', upload.single('file'), ingestController_1.ingestBatch);
exports.default = router;
