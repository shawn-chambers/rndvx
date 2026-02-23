import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from '../../routes/authRoutes';
import userRoutes from '../../routes/userRoutes';
import meetingRoutes from '../../routes/meetingRoutes';
import inviteRoutes from '../../routes/inviteRoutes';
import groupRoutes from '../../routes/groupRoutes';
import placesRoutes from '../../routes/placesRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/places', placesRoutes);

app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status ?? 500;
res.status(status).json({ error: err.message });
});

export default app;
