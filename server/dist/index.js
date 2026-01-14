"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const db_1 = __importDefault(require("./config/db"));
const eventWorker_1 = require("./queue/eventWorker");
const ingestRoutes_1 = __importDefault(require("./routes/ingestRoutes"));
const leadRoutes_1 = __importDefault(require("./routes/leadRoutes"));
const ruleRoutes_1 = __importDefault(require("./routes/ruleRoutes"));
const seedRules_1 = require("./utils/seedRules");
const config_1 = require("./config/config");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: config_1.CLIENT_URL,
        methods: ["GET", "POST"]
    }
});
exports.io = io;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Connect to Database
(0, db_1.default)().then(() => {
    (0, seedRules_1.seedRules)();
    console.log('Database connected');
}).catch((error) => {
    console.error('Database connection error:', error);
});
// Initialize Event Worker
(0, eventWorker_1.initWorker)(io);
app.use('/api', ingestRoutes_1.default);
app.use('/api/leads', leadRoutes_1.default);
app.use('/api/rules', ruleRoutes_1.default);
app.get('/health', (req, res) => {
    res.send('API is running...');
});
const PORT = process.env.PORT || 7777;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
