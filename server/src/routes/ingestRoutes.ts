import express from 'express';
import multer from 'multer';
import { ingestEvent, ingestWebhook, ingestBatch } from '../controllers/ingestController';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/events', ingestEvent);
router.post('/webhooks', ingestWebhook);
router.post('/upload', upload.single('file'), ingestBatch);

export default router;
