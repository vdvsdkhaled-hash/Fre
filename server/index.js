import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { fileRouter } from './routes/files.js';
import { aiRouter } from './routes/ai.js';
import { setupWebSocket } from './websocket.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/files', fileRouter);
app.use('/api/ai', aiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    model: process.env.GEMINI_MODEL || 'gemini-3-flash',
    timestamp: new Date().toISOString()
  });
});

// WebSocket setup
setupWebSocket(wss);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🤖 AI Model: ${process.env.GEMINI_MODEL || 'gemini-3-flash'}`);
  console.log(`🧠 Deep Thinking: ${process.env.ENABLE_DEEP_THINKING === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`🧪 TDD Mode: ${process.env.ENABLE_TDD === 'true' ? 'Enabled' : 'Disabled'}`);
});

export { app, server, wss };
