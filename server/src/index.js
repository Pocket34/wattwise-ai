import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import integrationRoutes from './routes/integrations.js';
import { getDb } from './db/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow local Vite client
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize SQLite Database schema & seed
getDb();

// Request logging in development
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    // console.log(`[WattWise Server] ${req.method} ${req.url}`);
  }
  next();
});

// API Routes
app.use('/api/integrations', integrationRoutes);
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'WattWise AI',
    version: '1.0.0',
    tagline: 'Samajhdaar Ghar. Kam Bill. Behtar Kal.',
    uptime: process.uptime()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('WattWise Server Unhandled Error:', err);
  res.status(500).json({
    success: false,
    error: 'An unexpected internal error occurred in WattWise Intelligence Engine'
  });
});

const server = app.listen(PORT, () => {
  console.log(`⚡ WattWise AI Backend running at http://localhost:${PORT}`);
  console.log(`🌱 Tagline: "Samajhdaar Ghar. Kam Bill. Behtar Kal."`);
});

export default app;
