import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';
import { initWorker } from './queue/eventWorker';
import ingestRoutes from './routes/ingestRoutes';
import leadRoutes from './routes/leadRoutes';
import ruleRoutes from './routes/ruleRoutes';
import { seedRules } from './utils/seedRules';
import { CLIENT_URL } from './config/config';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: CLIENT_URL,
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Connect to Database
connectDB().then(() => {
    seedRules();
    console.log('Database connected');
}).catch((error) => {
    console.error('Database connection error:', error);
});

// Initialize Event Worker
initWorker(io);

app.use('/api', ingestRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/rules', ruleRoutes);

app.get('/health', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 7777;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export { io };
