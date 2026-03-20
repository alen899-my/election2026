import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import uploadRoutes from './routes/upload.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

import candidateRoutes from './routes/candidates.routes';
import constituencyRoutes from './routes/constituencies.routes';
import partyRoutes from './routes/parties.routes';
import searchRoutes from './routes/search.routes';
import scraperRoutes from './routes/scraper.routes';
import districtRoutes from './routes/districts.routes';

// Routing configuration
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/candidates', candidateRoutes);
app.use('/api/v1/constituencies', constituencyRoutes);
app.use('/api/v1/parties', partyRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/scraper', scraperRoutes);
app.use('/api/v1/districts', districtRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*', // For dev mode strictly
    methods: ['GET', 'POST']
  }
});

// Phase 2: Live Results Broadcaster Engine
io.on('connection', (socket) => {
  console.log(`[socket] Client connected establishing Live Feed: ${socket.id}`);
  
  // Initialize generic mock data pushing simulating a scraper updating the pool
  const intervalId = setInterval(() => {
    socket.emit('live-tick', {
      timestamp: new Date().toISOString(),
      LDF: Math.floor(Math.random() * (75 - 69 + 1)) + 69,
      UDF: Math.floor(Math.random() * (45 - 39 + 1)) + 39,
      NDA: Math.floor(Math.random() * (3 - 0 + 1)) + 0,
      recent: `Trivandrum: LDF takes narrow lead of ${Math.floor(Math.random() * 2000)} votes.`
    });
  }, 4000);

  socket.on('disconnect', () => {
    clearInterval(intervalId);
    console.log(`[socket] Connection closed: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`[server] Backend API + WebSocket Active running at http://localhost:${port}`);
});
