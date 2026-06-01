import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import summarizerRoutes from './routes/summarizer.js';
import quizRoutes from './routes/quiz.js';
import plannerRoutes from './routes/planner.js';
import profileRoutes from './routes/profile.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:4173',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // Izinkan jika tidak ada origin (curl/Postman) atau origin ada di whitelist
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('[CORS] Blocked origin:', origin, '| Allowed:', allowed);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/summarizer', summarizerRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Study Buddy API is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Study Buddy Backend running on http://localhost:${PORT}`);
});