import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes     from './modules/auth/auth.routes';
import bdrRoutes      from './modules/bdr/bdr.routes';
import vendasRoutes   from './modules/vendas/vendas.routes';
import retencaoRoutes from './modules/retencao/retencao.routes';
import hubRoutes      from './modules/hub/hub.routes';
import comissaoRoutes from './modules/comissao/comissao.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve thumbnails do Hub enviados pelo admin
app.use('/hub/uploads/thumbnails', express.static(path.join(process.cwd(), 'uploads', 'hub', 'thumbnails')));

app.use('/api/v1/auth',     authRoutes);
app.use('/api/v1/bdr',      bdrRoutes);
app.use('/api/v1/vendas',   vendasRoutes);
app.use('/api/v1/retencao', retencaoRoutes);
app.use('/api/v1/hub',      hubRoutes);
app.use('/api/v1/comissao', comissaoRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

export default app;
